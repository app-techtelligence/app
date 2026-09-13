//! M1 spike — a local PTY bridge.
//!
//! Throwaway code. Its only job is to let the browser probe in `../web` talk to a real
//! shell so we can measure end-to-end keypress→glyph latency and PTY throughput on the
//! target OS. It is NOT a prototype of `mosaicod`: no session persistence, no parsing, no
//! ring buffers, no subscription tiers. See ../../docs/02-architecture.md for the real
//! design.
//!
//! Security posture, even for a spike (see ../../docs/04-security.md § 1):
//!   * binds 127.0.0.1 only, never 0.0.0.0
//!   * a random per-run token is required on the WebSocket upgrade, so another page
//!     you happen to have open cannot attach to your shell
//!
//! Usage:
//!   cargo run --release                 serve on 127.0.0.1:7333 and print the URL
//!   cargo run --release -- --port 9000  pick the port
//!   cargo run --release -- emit --mb 50 print 50 MB to stdout (the throughput payload)

use std::io::{Read, Write};
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use anyhow::{anyhow, Context, Result};
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Query, State};
use axum::response::{Html, IntoResponse};
use axum::routing::get;
use axum::Router;
use futures_util::{SinkExt, StreamExt};
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use tokio::sync::mpsc;

const DEFAULT_PORT: u16 = 7333;
const READ_BUF: usize = 16 * 1024;

#[derive(Clone)]
struct AppState {
    token: Arc<String>,
}

fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().skip(1).collect();

    // `emit` runs inside the PTY as the throughput payload. Keep it dead simple and
    // synchronous — it must not be the bottleneck we are trying to measure.
    if args.first().map(String::as_str) == Some("emit") {
        let mb = arg_value(&args, "--mb").and_then(|v| v.parse::<usize>().ok()).unwrap_or(50);
        return emit(mb);
    }

    let port = arg_value(&args, "--port")
        .and_then(|v| v.parse::<u16>().ok())
        .unwrap_or(DEFAULT_PORT);

    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()?
        .block_on(serve(port))
}

fn arg_value(args: &[String], flag: &str) -> Option<String> {
    let i = args.iter().position(|a| a == flag)?;
    args.get(i + 1).cloned()
}

/// Print `mb` megabytes of printable text with realistic line lengths.
///
/// Deliberately NOT random bytes: we want to measure a terminal rendering plausible
/// output, and a wall of high-entropy noise defeats every sensible optimisation in a way
/// real output does not.
fn emit(mb: usize) -> Result<()> {
    let stdout = std::io::stdout();
    let mut out = std::io::BufWriter::with_capacity(1 << 20, stdout.lock());
    let mut line = String::with_capacity(100);
    let total = mb * 1024 * 1024;
    let mut written = 0usize;
    let mut n: u64 = 0;

    while written < total {
        line.clear();
        // A shape that looks like a build log: an index, a path, a status.
        line.push_str(&format!(
            "[{n:>8}] src/module_{:03}/file_{:04}.rs  compiled in {:>3}ms  ok\n",
            n % 128,
            n % 4096,
            40 + (n % 160)
        ));
        out.write_all(line.as_bytes())?;
        written += line.len();
        n += 1;
    }
    out.flush()?;
    Ok(())
}

async fn serve(port: u16) -> Result<()> {
    let token = Arc::new(random_token());
    let addr = SocketAddr::from(([127, 0, 0, 1], port));

    let mut app = Router::new().route("/ws", get(ws_upgrade));

    // If the web probe has been built, serve it from here so the whole spike is one
    // process and one URL. During development, `pnpm dev` in ../web is nicer.
    //
    // ServeDir must own "/" — a `route("/", …)` here would shadow it and quietly serve
    // the placeholder page instead of the built probe.
    let dist = web_dist();
    if dist.is_dir() {
        app = app.fallback_service(tower_http::services::ServeDir::new(&dist));
        println!("serving built probe from {}", dist.display());
    } else {
        app = app.route("/", get(index));
        println!("no built probe at {} — run `pnpm build` in spike/web, or use `pnpm dev`", dist.display());
    }

    let app = app.with_state(AppState { token: token.clone() });

    let listener = tokio::net::TcpListener::bind(addr).await
        .with_context(|| format!("binding {addr} — is another copy already running?"))?;

    println!();
    println!("  PTY bridge ready");
    println!("  open        http://127.0.0.1:{port}/?token={token}");
    println!("  ws endpoint ws://127.0.0.1:{port}/ws?token={token}");
    println!();
    println!("  Ctrl+C to stop.");

    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await?;
    Ok(())
}

fn web_dist() -> PathBuf {
    // Works both from `cargo run` inside spike/pty and from a copied binary next to dist/.
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    manifest.join("../web/dist")
}

fn random_token() -> String {
    let mut bytes = [0u8; 16];
    getrandom::fill(&mut bytes).expect("os rng");
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

async fn index() -> impl IntoResponse {
    Html(
        "<h1>mosaico spike — PTY bridge</h1>\
         <p>The bridge is running. The probe UI is not built here.</p>\
         <p>Run <code>pnpm dev</code> in <code>spike/web</code> and open the URL it prints, \
         or run <code>pnpm build</code> and reload this page.</p>",
    )
}

async fn ws_upgrade(
    State(state): State<AppState>,
    Query(params): Query<std::collections::HashMap<String, String>>,
    ws: WebSocketUpgrade,
) -> impl IntoResponse {
    // Constant-time comparison is overkill for a localhost spike token, but rejecting
    // without a token at all would let any page you have open drive your shell.
    match params.get("token") {
        Some(t) if t.as_str() == state.token.as_str() => {
            ws.on_upgrade(|socket| async move {
                if let Err(e) = pty_session(socket).await {
                    eprintln!("session ended: {e:#}");
                }
            })
            .into_response()
        }
        _ => (axum::http::StatusCode::FORBIDDEN, "bad or missing token").into_response(),
    }
}

/// Bridge one WebSocket to one PTY for the life of the connection.
///
/// Binary frames are raw PTY bytes in both directions. Text frames are JSON control
/// messages from the browser: `{"t":"resize","cols":N,"rows":N}` and
/// `{"t":"bench","mb":N}`.
async fn pty_session(socket: WebSocket) -> Result<()> {
    let pty = native_pty_system();
    let pair = pty
        .openpty(PtySize { rows: 24, cols: 80, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| anyhow!("openpty: {e}"))?;

    let mut cmd = CommandBuilder::new(default_shell()?);
    if let Ok(cwd) = std::env::current_dir() {
        cmd.cwd(cwd);
    }
    // xterm.js identifies as xterm-256color; tell the shell the truth.
    cmd.env("TERM", "xterm-256color");

    let mut child = pair.slave.spawn_command(cmd).map_err(|e| anyhow!("spawn: {e}"))?;
    drop(pair.slave);

    let mut reader = pair.master.try_clone_reader().map_err(|e| anyhow!("reader: {e}"))?;
    let writer = Arc::new(Mutex::new(
        pair.master.take_writer().map_err(|e| anyhow!("writer: {e}"))?,
    ));
    let master = Arc::new(Mutex::new(pair.master));

    let (out_tx, mut out_rx) = mpsc::channel::<Vec<u8>>(256);

    // PTY reads are blocking; keep them off the async runtime entirely.
    let reader_task = tokio::task::spawn_blocking(move || {
        let mut buf = vec![0u8; READ_BUF];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    if out_tx.blocking_send(buf[..n].to_vec()).is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
    });

    let (mut ws_tx, mut ws_rx) = socket.split();

    let send_task = tokio::spawn(async move {
        while let Some(chunk) = out_rx.recv().await {
            if ws_tx.send(Message::Binary(chunk.into())).await.is_err() {
                break;
            }
        }
        let _ = ws_tx.close().await;
    });

    let self_exe = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("mosaico-spike-pty"));

    {
        while let Some(Ok(msg)) = ws_rx.next().await {
            match msg {
                Message::Binary(bytes) => {
                    let w = writer.clone();
                    tokio::task::spawn_blocking(move || {
                        if let Ok(mut w) = w.lock() {
                            let _ = w.write_all(&bytes);
                            let _ = w.flush();
                        }
                    })
                    .await
                    .ok();
                }
                Message::Text(text) => {
                    if let Ok(v) = serde_json::from_str::<serde_json::Value>(&text) {
                        match v.get("t").and_then(|t| t.as_str()) {
                            Some("resize") => {
                                let cols = v.get("cols").and_then(|c| c.as_u64()).unwrap_or(80) as u16;
                                let rows = v.get("rows").and_then(|r| r.as_u64()).unwrap_or(24) as u16;
                                if let Ok(m) = master.lock() {
                                    let _ = m.resize(PtySize {
                                        rows,
                                        cols,
                                        pixel_width: 0,
                                        pixel_height: 0,
                                    });
                                }
                            }
                            Some("bench") => {
                                let mb = v.get("mb").and_then(|m| m.as_u64()).unwrap_or(50);
                                // Run the payload generator through the real PTY, so the
                                // measurement includes everything the OS does to the bytes.
                                let line = format!("{} emit --mb {}\r", quote(&self_exe), mb);
                                let w = writer.clone();
                                tokio::task::spawn_blocking(move || {
                                    if let Ok(mut w) = w.lock() {
                                        let _ = w.write_all(line.as_bytes());
                                        let _ = w.flush();
                                    }
                                })
                                .await
                                .ok();
                            }
                            _ => {}
                        }
                    }
                }
                Message::Close(_) => break,
                _ => {}
            }
        }
    }

    let _ = child.kill();
    send_task.abort();
    reader_task.abort();
    Ok(())
}

fn quote(p: &PathBuf) -> String {
    let s = p.display().to_string();
    if s.contains(' ') {
        format!("\"{s}\"")
    } else {
        s
    }
}

fn default_shell() -> Result<String> {
    #[cfg(windows)]
    {
        for candidate in ["pwsh.exe", "powershell.exe", "cmd.exe"] {
            if which(candidate) {
                return Ok(candidate.to_string());
            }
        }
        Ok("cmd.exe".to_string())
    }
    #[cfg(not(windows))]
    {
        Ok(std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string()))
    }
}

#[cfg(windows)]
fn which(exe: &str) -> bool {
    std::env::var_os("PATH")
        .map(|paths| {
            std::env::split_paths(&paths).any(|dir| dir.join(exe).is_file())
        })
        .unwrap_or(false)
}
