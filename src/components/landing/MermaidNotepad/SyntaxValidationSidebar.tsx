import React from 'react';
import type { LineValidation } from '../../../utils/types';

interface SyntaxValidationSidebarProps {
  syntax: string;
  validations: Record<number, LineValidation>;
}

const SyntaxValidationSidebar: React.FC<SyntaxValidationSidebarProps> = ({ syntax, validations }) => {
  const lines = syntax.split(/\r?\n/);
  return (
    <aside className="w-full h-full flex flex-col min-h-0">
      <h2 className="text-lg font-medium mb-2">Syntax Validation</h2>
      <ul className="text-sm font-mono flex-1 min-h-0 overflow-auto">
        {lines.map((line, idx) => {
          const validation = validations[idx];
          return (
            <li
              key={idx}
              className={`flex items-center py-1 px-2 rounded ${
                validation?.success ? 'bg-green-50 text-gray-700' : 'bg-red-50 text-red-600'
              }`}
            >
              <span className="w-8 text-xs text-gray-400 select-none">{idx + 1}.</span>
              <span className="flex-1 whitespace-pre">{line || <span className="text-gray-300">(empty)</span>}</span>
              {!validation?.success && (
                <span className="ml-2 text-xs font-medium">{validation?.errors.join(', ')}</span>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default SyntaxValidationSidebar;
