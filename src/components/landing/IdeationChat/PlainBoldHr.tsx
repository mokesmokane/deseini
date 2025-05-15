import React from 'react';

interface PlainBoldItalicHrProps {
  text: string;
}

const PlainBoldItalicHr: React.FC<PlainBoldItalicHrProps> = ({ text }) => {
  // if text is just white space return  asimple empty line
  if (text.trim() === '') {
    return <br />;
  }
  
  const lines = text.trim().split('\n');

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();

        // 1) Skip blank lines immediately adjacent to an `---`
        if (trimmed === '') {
          const prev = lines[i - 1]?.trim();
          const next = lines[i + 1]?.trim();
          if (prev === '---' || next === '---') {
            return null;
          }
          return <br key={i} />;
        }

        // 2) Render `---` as <hr/>
        if (trimmed === '---') {
          return <hr key={i} className="my-4 border-gray-300" />;
        }

        // 3) Otherwise split out **bold** and *italic*
        const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, idx) => {
          // Bold: **…**
          let m = /^\*\*(.+)\*\*$/.exec(part);
          if (m) {
            return (
              <strong key={idx} className="font-bold">
                {m[1]}
              </strong>
            );
          }
          // Italic: *…*
          m = /^\*(.+)\*$/.exec(part);
          if (m) {
            return (
              <em key={idx} className="italic">
                {m[1]}
              </em>
            );
          }
          return part;
        });

        return (
          <div key={i} className="whitespace-pre-wrap">
            {parts}
          </div>
        );
      })}
    </>
  );
};

export default PlainBoldItalicHr;
