import { memo } from 'react';
import { StreamSummary, SketchSummary } from '@/utils/types';
import { Calendar, CheckSquare, Flag } from 'lucide-react';
import { formatDate, formatDuration } from './utils';

interface PlanSummaryProps {
  newSummary?: StreamSummary;
  sketchSummary?: SketchSummary;
}

export const PlanSummary = memo(({ sketchSummary }: PlanSummaryProps) => {
  // Split the formatted duration into number and unit for better styling
  const duration = sketchSummary?.duration ? formatDuration(sketchSummary!.duration) : '';
  const durationParts = duration.split(' ');
  const durationNumber = durationParts[0];
  const durationUnit = durationParts[1] || 'days';

  return (
      <div className="relative z-10 pt-2">
        {/* Timeline card with duration */}
        <div className="mb-2">
          <div className="relative bg-black  rounded-md p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <button
                  className="bg-transparent border-none p-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full"
                  aria-label="View Mermaid Chart Syntax"
                >
                  <Calendar className="text-white w-5 h-5 hover:text-gray-300 transition-colors" />
                </button>
                <span className="text-white font-medium">Timeline</span>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-white font-bold text-3xl">{durationNumber}</div>
                <div className="text-gray-400 text-sm -mt-1">{durationUnit}</div>
              </div>
            </div>
            {sketchSummary && (
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center">
              <div className="mr-4">
                <div className="text-gray-400 text-sm">Start</div>
                <div className="text-white">{formatDate(sketchSummary!.startDate)}</div>
              </div>
              <div className="hidden md:block text-2xl text-gray-500">→</div>
              <div>
                <div className="text-gray-400 text-sm">End</div>
                <div className="text-white">{formatDate(sketchSummary!.endDate)}</div>
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Tasks and Milestones cards */}
        {sketchSummary && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <div className="relative bg-black rounded-lg p-4 shadow h-full">
              <div className="flex items-center space-x-2 mb-1">
                <CheckSquare className="text-white w-5 h-5" />
                <span className="text-white font-medium">Tasks</span>
              </div>
              <div className="text-3xl font-bold text-white">{sketchSummary!.totalTasks}</div>
            </div>
          </div>
          <div>
            <div className="relative bg-black rounded-lg p-4 shadow h-full">
              <div className="flex items-center space-x-2 mb-1">
                <Flag className="text-white w-5 h-5" />
                <span className="text-white font-medium">Milestones</span>
              </div>
              <div className="text-3xl font-bold text-white">{sketchSummary!.totalMilestones}</div>
            </div>
          </div>
        </div>
        )}
      </div>

      
  );
});