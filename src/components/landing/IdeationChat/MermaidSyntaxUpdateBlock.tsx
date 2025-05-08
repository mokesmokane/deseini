import { FC, useEffect, useState } from 'react';
import { useBlock } from '../../../contexts/MessageBlocksContext';
import { useRef } from 'react';
import { useCallback } from 'react';
import { SketchSummary, StreamState } from '../../../utils/types';
import { streamByLine } from '@/utils/streamLines';
import { BufferedAction } from '@/utils/types';
import { 
  processMermaidStreamData
} from '@/utils/streamProcessor';
import { Task, Timeline } from '@/contexts/DraftPlan/types';
import { PlanSummary } from './StreamingPlanSummary/PlanSummary';

export const useMermaidSyntaxSummary = () => {

  const [sketchSummaryState, setSketchSummaryState] = useState<SketchSummary | undefined>(undefined);
  
    // Task dictionary to track all tasks for efficient dependency resolution
    const taskDictionaryRef = useRef<Record<string, Task>>({});
    
    // Action buffer to store pending changes
    const actionBufferRef = useRef<BufferedAction[]>([]);
    const isProcessingBufferRef = useRef<boolean>(false);

    const timelineRef = useRef<Timeline|undefined>(undefined);

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

     const handleMermaidStreamData = useCallback((content: string) => {
        console.log('[Handle mermaid stream] content:', content);
    
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
        if (updatedStreamState.streamSummary) {
          console.log('[Handle mermaid stream] sketchSummary', updatedStreamState.streamSummary.sketchSummary);
          setSketchSummaryState(
            updatedStreamState.streamSummary.sketchSummary
              ? { ...updatedStreamState.streamSummary.sketchSummary }
              : undefined
          );
        }
      }, []);

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
  
        await (async () => {
          try {
            while (true) {
              const { value, done } = await mermaidReader.read();
              if (done) break;
              try {
                handleMermaidStreamData(value);
              } catch (error) {
                console.error('Error processing main stream:', error);
              }
            }
          } finally {
            mermaidReader.releaseLock();
          }
        })();
      } catch (error) {
        console.error('Error creating plan from markdown:', error);
      }
    };
  const createPlanFromPureMarkdownString = async (markdownString: string): Promise<void> => {
    const lines = markdownString.split('\n').map(line => line + '\n');
    const stream = new ReadableStream<string>({
      start(controller) {
        for (const line of lines) {
          controller.enqueue(line);
        }
        controller.close();
      },
    });
    await createPlanFromPureMarkdownStream(stream);
  };

  return { sketchSummaryState, createPlanFromPureMarkdownString, createPlanFromPureMarkdownStream };
};


interface MermaidSyntaxUpdateBlockProps {
  messageId: string;
  content?: string;
}

const MermaidSyntaxUpdateBlock: FC<MermaidSyntaxUpdateBlockProps> = ({ messageId, content }) => {
  const stream = useBlock('editedmermaidmarkdown', messageId);
  const { sketchSummaryState, createPlanFromPureMarkdownStream, createPlanFromPureMarkdownString } = useMermaidSyntaxSummary();

  useEffect(() => {
    if (stream && !stream.locked) {
      createPlanFromPureMarkdownStream(stream);
    } else if (content) {
      createPlanFromPureMarkdownString(content);
    }
  }, [stream]);

  if (!sketchSummaryState) return null;

  return (
    <PlanSummary sketchSummary={sketchSummaryState}/>
  );
};

export default MermaidSyntaxUpdateBlock;
