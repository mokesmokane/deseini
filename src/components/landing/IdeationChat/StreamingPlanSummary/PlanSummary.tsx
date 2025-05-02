import { memo } from 'react';

interface PlanSummaryProps {
  newSummary: any;
  formatDate: (date?: Date) => string;
  formatDuration: (days: number) => string;
}
import { Calendar, CheckSquare, Flag } from 'lucide-react';

export const PlanSummary = memo(({ newSummary, formatDate, formatDuration }: PlanSummaryProps) => {
  if (!newSummary?.sketchSummary) return null;
  const { sketchSummary } = newSummary;

  // Split the formatted duration into number and unit for better styling
  const durationParts = formatDuration(sketchSummary.duration).split(' ');
  const durationNumber = durationParts[0];
  const durationUnit = durationParts[1] || 'days';

  return (
    <div className="bg-white rounded-xl relative overflow-hidden border border-gray-300">
      {/* Black & white theme: removed gradients */}
      <div className="relative z-10 p-2">
        {/* Timeline card with duration */}
        <div className="mb-4">
          <div className="relative bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Calendar className="text-black w-5 h-5" />
                <span className="text-black font-medium">Timeline</span>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-black font-bold text-3xl">{durationNumber}</div>
                <div className="text-gray-500 text-sm -mt-1">{durationUnit}</div>
              </div>
            </div>
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center">
              <div className="mr-4">
                <div className="text-gray-500 text-sm">Start</div>
                <div className="text-black">{formatDate(sketchSummary.startDate)}</div>
              </div>
              <div className="hidden md:block text-2xl text-gray-600">→</div>
              <div>
                <div className="text-gray-500 text-sm">End</div>
                <div className="text-black">{formatDate(sketchSummary.endDate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks and Milestones cards */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="relative bg-white rounded-lg p-4 border border-gray-200 shadow-sm h-full">
              <div className="flex items-center space-x-2 mb-1">
                <CheckSquare className="text-black w-5 h-5" />
                <span className="text-black font-medium">Tasks</span>
              </div>
              <div className="text-3xl font-bold text-black">{sketchSummary.totalTasks}</div>
            </div>
          </div>
          <div>
            <div className="relative bg-white rounded-lg p-4 border border-gray-200 shadow-sm h-full">
              <div className="flex items-center space-x-2 mb-1">
                <Flag className="text-black w-5 h-5" />
                <span className="text-black font-medium">Milestones</span>
              </div>
              <div className="text-3xl font-bold text-black">{sketchSummary.totalMilestones}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});