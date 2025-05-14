// import React from 'react';
// import { X } from 'lucide-react';
// import type { Quote } from '../../../contexts/QuoteProvider';

// interface QuoteChipsProps {
//   quotes: Quote[];
//   onInsert: (quote: Quote) => void;
//   onRemove: (id: string) => void;
// }

// const QuoteChips: React.FC<QuoteChipsProps> = ({ quotes, onInsert, onRemove }) => {
//   if (quotes.length === 0) return null;

//   return (
//     <div className="mb-2 flex flex-wrap gap-2">
//       {quotes.map((quote) => (
//         <div
//           key={quote.id}
//           className="flex items-center bg-black text-white border border-black rounded-full px-3 py-1 text-sm cursor-pointer transition-colors hover:bg-neutral-900 shadow-sm"
//           style={{ fontFamily: 'monospace', letterSpacing: '0.02em', fontWeight: 500 }}
//           title={quote.content.length > 50 ? `${quote.content.substring(0, 50)}...` : quote.content}
//           onClick={() => onInsert(quote)}
//         >
//           <span className="mr-2 flex items-center gap-1">
//             <span className="text-white/70">@</span>
//             <span className="font-semibold text-white/90 truncate max-w-[120px]">
//               {quote.sectionTitle.length > 24 ? `${quote.sectionTitle.substring(0, 24)}...` : quote.sectionTitle}
//             </span>
//             <span className="text-xs text-white/60 pl-1">
//               {quote.lineNumbers.start}-{quote.lineNumbers.end}
//             </span>
//           </span>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               onRemove(quote.id);
//             }}
//             className="ml-1 text-white/60 hover:text-red-400 transition-colors rounded-full p-0.5"
//             aria-label="Remove quote"
//             tabIndex={-1}
//           >
//             <X size={13} />
//           </button>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default QuoteChips;
