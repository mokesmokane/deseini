import React, { useState } from 'react';
import DraftPlanMermaid from '../../draft_plan_mermaid/DraftPlanMermaid';
import { useDraftPlanMermaidContext } from '../../../contexts/DraftPlan/DraftPlanContextMermaid';
import { useNavigate } from 'react-router-dom';
import { draftPlanToMermaid } from '../../../utils/mermaidParser';
import { validateMermaidGantt } from '../../../utils/mermaidValidator';
import type { LineValidation } from '../../../utils/types';
import SyntaxValidationSidebar from './SyntaxValidationSidebar';

const MermaidNotepad: React.FC = () => {
  const [mermaidInput, setMermaidInput] = useState(`
\`\`\`mermaid
gantt
    title Compostable Packaging Material Project Timeline
    dateFormat YYYY-MM-DD
    %% MONTH 1: Material Research & Specification
    section Material Research & Specification
      Review existing compostable materials: t1, 2025-06-01, 7d
      Define material properties & requirements: t2, after t1, 5d
      Draft technical specification document: t3, after t2, 8d
      Technical specification document completed: milestone, after t3

    %% MONTH 2: Prototype Development & Initial Testing
    section Prototype Development
      Create initial prototypes for various food types: t4, after t3, 8d
      Refine prototypes based on findings: t5, after t12, 10d

    section Testing & Validation
      Conduct initial lab tests (degradation, safety, durability): t12, after t4, 10d
      Document initial test results: t13, after t12, 3d
      Successful lab test results (≤7 days): milestone, after t13

    %% MONTH 3: Prototype Refinement & Extended Testing
      Conduct extended lab testing: t14, after t5, 7d
      Document extended test results: t15, after t14, 4d
      Approved packaging prototypes (dry & wet foods): milestone, after t15

    %% MONTH 4: Design & Assessment
    section Design & Assessment
      Develop packaging design mockups (3 versions): t6, after t15, 8d
      Packaging design mockups finalized: milestone, after t6
      Perform environmental impact assessment: t7, after t6, 7d
      Environmental impact assessment report delivered: milestone, after t7

    %% MONTH 5: Compliance & User Pilot
    section Compliance & Regulatory
      Review FDA, EU, and other regulatory standards: t8, after t7, 8d
      Compile regulatory compliance checklist: t9, after t8, 7d
      Regulatory compliance checklist signed off: milestone, after t9

    section User Testing
      Organize pilot user test: t10, after t9, 7d

    %% MONTH 6: User Feedback & Closure
      Collect & summarize user feedback: t11, after t10, 8d
      User feedback summary delivered: milestone, after t11
      Final project documentation & closure: t16, after t11, 10d
\`\`\`    `);
  const [hasRendered, setHasRendered] = useState(false);
  const [validations, setValidations] = useState<LineValidation[]>(() => {
    const lines = mermaidInput.split(/\r?\n/);
    return validateMermaidGantt(lines.map((line, idx) => ({ index: idx, line })));
  });
  const { createPlanFromMarkdownStream, isLoading, sections, timeline } = useDraftPlanMermaidContext();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMermaidInput(value);
    const lines = value.split(/\r?\n/);
    const newValidations = validateMermaidGantt(lines.map((line, idx) => ({ index: idx, line })));
    console.log('VALIDATIONS:', newValidations);
    setValidations(newValidations);
  };

  const handleRender = async () => {
    if (mermaidInput.trim()) {
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          const lines = mermaidInput.split('\n');
          for (const line of lines) {
            controller.enqueue(encoder.encode(line + '\n'));
          }
          controller.close();
        }
      });
      await createPlanFromMarkdownStream(stream);
      setHasRendered(true);
    }
  };

  const handleExport = () => {
    const plan = { sections, timeline };
    const markdown = draftPlanToMermaid(plan);
    setMermaidInput(markdown);
  };

  const handleBackToSidebar = () => {
    navigate('/');
  };

  return (
    <div className="h-screen min-h-0 flex flex-col bg-white">
      <header className="border-b border-gray-200 p-4 flex justify-between items-center">
        <button 
          onClick={handleBackToSidebar}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
        <h1 className="text-xl font-medium">Mermaid Sketches</h1>
        <div className="flex">
          <button
            onClick={handleRender}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            disabled={!mermaidInput.trim() || isLoading}
          >
            {isLoading ? 'Processing...' : 'Render Diagram'}
          </button>
          <button
            onClick={handleExport}
            className="ml-2 px-4 py-2 border border-black text-black rounded-md hover:bg-gray-100 transition-colors"
            disabled={!hasRendered}
          >
            Export Markdown
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex p-4 space-x-4">
        {/* Left: syntax editor and diagram */}
        <div className="w-1/2 flex-1 min-h-0 flex flex-col">
          <div className="mb-2 flex justify-between items-center">
            <h2 className="text-lg font-medium">Mermaid Syntax</h2>
            <a
              href="https://mermaid.js.org/syntax/flowchart.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Syntax Help
            </a>
          </div>
          <textarea
            className="p-4 border border-gray-300 rounded-md font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            style={{ minHeight: '6rem', maxHeight: '40vh' }}
            value={mermaidInput}
            onChange={handleInputChange}
            placeholder="Enter Mermaid syntax here..."
            spellCheck={false}
            rows={16}
          />
          {/* Syntax validation fills remaining space and scrolls */}
          <div className="mt-2 flex-1 min-h-0 flex flex-col">
            <SyntaxValidationSidebar syntax={mermaidInput} validations={validations} />
          </div>
        </div>
        {/* Right: rendered chart only */}
        <div className="w-1/2 border-l border-gray-200 pl-4 flex flex-col">
          {hasRendered && (
            <div className="flex-1">
              <DraftPlanMermaid />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default MermaidNotepad;



