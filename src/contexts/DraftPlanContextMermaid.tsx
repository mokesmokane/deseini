import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { 
  processStreamData, 
  StreamState 
} from '../utils/streamProcessor';
import { 
  processAction 
} from '../utils/actionProcessor';
import {
  processStreamResponse
} from '../utils/streamHandler';
import { BufferedAction, ActionType } from '../utils/types';

// gantt
//     section Phase 1
//     Task 1:t1, 2025-01-01, 10d
//     Task 2:t2, after t1, 5d
//     Milestone 1: milestone, 2025-02-15

export interface Section {
  name: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  type?: 'task' | 'milestone';
  label: string;
  startDate: Date | undefined;
  duration?: number;
  endDate?: Date;
  dependencies?: string[];
  date?: Date; // For milestone type
}

export interface Timeline {
  startDate: Date;
  endDate: Date;
}

interface DraftPlanMermaidContextType {
  sections: Section[];
  timeline: Timeline | undefined;
  createPlanFromMarkdown: (markdownPlan: string) => Promise<void>;
  isLoading: boolean;
  streamProgress: number;
  mermaidSyntax: string;
  fullSyntax: string;
  streamSummary: string;
  processingBufferProgress: number;
  startProcessingBuffer: () => void;
  processAllBuffer: () => void;
  actionBufferLength: number;
  nextAction: BufferedAction | null;
  actionBuffer: BufferedAction[]; 
}

const DraftPlanMermaidContext = createContext<DraftPlanMermaidContextType | undefined>(undefined);

export const DraftPlanMermaidProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [timeline, setTimeline] = useState<Timeline|undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamProgress, setStreamProgress] = useState<number>(0);
  const [mermaidSyntax, setMermaidSyntax] = useState<string>('');
  const [fullSyntax, setFullSyntax] = useState<string>('');
  const [streamSummary, setStreamSummary] = useState<string>('');
  const [processingBufferProgress, setProcessingBufferProgress] = useState<number>(0);
  const [actionBufferLength, setActionBufferLength] = useState<number>(0);
  const [nextAction, setNextAction] = useState<BufferedAction | null>(null);

  // References for streaming data handling
  const streamStateRef = useRef<StreamState>({
    mermaidData: '',
    completeLines: [],
    inMermaidBlock: false,
    currentSection: null,
    allSections: new Set(),
    lastHeader: null
  });
  
  // Track current sections and timeline in refs to avoid closure issues
  const sectionsRef = useRef<Section[]>([]);
  const timelineRef = useRef<Timeline|undefined>(undefined);
  
  // Update refs when state changes
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);
  
  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);
  
  // Task dictionary to track all tasks for efficient dependency resolution
  const taskDictionaryRef = useRef<Record<string, Task>>({});
  
  // Action buffer to store pending changes
  const actionBufferRef = useRef<BufferedAction[]>([]);
  const isProcessingBufferRef = useRef<boolean>(false);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);


  // Helper function to add an action to the buffer, now using the extracted function
  const addActionToBuffer = useCallback((type: ActionType, payload: any) => {
    const action: BufferedAction = { type, payload, timestamp: new Date().getTime() };
    
    actionBufferRef.current.push(action);
    
    // Update the buffer length state
    setActionBufferLength(actionBufferRef.current.length);
    
    // Update next action if this is the first one or if we just added a timeline update before it
    if (actionBufferRef.current.length === 1 || 
        (actionBufferRef.current.length === 2 && actionBufferRef.current[0].type === 'UPDATE_TIMELINE')) {
      setNextAction(actionBufferRef.current[0]);
    }
  }, []);

  // Process tasks with dependencies in a second pass
  const processDependencies = useCallback(() => {
    // Just add an action to process any remaining unresolved dependencies
    addActionToBuffer('PROCESS_DEPENDENCIES', {});
  }, [addActionToBuffer]);

  // Helper function to start processing the buffer if not already processing
  const startProcessingBuffer = useCallback(() => {
    if (!isProcessingBufferRef.current && actionBufferRef.current.length > 0) {
      isProcessingBufferRef.current = true;
      processNextBatchFromBuffer();
    }
  }, []);

  // Process all actions in the buffer at once
  const processAllBuffer = useCallback(() => {
    if (!isProcessingBufferRef.current && actionBufferRef.current.length > 0) {
      isProcessingBufferRef.current = true;
      
      // Process all actions one after another
      const processAllActions = () => {
        const totalActions = actionBufferRef.current.length;
        let processedCount = 0;
        
        // Process actions until buffer is empty
        const processNextAction = () => {
          if (actionBufferRef.current.length === 0) {
            // All done
            isProcessingBufferRef.current = false;
            setProcessingBufferProgress(100);
            setNextAction(null);
            return;
          }
          
          // Take the next action
          const actionToProcess = actionBufferRef.current[0];
          actionBufferRef.current = actionBufferRef.current.slice(1);
          
          // Update the buffer length state
          setActionBufferLength(actionBufferRef.current.length);
          
          // Update next action
          setNextAction(actionBufferRef.current.length > 0 ? actionBufferRef.current[0] : null);
          
          // Track progress
          processedCount++;
          const progress = Math.floor((processedCount / Math.max(totalActions, 1)) * 100);
          setProcessingBufferProgress(progress);
          
          // Process the action
          const { updatedState, updatedTaskDictionary, actionsToQueue } = processAction(
            { sections: sectionsRef.current, timeline: timelineRef.current },
            actionToProcess,
            taskDictionaryRef.current
          );
          
          // Update the application state
          setSections(updatedState.sections);
          if (updatedState.timeline) {
            setTimeline(updatedState.timeline);
          }
          
          // Update the task dictionary
          taskDictionaryRef.current = updatedTaskDictionary;
          
          // Add any new actions to the queue
          actionsToQueue.forEach(newAction => {
            actionBufferRef.current.push(newAction);
          });
          
          // Process next action after a small delay to allow UI updates
          setTimeout(processNextAction, 50);
        };
        
        // Start processing
        processNextAction();
      };
      
      // Begin processing all actions
      processAllActions();
    }
  }, []);

  // Handle streaming data from the server
  const handleStreamData = useCallback((content: string) => {
    // Append the new content to our accumulated data
    setFullSyntax(prev => prev + content);
    
    // Process the stream data using the extracted function
    const { 
      updatedStreamState, 
      updatedActionBuffer, 
      updatedTimeline,
      updatedTaskDictionary,
      newMermaidSyntax,
      newStreamSummary
    } = processStreamData(
      content,
      streamStateRef.current,
      actionBufferRef.current,
      timelineRef.current,
      taskDictionaryRef.current
    );
    
    // Update refs with the processed data
    streamStateRef.current = updatedStreamState;
    actionBufferRef.current = updatedActionBuffer;
    timelineRef.current = updatedTimeline;
    taskDictionaryRef.current = updatedTaskDictionary;
    
    // Update state with new data
    setMermaidSyntax(newMermaidSyntax);
    setActionBufferLength(actionBufferRef.current.length);
    
    if (actionBufferRef.current.length > 0) {
      setNextAction(actionBufferRef.current[0]);
    }
    
    if (newStreamSummary) {
      setStreamSummary(newStreamSummary);
    }
  }, []);

  // Process a batch of actions from the buffer
  const processNextBatchFromBuffer = useCallback(() => {
    if (actionBufferRef.current.length === 0) {
      isProcessingBufferRef.current = false;
      setProcessingBufferProgress(100);
      setNextAction(null);
      return;
    }

    // Take a batch of actions (up to 1 at a time for manual processing)
    const batchSize = 1; // Changed from 5 to 1 for one-by-one processing
    const actionsToProcess = actionBufferRef.current.slice(0, batchSize);
    actionBufferRef.current = actionBufferRef.current.slice(batchSize);
    
    // Update the buffer length state
    setActionBufferLength(actionBufferRef.current.length);
    
    // Update next action
    setNextAction(actionBufferRef.current.length > 0 ? actionBufferRef.current[0] : null);

    // Track progress
    const totalActions = actionBufferRef.current.length + batchSize;
    const processedActions = batchSize;
    const progress = Math.floor((processedActions / Math.max(totalActions, 1)) * 100);
    setProcessingBufferProgress(progress);

    // Process each action in the batch using our pure function
    actionsToProcess.forEach(action => {
      const { updatedState, updatedTaskDictionary, actionsToQueue } = processAction(
        { sections: sectionsRef.current, timeline: timelineRef.current },
        action,
        taskDictionaryRef.current
      );
      
      // Update the application state
      setSections(updatedState.sections);
      if (updatedState.timeline) {
        setTimeline(updatedState.timeline);
      }
      
      // Update the task dictionary
      taskDictionaryRef.current = updatedTaskDictionary;
      
      // Add any new actions to the queue
      actionsToQueue.forEach(newAction => {
        actionBufferRef.current.push(newAction);
      });
    });


    // Schedule the next batch processing - REMOVED automatic scheduling for manual control
    isProcessingBufferRef.current = false;
  }, []);

  // Clean up any intervals when the component unmounts
  useEffect(() => {
    // Initialize the next action if buffer has items
    if (actionBufferRef.current.length > 0 && !nextAction) {
      setNextAction(actionBufferRef.current[0]);
    }
    
    return () => {
      if (processingIntervalRef.current) {
        clearTimeout(processingIntervalRef.current);
      }
    };
  }, [nextAction]);

  // Function to create plan from markdown by calling the API with streaming
  const createPlanFromMarkdown = async (markdownPlan: string): Promise<void> => {
    try {
      setIsLoading(true);
      setStreamProgress(0);
      setProcessingBufferProgress(0);

      // Reset data
      setSections([]);
      setMermaidSyntax('');
      setFullSyntax('');
      setStreamSummary('');
      
      // Reset refs
      streamStateRef.current = {
        mermaidData: '',
        completeLines: [],
        inMermaidBlock: false,
        currentSection: null,
        allSections: new Set(),
        lastHeader: null
      };
      taskDictionaryRef.current = {};
      actionBufferRef.current = [];
      isProcessingBufferRef.current = false;

      // Send the request to start the stream
      const response = await fetch('/api/convert-plan-to-gantt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ markdownPlan })
      });

      console.log(`[DraftPlanMermaidContext] createPlanFromMarkdown: Stream fetch response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[DraftPlanMermaidContext] createPlanFromMarkdown: Stream fetch failed", errorText);
        let errorMessage = `Failed to initiate plan conversion stream (Status: ${response.status})`;
        try { const errorData = JSON.parse(errorText); errorMessage = errorData.error || errorMessage; } catch(e) {}
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("Response body is null, cannot read stream.");
      }

      // Process the stream using our pure function
      await processStreamResponse(
        response.body, 
        // On data callback
        (content: string) => {
          handleStreamData(content);
          setStreamProgress(prev => Math.min(99, prev + 1));
        },
        // On complete callback
        () => {
          // Final dependency resolution after all content is processed
          processDependencies();
          setStreamProgress(100);
          
          // Set up an interval to check if buffer processing is complete
          const checkBufferInterval = setInterval(() => {
            if (actionBufferRef.current.length === 0 && !isProcessingBufferRef.current) {
              setIsLoading(false);
              clearInterval(checkBufferInterval);
            }
          }, 200);
          
          // Set a timeout to ensure we don't keep loading forever if something goes wrong
          setTimeout(() => {
            if (isLoading) {
              setIsLoading(false);
              clearInterval(checkBufferInterval);
            }
          }, 10000);
        },
        // On error callback
        (error: Error) => {
          console.error('Error processing stream:', error);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error creating plan from markdown:', error);
      setIsLoading(false);
    }
  };

  // Helper function to prepare context value
  const contextValue: DraftPlanMermaidContextType = {
    sections,
    timeline,
    createPlanFromMarkdown,
    isLoading,
    streamProgress,
    mermaidSyntax,
    fullSyntax,
    streamSummary,
    processingBufferProgress,
    startProcessingBuffer,
    processAllBuffer,
    actionBufferLength,
    nextAction,
    actionBuffer: actionBufferRef.current 
  };

  return (
    <DraftPlanMermaidContext.Provider value={contextValue}>
      {children}
    </DraftPlanMermaidContext.Provider>
  );
};

// Hook to use the DraftPlanMermaid context
export const useDraftPlanMermaidContext = () => {
  const context = useContext(DraftPlanMermaidContext);
  if (context === undefined) {
    throw new Error('useDraftPlanMermaidContext must be used within a DraftPlanMermaidProvider');
  }
  return context;
}

