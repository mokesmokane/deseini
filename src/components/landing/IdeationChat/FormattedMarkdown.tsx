import React from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './FormattedMarkdown.module.css';
import remarkGfm    from 'remark-gfm'     // if you use GitHub-style lists, tables, etc.
import remarkBreaks from 'remark-breaks'

// Remark plugin to force tight lists (no paragraph wrappers in list items)
function remarkForceTightLists() {
  return (tree: any) => {
    function walk(node: any) {
      if (node.type === 'list') node.spread = false;
      if (node.children) node.children.forEach(walk);
    }
    walk(tree);
  };
}

interface FormattedMarkdownProps {
  children: string;
  className?: string;
  components?: Record<string, React.ComponentType<any>>;
}

const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({
  children,
  className = '',
  components = {},
}) => {
  // Extract first bold line as header, return header and rest
  function processContent(content: string): { header?: string, body: string } {
    // normalize line-breaks
    let processed = content.replace(/\r\n|\r/g, '\n');
    // split into lines
    const lines = processed.split('\n');
    // drop leading blank lines
    while (lines[0]?.trim() === '') lines.shift();
    // drop trailing blank lines
    while (lines[lines.length - 1]?.trim() === '') lines.pop();
    // collapse multiple blank lines to just one
    const collapsed: string[] = [];
    for (const line of lines) {
      if (line.trim() === '' && collapsed[collapsed.length - 1]?.trim() === '') {
        continue;
      }
      collapsed.push(line);
    }
    // now detect a **bold** header on first non-blank line
    let header: string | undefined;
    let bodyStart = 0;
    if (/^\*\*.*\*\*:?\s*$/.test(collapsed[0])) {
      header = collapsed[0].replace(/^\*\*|\*\*:?\s*$/g, '').trim();
      bodyStart = 1;
    }
    const body = collapsed.slice(bodyStart).join('\n').trim();
    return { header, body };
  }


  // Helper to extract text from React children
  function extractText(children: React.ReactNode): string {
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) return children.map(extractText).join('');
    return '';
  }

  const defaultComponents = {
    // Root wrapper to control overall spacing
    root: ({children}: any) => <div>{children}</div>,

    // Links with proper styling
    a: ({node, ...props}: any) => (
      <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
    ),
    // Paragraphs
    p: ({node, children}: any) => {
        const text = extractText(children).trim();
        if (!text) return null;
        return (
          <p className="break-words my-1">{children}</p>
        );
      },
      ul: ({node, children, ...props}: any) => (
        <ul {...props} className="list-disc pl-5 space-y-1">
          {children}
        </ul>
      ),
      ol: ({node, children, ...props}: any) => (
        <ol {...props} className="list-decimal pl-5 space-y-1">
          {children}
        </ol>
      ),
      li: ({children, ...props}: any) => (
        <li {...props} className="ml-2">
          {children}
        </li>
      ),
    // Headings with empty check
    h1: ({node, children, ...props}: any) => {
      const text = extractText(children).trim();
      if (!text) return null;
      return <h1 {...props} className="text-2xl font-bold" />;
    },
    h2: ({node, children, ...props}: any) => {
      const text = extractText(children).trim();
      if (!text) return null;
      return <h2 {...props} className="text-xl font-bold" />;
    },
    h3: ({node, children, ...props}: any) => {
      const text = extractText(children).trim();
      if (!text) return null;
      return <h3 {...props} className="text-lg font-bold" />;
    },
    h4: ({node, children, ...props}: any) => {
      const text = extractText(children).trim();
      if (!text) return null;
      return <h4 {...props} className="text-base font-bold" />;
    },
    // Horizontal rule
    hr: () => (
      <hr className="border-none h-px bg-gray-300" />
    ),
    // Code blocks
    pre: ({node, ...props}: any) => (
      <pre {...props} className="p-4 bg-gray-800 text-white rounded overflow-x-auto" />
    ),
    code: ({node, inline, ...props}: any) => 
      inline ? (
        <code {...props} className="px-1 py-0.5 bg-gray-100 rounded text-sm" />
      ) : (
        <code {...props} />
      ),
    // Blockquotes
    blockquote: ({node, ...props}: any) => (
      <blockquote {...props} className="border-l-4 border-gray-300 pl-4 italic" />
    ),
  };

  const mergedComponents = {...defaultComponents, ...components};

  const { header, body } = processContent(children);
  return (
    <div className={`${styles['formatted-markdown']} ${className}`}>
      {header && (
        <div className="top-header" style={{fontWeight: 700, fontSize: '1.25em', marginBottom: '1em', letterSpacing: 0}}>{header}</div>
      )}

<ReactMarkdown
  remarkPlugins={[remarkGfm, remarkBreaks]}
  components={mergedComponents}
>
  {body}
</ReactMarkdown>
    </div>
  );
};

export default FormattedMarkdown;