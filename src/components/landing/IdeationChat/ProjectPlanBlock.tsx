import React, { FC, useRef } from 'react';
import styles from './ChatMessage.module.css';
import { useBlock } from '../../../contexts/MessageBlocksContext';
import { SimpleSectionProcessor } from '../SimpleSectionProcessor';
import { createLineReader } from '../../../utils/streamToLines';
import { ProcessUpdateEvent, UpdateState } from '../types';
import { useState, useEffect, useCallback } from 'react';
import { useActiveTab } from '../../../contexts/ActiveTabProvider';


export const useProjectPlanStream = (messageId: string) => {
  const [stateUpdates, updateSectionState] = useState<UpdateState|undefined>(undefined);
  const stream = useBlock('projectPlan', messageId);
  const sectionProcessor = useRef<SimpleSectionProcessor>(new SimpleSectionProcessor());

  const processProjectPlanStreamLines = useCallback(async (lineStream: ReadableStreamDefaultReader<string>) => {
    try {
      await sectionProcessor.current.processStream(lineStream, (update: ProcessUpdateEvent) => {
        updateSectionState(update.updateState);
      });
    } catch (error) {
      console.error('Error processing project plan stream:', error);
    }
  }, [updateSectionState]);
  
  const processProjectPlanStream = useCallback(async (projectPlanStream: ReadableStream<string>) => {
    try {
      sectionProcessor.current.reset();
      const lineReader = createLineReader(projectPlanStream.getReader());
      processProjectPlanStreamLines(lineReader);
    } catch (error) {
      console.error('Error processing project plan stream:', error);
    }
  }, [updateSectionState]);

  const processProjectPlanString = useCallback(async (projectPlan:string) => {
    const lines = projectPlan.split('\n').map(line => line + '\n');
    const stream = new ReadableStream<string>({
      start(controller) {
        lines.forEach(line => controller.enqueue(line));
        controller.close();
      }
    });
    processProjectPlanStream(stream);
  }, [processProjectPlanStream]);
    
    
  
  useEffect(() => {
    if (!stream) return;
    
    if (stream.locked) {
      return;
    }
    
    const [newStream] = stream.tee();
    
    processProjectPlanStream(newStream).catch(error => {
      console.error('Failed to process project plan stream:', error);
    });
    
  }, [stream, messageId, processProjectPlanStreamLines]);

  return { stateUpdates, stream, processProjectPlanString };
};

interface ProjectPlanBlockProps {
  messageId: string;
  setCurrentSectionId?: (id: string | null) => void;
  content?: string;
}

const ProjectPlanBlock: FC<ProjectPlanBlockProps> = ({ messageId, setCurrentSectionId, content }) => {
  const { stateUpdates, stream, processProjectPlanString } = useProjectPlanStream(messageId);
  const { setActiveTab } = useActiveTab();
  
  if (!stream && !content) return null;
  
  useEffect(() => {
    if (!stream && content) {
      processProjectPlanString(content);
    }
  }, [content, processProjectPlanString]);

  return (
    <pre className="bg-gray-800 text-white p-4 rounded-md font-mono whitespace-pre-wrap overflow-auto mt-2">
      {stateUpdates && stateUpdates.sectionUpdateStates.length > 0 ? (
        <ul className="list-none p-0 m-0">
          {stateUpdates.sectionUpdateStates.map((update, index) => {
            let icon: React.ReactNode;
            let iconClass: string;
            let label: string;
            const sectionId = update.sectionId ?? 'section';
            const sectionTitle = sectionId;
            
            if (update.state === 'created' || update.state === 'updated') {
              icon = '✓';
              iconClass = 'text-green-400 font-bold';
              label = `${sectionTitle}`;
            } else if (update.state === 'creating' || update.state === 'updating') {
              icon = <span className={`spinner mr-1 ${styles.spinner}`} />;
              iconClass = 'text-gray-300';
              label = `Creating ${sectionTitle}`;
            } else if (update.state === 'deleted' || update.state === 'deleting') {
              icon = '✗';
              iconClass = 'text-red-400';
              label = `Deleting ${sectionTitle}`;
            } else {
              icon = '!';
              iconClass = 'text-yellow-400';
              label = `${sectionTitle} (error)`;
            }
            
            return (
              <li key={index} className="flex items-center mb-1">
                <button
                  className={`inline-flex items-center mr-2 ${iconClass} focus:outline-none focus:ring-2 focus:ring-white/70 rounded transition`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => {
                    setCurrentSectionId?.(update.sectionId!);
                    setActiveTab("notes");
                  }}
                  tabIndex={0}
                  aria-label={`Set current section to ${sectionId}`}
                  type="button"
                >
                  {icon}
                </button>
                <span
                  className="text-white/90 text-sm cursor-pointer"
                  onClick={() => {
                    setCurrentSectionId?.(update.sectionId!);
                    setActiveTab("notes");
                  }}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <span>No updates available.</span>
      )}
    </pre>
  );
};

export default ProjectPlanBlock;
