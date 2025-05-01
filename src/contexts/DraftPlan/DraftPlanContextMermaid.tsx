import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { 
  processStreamData, 
  StreamState,
  StreamSummary
} from '../../utils/streamProcessor';
import { 
  processAction 
} from '../../utils/actionProcessor';
import {
  processStreamResponse
} from '../../utils/streamHandler';
import { BufferedAction, ActionType } from '../../utils/types';
import { Section, Timeline, Task } from './types';
import { projectDraftChartService } from '../../services/projectDraftChartService';
import { debounce } from 'lodash';
import { ensureDate } from '../../hooks/utils';
import { useProject } from '../ProjectContext';
// gantt
//     section Phase 1
//     Task 1:t1, 2025-01-01, 10d
//     Task 2:t2, after t1, 5d
//     Milestone 1: milestone, 2025-02-15

export interface StreamResponse {
  content?: string;
  done?: boolean;
  error?: string;
}
interface DraftPlanMermaidContextType {
  sections: Section[];
  timeline: Timeline | undefined;
  x0Date: Date | null;
  createPlanFromMarkdown: (markdownPlan: string) => Promise<void>;
  isLoading: boolean;
  streamProgress: number;
  mermaidSyntax: string;
  fullSyntax: string;
  streamSummary: string;
  processingBufferProgress: number;
  startProcessingBuffer: () => void;
  processAllBuffer: () => Promise<void>;
  TIMELINE_PIXELS_PER_DAY: number;
  setTIMELINE_PIXELS_PER_DAY: (newVal: number) => void;
  actionBufferLength: number;
  nextAction: BufferedAction | null;
  actionBuffer: BufferedAction[];
  updateTaskStartDate: (taskId: string, newStartDate: Date) => void;
  updateTaskDuration: (taskId: string, newDuration: number) => void;
  newSummary: StreamSummary | undefined;
}

interface DraftPlanMermaidProviderProps {
  children: React.ReactNode;
}
const DraftPlanMermaidContext = createContext<DraftPlanMermaidContextType | undefined>(undefined);

export function DraftPlanMermaidProvider({ children }: DraftPlanMermaidProviderProps) {
  const {project} = useProject();
  const [x0Date] = useState<Date | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [TIMELINE_PIXELS_PER_DAY, setTIMELINE_PIXELS_PER_DAY] = useState<number>(30);
  const [timeline, setTimeline] = useState<Timeline|undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamProgress, setStreamProgress] = useState<number>(0);
  const [mermaidSyntax, setMermaidSyntax] = useState<string>('');
  const [fullSyntax, setFullSyntax] = useState<string>('');
  const [streamSummary, setStreamSummary] = useState<string>('');
  const [newSummary, setNewSummary] = useState<StreamSummary | undefined>(undefined);
  const [processingBufferProgress, setProcessingBufferProgress] = useState<number>(0);
  const [actionBufferLength, setActionBufferLength] = useState<number>(0);
  const [nextAction, setNextAction] = useState<BufferedAction | null>(null);
  const projectIdRef = useRef(project?.id);

  // Update refs when props change
  React.useEffect(() => {
    projectIdRef.current = project?.id;
    if (project?.id) {
      projectDraftChartService.getDraftChart(project?.id).then((draftPlan) => {
        if (draftPlan) {
          setSections(draftPlan.sections);
          setTimeline(draftPlan.timeline);
        }
      });
    }
  }, [project]);

  // References for streaming data handling
  const streamStateRef = useRef<StreamState>({
    mermaidData: '',
    completeLines: [],
    inMermaidBlock: false,
    currentSection: null,
    allSections: new Set(),
    lastHeader: null,
    streamSummary: {
      thinking: []
      // drawing will be added when we start processing chart data
    }
  });
  
  // Track current sections and timeline in refs to avoid closure issues
  const sectionsRef = useRef<Section[]>([]);
  const timelineRef = useRef<Timeline|undefined>(undefined);
  const x0DateRef = useRef<Date | null>(null);
  
  // Update refs when state changes
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);
  
  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);
  
  useEffect(() => {
    x0DateRef.current = x0Date;
  }, [x0Date]);
  
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
    
    if (updatedStreamState.streamSummary) {
      setNewSummary(updatedStreamState.streamSummary);
    }
  }, []);

  // Helper function to start processing the buffer if not already processing
  const startProcessingBuffer = useCallback(() => {
    if (!isProcessingBufferRef.current && actionBufferRef.current.length > 0) {
      isProcessingBufferRef.current = true;
      processNextBatchFromBuffer();
    }
  }, []);

  // Process all actions in the buffer at once
  const processAllBuffer = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (!isProcessingBufferRef.current && actionBufferRef.current.length > 0) {
        isProcessingBufferRef.current = true;
        
        // Process all actions one after another
        const processAllActions = async () => {
          const totalActions = actionBufferRef.current.length;
          let processedCount = 0;
          
          // Process actions until buffer is empty
          const processNextAction = async () => {
            if (actionBufferRef.current.length === 0) {
              // All done
              isProcessingBufferRef.current = false;
              setProcessingBufferProgress(100);
              setNextAction(null);
              resolve(); // Resolve the promise when all actions are processed
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
              { sections: sectionsRef.current, timeline: timelineRef.current, x0Date: x0DateRef.current },
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
            if (actionsToQueue.length > 0) {
              actionBufferRef.current = [...actionBufferRef.current, ...actionsToQueue];
            }
            
            // Process next action asynchronously but sequentially using a promise
            return new Promise<void>(nextResolve => {
              // Small delay to allow UI updates but wrapped in a Promise to maintain sequence
              setTimeout(() => {
                processNextAction().then(nextResolve);
              }, 50);
            });
          };
          
          // Start processing
          await processNextAction();
        };
        
        // Begin processing all actions
        processAllActions();
      } else {
        // If no actions to process or already processing, resolve immediately
        if (actionBufferRef.current.length === 0) {
          setProcessingBufferProgress(100);
        }
        resolve();
      }
    });
  }, []);

  // Function to update a task's start date (for drag functionality)
  const updateTaskStartDate = useCallback(async (taskId: string, newStartDate: Date) => {
    // Find task and its section for updating
    const taskDuration = (taskDictionaryRef.current[taskId] as Task)?.duration;
    const taskEndDate = new Date(newStartDate);
    if (taskDuration) {
      taskEndDate.setDate(taskEndDate.getDate() + taskDuration);
    }
    let sectionName: string | undefined;
    let originalTask: Task | undefined;
    for (const sec of sectionsRef.current) {
      const t = sec.tasks.find(task => task.id === taskId);
      if (t) {
        console.log(`Found task ${taskId} in section ${sec.name}`);
        sectionName = sec.name;
        originalTask = t;
        break;
      }
    }
    if (!sectionName || !originalTask) return;
    // Build full updated task object
    const updatedTask: Task = {
      ...originalTask,
      startDate: newStartDate, 
      endDate: taskEndDate
    };

    // Dispatch update with sectionName and full task
    console.log('updateTaskStartDate', updatedTask);
    addActionToBuffer('UPDATE_TASK_STARTDATE', { sectionName, taskId, startDate: newStartDate });
    // Process immediately
    await processAllBuffer();
    debouncedSave();
  }, [addActionToBuffer, processAllBuffer]);

  // Function to update a task's duration (for resize functionality)
  const updateTaskDuration = useCallback(async (taskId: string, newDuration: number) => {
    // Find task and its section for updating
    let sectionName: string | undefined;
    let originalTask: Task | undefined;
    for (const sec of sectionsRef.current) {
      const t = sec.tasks.find(task => task.id === taskId);
      if (t) {
        sectionName = sec.name;
        originalTask = t;
        break;
      }
    }
    if (!sectionName || !originalTask) return;
    const startDate = ensureDate(originalTask.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + newDuration);
    const updatedTask: Task = {
      ...originalTask,
      startDate,
      duration: newDuration,
      endDate
    };
    console.log('updateTaskDuration', updatedTask);
    addActionToBuffer('UPDATE_TASK_DURATION', { sectionName, taskId, newDuration, endDate });
    await processAllBuffer();
    debouncedSave();
  }, [addActionToBuffer, processAllBuffer]);

  // Process a batch of actions from the buffer
  const processNextBatchFromBuffer = useCallback(async () => {
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
    for (const action of actionsToProcess) {
      const { updatedState, updatedTaskDictionary, actionsToQueue } = processAction(
        { sections: sectionsRef.current, timeline: timelineRef.current, x0Date: x0DateRef.current },
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
      if (actionsToQueue.length > 0) {
        actionBufferRef.current = [...actionBufferRef.current, ...actionsToQueue];
      }
    }

    // Set not processing to allow next batch
    isProcessingBufferRef.current = false;
  }, []);

  // Debounced save function (1.5s after last change)
  const debouncedSave = useRef(
    debounce(async () => {
      console.log('Saving draft chart...');
      if (!projectIdRef.current) return;
      
      // Filter out any empty sections before saving
      const currentSections = sectionsRef.current.filter(section => 
        section.tasks && section.tasks.length > 0
      );
      
      if (currentSections.length === 0) {
        console.log('No sections with tasks to save, skipping save');
        return;
      }
      
      await projectDraftChartService.saveChart(projectIdRef.current, { 
        sections: currentSections, 
        timeline: timelineRef.current 
      });
    }, 1500)
  ).current;


  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

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
        lastHeader: null,
        streamSummary: {
          thinking: []
          // drawing will be added when we start processing chart data
        }
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
        async () => {
          // Final dependency resolution after all content is processed
          processDependencies();
          setStreamProgress(100);
          
          // Process all actions in the buffer and wait for completion
          try {
            await processAllBuffer();
            debouncedSave();
            setIsLoading(false);
          } catch (error) {
            console.error('Error processing buffer:', error);
            setIsLoading(false);
          }
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
    x0Date,
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
    actionBuffer: actionBufferRef.current,
    newSummary,
    TIMELINE_PIXELS_PER_DAY,
    setTIMELINE_PIXELS_PER_DAY,
    updateTaskStartDate,
    updateTaskDuration
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
