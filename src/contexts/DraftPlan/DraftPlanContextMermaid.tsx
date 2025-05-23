import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { StreamState, StreamSummary, SketchSummary, LineValidation } from '../../utils/types';
import { validateMermaidGantt } from '../../utils/mermaidValidator';
import { 
  processMainStreamData,
  processMermaidStreamData
} from '../../utils/streamProcessor';
import { 
  processAction 
} from '../../utils/actionProcessor';
import {
  sseStreamToText
} from '../../utils/streamHandler';
import {
  streamByLine
} from '../../utils/streamLines';
import { BufferedAction, ActionType } from '../../utils/types';
import { Section, Timeline, Task } from './types';
import { projectDraftChartService } from '../../services/projectDraftChartService';
import { debounce } from 'lodash';
import { ensureDate } from '../../hooks/utils';
import { useProject } from '../ProjectContext';
import { streamToStreams } from '../../utils/stream';
import { draftPlanToMermaid } from '../../utils/mermaidParser';

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
  updateSectionLabel: (oldName: string, newName: string) => void;
  sections: Section[];
  timeline: Timeline | undefined;
  x0Date: Date | null;
  createPlanFromMarkdownStream: (markdownStream: ReadableStream<Uint8Array>) => Promise<StreamState | undefined>;
  createPlanFromMarkdownString: (markdownString: string) => Promise<void>;
  createPlanFromPureMarkdownStream: (stream: ReadableStream<string>) => Promise<void>;
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
  updateTaskLabel: (taskId: string, newLabel: string) => void;
  updateMilestoneLabel: (milestoneId: string, newLabel: string) => void;
  deleteTask: (taskId: string) => void;
  deleteDependency: (sourceId: string, targetId: string) => void;
  addDependency: (sourceId: string, targetId: string) => void;
  newSummary: StreamSummary | undefined;
  sketchSummary: SketchSummary | undefined;
  getMermaidMarkdown: () => string;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  toggleSettings: () => void;
  lineValidations: Record<number, LineValidation>;
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
  const [sketchSummaryState, setSketchSummaryState] = useState<SketchSummary | undefined>(undefined);
  const [processingBufferProgress, setProcessingBufferProgress] = useState<number>(0);
  const [actionBufferLength, setActionBufferLength] = useState<number>(0);
  const [nextAction, setNextAction] = useState<BufferedAction | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [lineValidations, setLineValidations] = useState<Record<number, LineValidation>>({});
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

  // Handle streaming data from the server (main stream)
  const handleStreamData = useCallback((content: string) => {
    setFullSyntax(prev => prev + content);

    const { updatedStreamState, newStreamSummary } = processMainStreamData(
      content,
      streamStateRef.current
    );
    streamStateRef.current = updatedStreamState;

    if (newStreamSummary) {
      setStreamSummary(newStreamSummary);
    }
    if (updatedStreamState.streamSummary) {
      setNewSummary(updatedStreamState.streamSummary);
    }
  }, []);

  const handleMermaidStreamData = useCallback((content: string) => {
    const {
      updatedStreamState,
      updatedActionBuffer,
      updatedTimeline,
      updatedTaskDictionary
    } = processMermaidStreamData(
      content,
      streamStateRef.current,
      actionBufferRef.current,
      timelineRef.current,
      taskDictionaryRef.current
    );
    streamStateRef.current = updatedStreamState;
    actionBufferRef.current = updatedActionBuffer;
    timelineRef.current = updatedTimeline;
    taskDictionaryRef.current = updatedTaskDictionary;
    const newMermaidSyntax = updatedStreamState.streamSummary.mermaidMarkdown!;
    setMermaidSyntax(newMermaidSyntax);
    setActionBufferLength(actionBufferRef.current.length);
    if (actionBufferRef.current.length > 0) {
      setNextAction(actionBufferRef.current[0]);
    }
    if (updatedStreamState.streamSummary) {
      setNewSummary(updatedStreamState.streamSummary);
      setSketchSummaryState(
        updatedStreamState.streamSummary.sketchSummary
          ? { ...updatedStreamState.streamSummary.sketchSummary }
          : undefined
      );
    }
    // update line validations
    const validations = validateMermaidGantt(newMermaidSyntax);
    setLineValidations(validations);
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
        sectionName = sec.name;
        originalTask = t;
        break;
      }
    }
    if (!sectionName || !originalTask) return;
    // Build full updated task objectith sectionName and full task
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
    addActionToBuffer('UPDATE_TASK_DURATION', { sectionName, taskId, newDuration, endDate });
    await processAllBuffer();
    debouncedSave();
  }, [addActionToBuffer, processAllBuffer]);

  // Function to update a task's label
  const updateTaskLabel = useCallback(async (taskId: string, newLabel: string) => {
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
    addActionToBuffer('UPDATE_TASK_LABEL', { sectionName, taskId, newLabel });
    await processAllBuffer();
    debouncedSave();
  }, [addActionToBuffer, processAllBuffer]);

  // Function to update a milestone's label
  const updateMilestoneLabel = useCallback(async (milestoneId: string, newLabel: string) => {
    let sectionName: string | undefined;
    let milestoneObj: Task | undefined;
    for (const sec of sectionsRef.current) {
      const m = sec.tasks.find(task => task.id === milestoneId && task.type === 'milestone');
      if (m) {
        sectionName = sec.name;
        milestoneObj = m;
        break;
      }
    }
    if (!sectionName || !milestoneObj) return;
    addActionToBuffer('UPDATE_MILESTONE', { sectionName, milestone: milestoneObj, newLabel });
    await processAllBuffer();
    debouncedSave();
  }, [addActionToBuffer, processAllBuffer]);

  // Function to delete a task
  const deleteTask = useCallback(async (taskId: string) => {
    // find section containing task
    let sectionName: string | undefined;
    for (const sec of sectionsRef.current) {
      if (sec.tasks.some(t => t.id === taskId)) {
        sectionName = sec.name;
        break;
      }
    }
    if (!sectionName) return;
    addActionToBuffer('DELETE_TASK', { sectionName, taskId });
    await processAllBuffer();
    debouncedSave();
  }, [addActionToBuffer, processAllBuffer]);

  // Function to delete a dependency (edge)
  const deleteDependency = useCallback(async (sourceId: string, targetId: string) => {
    let sectionName: string | undefined;
    for (const sec of sectionsRef.current) {
      if (sec.tasks.some(t => t.id === targetId)) {
        sectionName = sec.name;
        break;
      }
    }
    if (!sectionName) return;
    addActionToBuffer('DELETE_DEPENDENCY', { sectionName, sourceId, targetId });
    await processAllBuffer();
    debouncedSave();
  }, [addActionToBuffer, processAllBuffer]);

  // Function to add a dependency (edge)
  const addDependency = useCallback(async (sourceId: string, targetId: string) => {
    let sectionName: string | undefined;
    for (const sec of sectionsRef.current) {
      if (sec.tasks.some(t => t.id === targetId)) {
        sectionName = sec.name;
        break;
      }
    }
    if (!sectionName) return;
    addActionToBuffer('ADD_DEPENDENCY', { sectionName, sourceId, targetId });
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
      if (!projectIdRef.current) return;
      
      // Filter out any empty sections before saving
      const currentSections = sectionsRef.current.filter(section => 
        section.tasks && section.tasks.length > 0
      );
      
      if (currentSections.length === 0) {
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


  const createPlanFromPureMarkdownStream = async (stream: ReadableStream<string>): Promise<void> => {
    try{
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
      setSketchSummaryState(undefined);
      
      const linesStream = streamByLine(stream);
      const mermaidReader = linesStream.getReader();

      const mainTask = (async () => {
        try {
          let first = true;
          while (true) {
            const { value, done } = await mermaidReader.read();
            if (done) break;
            try {
              if (first) {
                setIsLoading(true);
                setStreamProgress(0);
                setProcessingBufferProgress(0);

                // Reset data
                setSections([]);
                setMermaidSyntax('');
                setFullSyntax('');
                setStreamSummary('');
                first = false;
              }
              handleMermaidStreamData(value);
            } catch (error) {
              console.error('Error processing main stream:', error);
              setIsLoading(false);
            }
          }
        } finally {
          mermaidReader.releaseLock();
        }
      })();

      // Await both streams to finish
      await Promise.all([mainTask]);

      processDependencies();
      
      // Process all actions in the buffer and wait for completion
      try {
        await processAllBuffer();
        debouncedSave();
        setIsLoading(false);
      } catch (error) {
        console.error('Error processing buffer:', error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error creating plan from markdown:', error);
      setIsLoading(false);
    }
  };



  const createPlanFromStream = async (stream: ReadableStream<string>): Promise<StreamState | undefined> => {
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
      setSketchSummaryState(undefined);
      
      const linesStream = streamByLine(stream);
      const { mainStream, codeBlockStreams } = streamToStreams(linesStream, ["mermaid"]);
      const mermaidStream = codeBlockStreams["mermaid"];

      // Read main and mermaid streams concurrently for real-time processing
      const mainReader = mainStream.getReader();
      const mermaidReader = mermaidStream.getReader();

      const mainTask = (async () => {
        try {
          while (true) {
            const { value, done } = await mainReader.read();
            if (done) break;
            try {
              handleStreamData(value);
            } catch (error) {
              console.error('Error processing main stream:', error);
              setIsLoading(false);
            }
          }
        } finally {
          mainReader.releaseLock();
        }
      })();

      const mermaidTask = (async () => {
        try {
          while (true) {
            const { value, done } = await mermaidReader.read();
            if (done) break;
            try {
              handleMermaidStreamData(value);
            } catch (error) {
              console.error('Error processing mermaid stream:', error);
              setIsLoading(false);
            }
          }
        } finally {
          mermaidReader.releaseLock();
        }
      })();

      // Await both streams to finish
      await Promise.all([mainTask, mermaidTask]);

      processDependencies();
      
      // Process all actions in the buffer and wait for completion
      try {
        await processAllBuffer();
        debouncedSave();
        setIsLoading(false);
      } catch (error) {
        console.error('Error processing buffer:', error);
        setIsLoading(false);
      }
      return streamStateRef.current;
    } catch (error) {
      console.error('Error creating plan from markdown:', error);
      setIsLoading(false);
      return undefined;
    }
  };

  // Function to create plan from markdown stream
  const createPlanFromMarkdownStream = async (stream: ReadableStream<Uint8Array>): Promise<StreamState | undefined> => {
      const textStream = sseStreamToText(stream, 'content');
      return createPlanFromStream(textStream);
  };

  const createPlanFromMarkdownString = async (markdownString: string): Promise<void> => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        const lines = markdownString.split('\n');
        for (const line of lines) {
          controller.enqueue(encoder.encode(line + '\n'));
        }
        controller.close();
      }
    });
    await createPlanFromMarkdownStream(stream);
  };

  // Get the current mermaid markdown for the draft plan
  const getMermaidMarkdown = useCallback(() => {
    if (sections.length > 0) {
      return draftPlanToMermaid({ sections, timeline });
    }
    return mermaidSyntax || '';
  }, [sections, timeline, mermaidSyntax]);

  // Helper function to toggle settings panel
  const toggleSettings = useCallback(() => {
    setSettingsOpen(prev => !prev);
  }, []);

  // Update section label and immediately process the buffer
  const updateSectionLabel = useCallback(async (oldName: string, newName: string) => {
    addActionToBuffer('UPDATE_SECTION_LABEL', { oldName, newName });
    // Immediately process the buffer to apply the changes
    await processAllBuffer();
  }, [addActionToBuffer, processAllBuffer]);

  return (
    <DraftPlanMermaidContext.Provider
      value={{
        sections,
        timeline,
        x0Date,
        createPlanFromMarkdownStream,
        createPlanFromMarkdownString,
        createPlanFromPureMarkdownStream,
        isLoading,
        streamProgress,
        mermaidSyntax,
        fullSyntax,
        streamSummary,
        processingBufferProgress,
        startProcessingBuffer,
        processAllBuffer,
        TIMELINE_PIXELS_PER_DAY,
        setTIMELINE_PIXELS_PER_DAY,
        actionBufferLength,
        nextAction,
        actionBuffer: actionBufferRef.current,
        updateTaskStartDate,
        updateTaskDuration,
        updateTaskLabel,
        updateMilestoneLabel,
        deleteTask,
        deleteDependency,
        addDependency,
        updateSectionLabel,
        newSummary,
        sketchSummary: sketchSummaryState,
        lineValidations,
        getMermaidMarkdown,
        settingsOpen,
        setSettingsOpen,
        toggleSettings,
      }}
    >
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
