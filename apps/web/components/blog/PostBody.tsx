import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders the post's Markdown with brand typography. react-markdown never
 * injects raw HTML, so admin-authored content stays XSS-safe by construction.
 */
export function PostBody({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-5 text-base leading-relaxed text-navy/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="mt-10 text-2xl font-extrabold tracking-wide text-navy">{children}</h2>
          ),
          h2: ({ children }) => (
            <h2 className="mt-10 text-2xl font-extrabold tracking-wide text-navy">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-8 text-xl font-bold tracking-wide text-navy">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-6 font-bold text-navy">{children}</h4>
          ),
          a: ({ href, children }) => {
            // Only true external links open a new tab; in-page anchors
            // (e.g. remark-gfm footnotes) and relative links navigate normally.
            const external = typeof href === "string" && /^https?:\/\//.test(href);
            return (
              <a
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="font-semibold text-navy underline decoration-accent decoration-2 underline-offset-2 hover:text-accent-strong"
              >
                {children}
              </a>
            );
          },
          ul: ({ children }) => <ul className="list-disc space-y-2 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-2 pl-6">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-accent bg-canvas px-5 py-3 text-steel [&_p]:m-0">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) =>
            className ? (
              // Block code (inside <pre>): className carries the language.
              <code className={`${className} font-mono text-sm`}>{children}</code>
            ) : (
              <code className="rounded bg-navy/5 px-1.5 py-0.5 font-mono text-[0.875em] text-navy">
                {children}
              </code>
            ),
          pre: ({ children }) => (
            // Neutralize the inline-code styling inside blocks — fenced code
            // without a language has no className and would otherwise render
            // with the navy-on-navy inline treatment.
            <pre className="overflow-x-auto rounded-xl bg-navy p-5 text-white [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm [&_td]:border [&_td]:border-navy/10 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-navy/10 [&_th]:bg-canvas [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-bold">
                {children}
              </table>
            </div>
          ),
          hr: () => <hr className="border-navy/10" />,
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element -- author-provided URL, images unoptimized in this app
            <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" className="rounded-xl" />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
