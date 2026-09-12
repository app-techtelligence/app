# Mosaico — security design

A terminal sees everything: tokens, private keys, production credentials, customer data.
It also executes arbitrary text, some of which arrives from machines you do not control.
That combination deserves a threat model, not a checklist bolted on before release.

## Threat model

| # | Threat | Mitigation |
|---|---|---|
| T1 | Another local user or process reaches your sessions through the daemon | Local transport only, restrictive permissions, peer credential verification (§ 1) |
| T2 | A remote host or a malicious log line drives your terminal through escape sequences | Restricted OSC handling, sanitized titles, no clipboard reads (§ 2) |
| T3 | Secrets in scrollback leak to disk or to a crash report | Scrollback is memory-only by default; redacted logging (§ 3, § 6) |
| T4 | A pasted command executes before you can read it | Bracketed paste, multi-line paste confirmation (§ 4) |
| T5 | A cloned repository runs commands when you open it | Workspace trust prompt (§ 5) |
| T6 | Broadcast sends a destructive command to every server at once | Explicit targeting, confirmation, profile exclusions (§ 7) |
| T7 | A dependency or a tampered release ships malicious code | Pinned lockfiles, audit gates, signed releases (§ 8) |
| T8 | The app itself is a network attack surface | There is no network listener (§ 1) |

## 1. The daemon is local-only

D10 is a security decision as much as a product one. `mosaicod` **never opens a TCP socket**,
on any interface, in any configuration. There is no port to expose, no auth to
misconfigure, and no remote-code-execution class of bug reachable from a network.

- **Windows:** a named pipe whose ACL grants only the current user's SID. Every connection
  is additionally verified: `GetNamedPipeClientProcessId`, open the process token, compare
  the SID. A pipe name is guessable — identity is checked, not assumed.
- **Linux/macOS:** a unix socket under `$XDG_RUNTIME_DIR` (or `$TMPDIR`) at mode `0600` in a
  `0700` directory, with `SO_PEERCRED` verifying the connecting uid.
- Connections that fail verification are dropped and logged. The protocol's first message
  must be `Hello`; anything else closes the connection.

Remote attach (D10's rejected option) stays out. If it is ever built it must be an
explicitly-enabled, separately-audited feature with real transport security — never a flag
that quietly binds the existing daemon to `0.0.0.0`.

## 2. Escape sequences are untrusted input

Anything a remote host, a container log or a compromised build script prints is attacker-
controlled text arriving in your terminal. Defaults:

| Sequence | Default | Why |
|---|---|---|
| OSC 52 clipboard **write** | Prompt | Useful (`ssh` + `yank`), but silently replacing your clipboard is an attack |
| OSC 52 clipboard **read** | **Denied, always** | Lets a remote host exfiltrate whatever you last copied. There is no good reason to allow it |
| OSC 8 hyperlinks | Allowed, click required | Never auto-open. Non-`http(s)` schemes show the full target and require confirmation |
| Title / icon setting (OSC 0/1/2) | Allowed, sanitized | Control characters, newlines and length are stripped before the string reaches any UI surface |
| OSC 133 command marks | Allowed | Our own shell-integration feature |
| Device-control and unknown sequences | Ignored | Parsed and discarded, never forwarded to the UI layer |

Auto-detected URLs in output are never clickable without a click, and the status bar shows
the resolved target before navigation. Homograph-suspicious hostnames are shown punycoded.

## 3. Scrollback is memory-only

**`persist_scrollback = false` is the default and the recommended setting.** Terminal
scrollback routinely contains API tokens, connection strings, private keys pasted into a
prompt, and customer data. Writing it to disk turns a comfort feature into a durable
credential store sitting in a well-known path.

If enabled: files are `0600`, live in the state directory, are excluded from crash
reports, and the setting's description in the UI states plainly what it means. Encryption
at rest, if ever added, uses the OS keystore (DPAPI, Secret Service, Keychain) — never a
homemade scheme.

Crash reports never include scrollback, environment variables, command lines, or config
values. They carry versions, a stack trace, and counters.

## 4. Paste safety

- Bracketed paste is always enabled, so applications can tell pasted text from typing.
- A paste containing a newline or carriage return shows a confirmation with the exact text
  — this is the classic "copy a command from a web page that secretly ends in `\n`" attack,
  and the confirmation is the only thing standing between it and execution.
- Pastes containing control characters other than tab/newline require confirmation and
  display them escaped.
- Large pastes are chunked with flow control, never written in one call.
- `paste.confirm = "multiline" | "always" | "never"` — `never` is available and documented
  as a downgrade.

## 5. Workspace trust

`mosaico.workspace.toml` in a project directory can launch commands. Cloning a repository
must never be enough to run them.

- Opening an unapproved workspace file shows what it will run, in full, and requires
  approval.
- Approval is recorded per absolute path **plus a hash of the file's command-bearing
  content**. Editing those commands revokes the approval and re-prompts.
- Untrusted workspaces can still be opened in a degraded mode: layout and appearance
  applied, `command` fields ignored, each pane opening a plain shell instead.
- `mosaico workspace open --trust` exists for automation and is never the default.

## 6. Logging

Default log level is `warn`. At **no** level does Mosaico log PTY content, environment
variables, command-line arguments of spawned processes, config values, or file contents.
Sessions are identified by id, never by title or `cwd`. Debug builds may log more — and
say so loudly in the UI when they do.

## 7. Broadcast guard rails

Documented in [01-product-spec.md § 8](01-product-spec.md#8-broadcast-input); restated here
because it is the app's most dangerous feature. Explicit target selection, an unmissable
visual state on every receiving pane, confirmation above a threshold, never auto-including
new panes, auto-disable on focus change, and `broadcast.exclude_profiles` so production
profiles can be made permanently ineligible.

## 8. Releases and supply chain

- Lockfiles committed; `cargo-deny` and `cargo-audit` in CI; `pnpm audit` on the frontend;
  automated dependency updates reviewed rather than auto-merged.
- The Tauri capability set is minimal and explicit: only the commands the app actually
  uses. The webview loads **no remote code** — no CDN, no analytics, no remote fonts — and
  ships a CSP that forbids it.
- Releases are built in CI from a tagged commit, with checksums published and build
  provenance attested. The updater, if enabled, verifies a signature against a pinned
  public key; an unverifiable update is refused, never "downloaded anyway".
- **Windows code signing is an unresolved cost.** Unsigned installers trigger SmartScreen
  warnings that will lose most first-time users. An OV/EV certificate is an annual expense
  (a few hundred USD) and needs a decision before the public release —
  [05-roadmap.md § Open questions](05-roadmap.md#open-questions).

## 9. Privacy

No telemetry, no analytics, no crash reporting that leaves the machine without an explicit,
per-report choice. No account, no login, no network connection at all except an
update check that can be turned off and that sends nothing but a version string.

## 10. Security process

A `SECURITY.md` with a private reporting path (GitHub private vulnerability reporting) and
a stated response commitment, before the repository goes public. For an open-source
terminal, "how do I report this quietly?" must have an obvious answer on day one.
