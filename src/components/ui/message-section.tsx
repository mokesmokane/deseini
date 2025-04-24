import { MessageSection as MessageSectionType } from "../landing/types";
import { cn } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Code, Link, Image } from "lucide-react";

interface MessageSectionProps {
  section: MessageSectionType;
  isMe: boolean;
}

export function MessageSection({ section, isMe }: MessageSectionProps) {
  const renderLabel = (icon: React.ReactNode, text: string) => (
    <div className={cn(
      "flex items-center gap-2 text-xs font-medium mb-2",
      isMe ? "text-white/70" : "text-gray-500"
    )}>
      {icon}
      <span>{text}</span>
    </div>
  );

  switch (section.type) {
    case "code":
      return (
        <div className="rounded-xl overflow-hidden mt-3">
          {renderLabel(<Code className="h-4 w-4" />, "Code Snippet")}
          <SyntaxHighlighter
            language="typescript"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: "1rem",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
            }}
          >
            {section.content}
          </SyntaxHighlighter>
        </div>
      );
    
    case "image":
      return (
        <div className="mt-3">
          {renderLabel(<Image className="h-4 w-4" />, "Image")}
          <div className="rounded-xl overflow-hidden">
            <img 
              src={section.content} 
              alt="Shared content"
              className="w-full max-w-[200px] h-auto object-cover"
            />
          </div>
        </div>
      );
    
    case "link":
      return (
        <div className="mt-3">
          {renderLabel(<Link className="h-4 w-4" />, "Link")}
          <a
            href={section.content}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "block px-3 py-2 rounded-xl",
              isMe 
                ? "bg-white/10 text-white hover:bg-white/15" 
                : "bg-black/5 text-blue-600 hover:bg-black/10",
              "transition-colors duration-200"
            )}
          >
            {section.content}
          </a>
        </div>
      );
    
    default:
      return null;
  }
}