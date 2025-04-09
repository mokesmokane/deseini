// import React from 'react';
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
// import type { Components } from 'react-markdown';

// interface MarkdownViewProps {
//   content: string;
// }

// const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
//   // Filter out any OpenAI event markers that might still be present
//   const cleanContent = content
//     ?.split('\n')
//     .filter(line => !line.includes('event: stream_') && line.trim() !== '---event: stream_end')
//     .join('\n') || '';

//   // Define component overrides for markdown rendering
//   const components: Components = {
//     code({ node, inline, className, children, ...props }: any) {
//       const match = /language-(\w+)/.exec(className || '');
//       return !inline && match ? (
//         <SyntaxHighlighter
//           style={atomDark}
//           language={match[1]}
//           PreTag="div"
//           {...props}
//         >
//           {String(children).replace(/\n$/, '')}
//         </SyntaxHighlighter>
//       ) : (
//         <code className={className} {...props}>
//           {children}
//         </code>
//       );
//     },
//     // Make headings stand out more
//     h1(props: React.HTMLProps<HTMLHeadingElement>) {
//       return <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b" {...props} />;
//     },
//     h2(props: React.HTMLProps<HTMLHeadingElement>) {
//       return <h2 className="text-xl font-bold mt-5 mb-3" {...props} />;
//     },
//     h3(props: React.HTMLProps<HTMLHeadingElement>) {
//       return <h3 className="text-lg font-bold mt-4 mb-2" {...props} />;
//     },
//     // Style links
//     a(props: React.HTMLProps<HTMLAnchorElement>) {
//       return (
//         <a 
//           className="text-gray-700 hover:text-black underline"
//           target="_blank" 
//           rel="noopener noreferrer"
//           {...props}
//         />
//       );
//     },
//     // Style lists
//     ul(props: React.HTMLProps<HTMLUListElement>) {
//       return <ul className="list-disc pl-6 my-3" {...props} />;
//     },
//     ol(props: any) { // Using any to avoid strict type checking for ol type attribute
//       return <ol className="list-decimal pl-6 my-3" {...props} />;
//     },
//     // Style blockquotes
//     blockquote(props: React.HTMLProps<HTMLQuoteElement>) {
//       return <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-3 italic bg-gray-50 rounded" {...props} />;
//     },
//   };

//   return (
//     <div className="markdown-container prose prose-slate max-w-none p-4 overflow-auto">
//       <ReactMarkdown
//         remarkPlugins={[remarkGfm]}
//         components={components}
//       >
//         {cleanContent}
//       </ReactMarkdown>
//     </div>
//   );
// };

// export default MarkdownView;
