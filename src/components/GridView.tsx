import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface GridViewProps {
  content: string;
}

interface Section {
  title: string;
  content: string;
  level: number; // 1 for h1, 2 for h2, etc.
}

const GridView: React.FC<GridViewProps> = ({ content }) => {
  // Clean content of any streaming markers
  const cleanContent = content
    ?.split('\n')
    .filter(line => !line.includes('event: stream_') && line.trim() !== '---event: stream_end')
    .join('\n') || '';

  // Parse the markdown into sections based on headings
  const sections = useMemo(() => {
    if (!cleanContent) return [];
    
    const lines = cleanContent.split('\n');
    const sections: Section[] = [];
    let currentSection: Section | null = null;
    
    const headingRegex = /^(#+)\s+(.+)$/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(headingRegex);
      
      if (headingMatch) {
        // If we found a heading and have a current section, push it
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Create a new section
        currentSection = {
          title: headingMatch[2],
          content: line + '\n',
          level: headingMatch[1].length,
        };
      } else if (currentSection) {
        // Add this line to the current section
        currentSection.content += line + '\n';
      } else if (line.trim() !== '') {
        // Handle content before any heading as an "Introduction" section
        currentSection = {
          title: 'Introduction',
          content: line + '\n',
          level: 0,
        };
      }
    }
    
    // Don't forget to add the last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }, [cleanContent]);

  // Calculate grid columns based on number of sections
  const getGridColumns = (count: number): string => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 4) return 'grid-cols-2';
    return 'grid-cols-3';
  };
  
  // Calculate appropriate height constraints
  const getCardHeight = (columns: number): string => {
    if (columns === 1) return 'min-h-[300px]';
    if (columns === 2) return 'min-h-[250px]';
    return 'min-h-[200px]';
  };

  const gridCols = getGridColumns(sections.length);
  const cardHeight = getCardHeight(
    gridCols === 'grid-cols-1' ? 1 : 
    gridCols === 'grid-cols-2' ? 2 : 3
  );

  return (
    <div className="p-4">
      {sections.length > 0 ? (
        <div className={`grid ${gridCols} gap-4`}>
          {sections.map((section, index) => (
            <div 
              key={index} 
              className={`${cardHeight} p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-auto border border-gray-200`}
            >
              <h3 className="text-lg font-bold mb-2 pb-2 border-b border-gray-200 text-gray-900">
                {section.title}
              </h3>
              <div className="prose prose-sm max-w-none overflow-hidden">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {/* Exclude the heading from the content */}
                  {section.content.split('\n').slice(1).join('\n')}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 text-gray-500">
          No content available to display in grid view
        </div>
      )}
    </div>
  );
};

export default GridView;
