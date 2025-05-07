import React from 'react';

interface CodeBlockProps {
  lang: string;
  content: string;
  className?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ lang, content, className }) => (
  <pre className={`bg-gray-800 text-white p-4 rounded font-mono whitespace-pre-wrap overflow-auto ${className || ''}`}>
    <code className={lang ? `language-${lang}` : ''}>{content}</code>
  </pre>
);

export default CodeBlock;
