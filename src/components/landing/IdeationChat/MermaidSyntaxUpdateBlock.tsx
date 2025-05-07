import { FC, useEffect, useState } from 'react';
import { useBlock } from '../../../contexts/MessageBlocksContext';
import { useDraftPlanMermaidContext } from '../../../contexts/DraftPlan/DraftPlanContextMermaid';
import { formatDate, formatDuration } from './StreamingPlanSummary/utils';
import { Calendar, CheckSquare, Flag } from 'lucide-react';

interface MermaidSyntaxUpdateBlockProps {
  messageId: string;
}

const MermaidSyntaxUpdateBlock: FC<MermaidSyntaxUpdateBlockProps> = ({ messageId }) => {
  const stream = useBlock('editedmermaidmarkdown', messageId);
  const { sketchSummary, createPlanFromPureMarkdownStream } = useDraftPlanMermaidContext();
  const [prevSummary, setPrevSummary] = useState(sketchSummary);

  useEffect(() => {
    if (stream && !stream.locked) {
      createPlanFromPureMarkdownStream(stream);
    }
  }, [stream, createPlanFromPureMarkdownStream]);

  useEffect(() => {
    if (sketchSummary && !prevSummary) {
      setPrevSummary(sketchSummary);
    }
  }, [sketchSummary, prevSummary]);

  if (!sketchSummary || !prevSummary) return null;

  const old = prevSummary;
  const neu = sketchSummary;

  const [oldDurNum, oldDurUnit] = formatDuration(old.duration).split(' ');
  const [newDurNum, newDurUnit] = formatDuration(neu.duration).split(' ');
  const oldTasks = old.totalTasks;
  const newTasks = neu.totalTasks;
  const oldMilestones = old.totalMilestones;
  const newMilestones = neu.totalMilestones;
  const oldStart = old.startDate;
  const newStart = neu.startDate;
  const oldEnd = old.endDate;
  const newEnd = neu.endDate;

  // Defensive: handle undefined dates safely
  const startChanged = oldStart && newStart ? oldStart.getTime() !== newStart.getTime() : String(oldStart) !== String(newStart);
  const endChanged = oldEnd && newEnd ? oldEnd.getTime() !== newEnd.getTime() : String(oldEnd) !== String(newEnd);

  return (
    <div className="bg-gray-800 rounded-xl relative overflow-hidden p-1">
      <div className="relative z-10 p-2">
        <div className="mb-4">
          <div className="relative bg-gray-900 rounded-lg p-4 shadow-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="text-white w-5 h-5" />
              <span className="text-white font-medium">Timeline</span>
            </div>
            <div className="flex items-baseline space-x-2">
              {oldDurNum !== newDurNum && <span className="text-gray-400 line-through">{oldDurNum}</span>}
              <span className="text-white font-bold text-3xl">{newDurNum}</span>
              <span className="text-gray-400 text-sm">{newDurUnit}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="relative bg-gray-900 rounded-lg p-4 shadow h-full flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckSquare className="text-white w-5 h-5" />
                <span className="text-white font-medium">Tasks</span>
              </div>
              <div className="flex items-baseline space-x-2">
                {oldTasks !== newTasks && <span className="text-gray-400 line-through">{oldTasks}</span>}
                <span className="text-3xl font-bold text-white">{newTasks}</span>
              </div>
            </div>
          </div>
          <div>
            <div className="relative bg-gray-900 rounded-lg p-4 shadow h-full flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flag className="text-white w-5 h-5" />
                <span className="text-white font-medium">Milestones</span>
              </div>
              <div className="flex items-baseline space-x-2">
                {oldMilestones !== newMilestones && <span className="text-gray-400 line-through">{oldMilestones}</span>}
                <span className="text-3xl font-bold text-white">{newMilestones}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap md:flex-nowrap justify-between items-center">
          <div>
            <div className="text-gray-400 text-sm">Start</div>
            <div className={startChanged ? 'line-through text-gray-400' : 'text-white'}>
              {formatDate(oldStart)} → {newStart ? formatDate(newStart) : 'N/A'}
            </div>
          </div>
          <div className="hidden md:block text-2xl text-gray-500">→</div>
          <div>
            <div className="text-gray-400 text-sm">End</div>
            <div className={endChanged ? 'line-through text-gray-400' : 'text-white'}>
              {formatDate(oldEnd)} → {newEnd ? formatDate(newEnd) : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MermaidSyntaxUpdateBlock;
