import React, { FC, useRef, useMemo } from 'react';
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
  const sectionProcessor = useRef<SimpleSectionProcessor | null>(null);
  const hasProcessed = useRef(false);

  // Initialize the processor once
  useEffect(() => {
    sectionProcessor.current = new SimpleSectionProcessor();
    return () => {
      sectionProcessor.current = null;
      hasProcessed.current = false;
    };
  }, [messageId]);

  const processProjectPlanStreamLines = useCallback(async (lineStream: ReadableStreamDefaultReader<string>) => {
    if (!sectionProcessor.current) return;
    
    try {
      await sectionProcessor.current.processStream(lineStream, (update: ProcessUpdateEvent) => {
        updateSectionState(prev => {
          // Create a map of existing states for quick lookup
          const existingStates = new Map(
            prev?.sectionUpdateStates?.map(s => [s.sectionId, s]) || []
          );
          
          // Merge with new states, preserving existing states for sections not being updated
          const newStates = update.updateState.sectionUpdateStates.map(newState => ({
            ...existingStates.get(newState.sectionId),
            ...newState
          }));
          
          // Keep states that aren't being updated
          const preservedStates = (prev?.sectionUpdateStates || []).filter(
            s => !update.updateState.sectionUpdateStates.some(us => us.sectionId === s.sectionId)
          );
          
          return {
            ...prev,
            sectionUpdateStates: [...preservedStates, ...newStates]
          };
        });
      });
    } catch (error) {
      console.error('Error processing project plan stream:', error);
    }
  }, []);
  
  const processProjectPlanStream = useCallback(async (projectPlanStream: ReadableStream<string>) => {
    if (!sectionProcessor.current || hasProcessed.current) return;
    
    try {
      sectionProcessor.current.reset();
      hasProcessed.current = true;
      const lineReader = createLineReader(projectPlanStream.getReader());
      await processProjectPlanStreamLines(lineReader);
    } catch (error) {
      console.error('Error processing project plan stream:', error);
      hasProcessed.current = false;
    }
  }, [processProjectPlanStreamLines]);

  const processProjectPlanString = useCallback(async (projectPlan: string) => {
    if (!sectionProcessor.current || hasProcessed.current) return;
    
    try {
      sectionProcessor.current.reset();
      hasProcessed.current = true;
      const lines = projectPlan.split('\n').map(line => line + '\n');
      const stream = new ReadableStream<string>({
        start(controller) {
          lines.forEach(line => controller.enqueue(line));
          controller.close();
        }
      });
      const lineReader = createLineReader(stream.getReader());
      await processProjectPlanStreamLines(lineReader);
    } catch (error) {
      console.error('Error processing project plan string:', error);
      hasProcessed.current = false;
    }
  }, [processProjectPlanStreamLines]);
  
  useEffect(() => {
    if (!stream || stream.locked || hasProcessed.current) return;
    
    // Create a new stream from the source
    const [newStream] = stream.tee();
    
    processProjectPlanStream(newStream).catch(error => {
      console.error('Failed to process project plan stream:', error);
      hasProcessed.current = false;
    });
    
    // Cleanup function to cancel the stream if the component unmounts
    return () => {
      try {
        newStream.cancel();
      } catch (e) {
        // Stream might already be closed
      }
    };
  }, [stream, processProjectPlanStream]);

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
  const hasProcessed = useRef(false);
  
  if (!stream && !content) return null;
  
  // Sort sections by their order of creation to maintain consistent order
  const sortedSections = useMemo(() => {
    if (!stateUpdates?.sectionUpdateStates) return [];
    
    // Create a map to track the first occurrence of each section
    const firstOccurrence = new Map<string, number>();
    const orderedSections: Array<{
      sectionId: string;
      state: 'creating' | 'created' | 'updating' | 'updated' | 'deleting' | 'deleted' | 'error';
    }> = [];
    
    for (let i = 0; i < stateUpdates.sectionUpdateStates.length; i++) {
      const section = stateUpdates.sectionUpdateStates[i];
      // Skip sections without an ID
      if (!section.sectionId) continue;
      
      if (!firstOccurrence.has(section.sectionId)) {
        // New section - add to our tracking
        firstOccurrence.set(section.sectionId, i);
        orderedSections.push({
          sectionId: section.sectionId,
          state: section.state
        });
      } else {
        // Existing section - update its state
        const existingIndex = orderedSections.findIndex(s => s.sectionId === section.sectionId);
        if (existingIndex !== -1) {
          orderedSections[existingIndex] = {
            ...orderedSections[existingIndex],
            state: section.state
          };
        }
      }
    }
    
    return orderedSections;
  }, [stateUpdates?.sectionUpdateStates]);
  
  useEffect(() => {
    if (!stream && content) {
      processProjectPlanString(content);
    }
    
    // Cleanup function to reset processing state when content changes
    return () => {
      hasProcessed.current = false;
    };
  }, [content, processProjectPlanString, stream]);

  return (
    <pre className="bg-gray-800 text-white p-4 rounded-md font-mono whitespace-pre-wrap overflow-auto mt-2">
      {sortedSections.length > 0 ? (
        <ul className="list-none p-0 m-0">
          {sortedSections.map((update, index) => {
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
