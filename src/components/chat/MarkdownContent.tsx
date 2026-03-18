import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface Props {
  content: string;
}

const components: Components = {
  // Headings
  h1: ({ children }) => (
    <h1 className="mb-2 mt-3 font-display text-lg leading-tight first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1.5 mt-3 font-display text-base leading-tight first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-2.5 font-body text-sm font-semibold leading-tight first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-1 mt-2 font-body text-sm font-medium leading-tight first:mt-0">{children}</h4>
  ),

  // Paragraph
  p: ({ children }) => (
    <p className="mb-2 last:mb-0">{children}</p>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-0.5 pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-0.5 pl-4 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="pl-0.5">{children}</li>
  ),

  // Code
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className={`${className ?? ''} block`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-pheno-bg-secondary px-1 py-0.5 font-mono text-[12px] text-pheno-text-primary" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-md bg-pheno-bg-base p-3 font-mono text-[12px] leading-relaxed text-pheno-text-secondary last:mb-0">
      {children}
    </pre>
  ),

  // Table
  table: ({ children }) => (
    <div className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-pheno-border bg-pheno-bg-secondary">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-2 py-1.5 text-left font-medium text-pheno-text-secondary">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-t border-pheno-border/50 px-2 py-1.5 text-pheno-text-primary">{children}</td>
  ),

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-pheno-accent/40 pl-3 text-pheno-text-secondary last:mb-0">
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => (
    <hr className="my-3 border-pheno-border" />
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-pheno-accent underline decoration-pheno-accent/30 hover:decoration-pheno-accent"
    >
      {children}
    </a>
  ),

  // Strong / emphasis
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em>{children}</em>
  ),
};

export const MarkdownContent = React.memo(function MarkdownContent({ content }: Props) {
  return (
    <div className="prose-chat break-words font-body text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
