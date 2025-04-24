import React from 'react';
import { MessageSection as MessageSectionType } from '../types';
import { cn } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Code, Link, Image } from 'lucide-react';

interface MessageSectionProps {
  section: MessageSectionType;
  isMe: boolean;
}

export function MessageSection({ section, isMe }: MessageSectionProps) {
  const renderLabel = (icon: React.ReactNode, text: string) => (
    <div className={cn(
      "flex items-center gap-2 text-xs font-medium mb-2",
      isMe ? "text-black/70" : "text-white/70"
    )}>
      {icon}
      <span>{text}</span>
    </div>
  );

  switch (section.type) {
    case "code":
      return (
        <div className="mt-3 w-full">
          {renderLabel(<Code className="h-4 w-4" />, "Code Snippet")}
          <div className="rounded-xl overflow-auto hide-scrollbar" style={{ maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
            <SyntaxHighlighter
              language={section.language || "typescript"}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: "1rem",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
              }}
              wrapLongLines={false}
            >
              {section.content}
            </SyntaxHighlighter>
          </div>
        </div>
      );
    
    case "image":
      return (
        <div className="mt-3 w-full">
          {renderLabel(<Image className="h-4 w-4" />, "Image")}
          <div className="rounded-xl overflow-hidden" style={{ maxWidth: '100%' }}>
            <img 
              src={section.content} 
              alt="Shared content"
              className="max-w-full h-auto"
              style={{ display: 'block' }}
            />
          </div>
        </div>
      );
    
    case "link":
      return (
        <div className="mt-3 w-full">
          {renderLabel(<Link className="h-4 w-4" />, "Link")}
          <div className="overflow-x-auto hide-scrollbar" style={{ maxWidth: '100%' }}>
            <a
              href={section.content}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-block px-3 py-2 rounded-xl",
                isMe 
                  ? "bg-black/10 text-black hover:bg-black/15 border border-black font-mono" 
                  : "bg-white/10 text-white hover:bg-white/15",
                "transition-colors duration-200 overflow-x-auto"
              )}
              style={{ maxWidth: '100%', wordBreak: 'break-all' }}
            >
              {section.content}
            </a>
          </div>
        </div>
      );
    
    default:
      return null;
  }
}