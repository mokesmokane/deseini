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
    <div className="bg-gray-900 rounded-xl relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-gradient-x" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/90 to-gray-900" />

      <div className="relative z-10 p-2">
        {/* Timeline card with duration */}
        <div className="group relative mb-4">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300" />
          <div className="relative bg-gray-900 rounded-lg p-4 border border-pink-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Calendar className="text-pink-400 w-5 h-5" />
                <span className="text-pink-400 font-medium">Timeline</span>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-white font-bold text-3xl">{durationNumber}</div>
                <div className="text-gray-400 text-sm -mt-1">{durationUnit}</div>
              </div>
            </div>
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center">
              <div className="mr-4">
                <div className="text-gray-400 text-sm">Start</div>
                <div className="text-white">{formatDate(sketchSummary.startDate)}</div>
              </div>
              <div className="hidden md:block text-2xl text-gray-600">→</div>
              <div>
                <div className="text-gray-400 text-sm">End</div>
                <div className="text-white">{formatDate(sketchSummary.endDate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks and Milestones cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300" />
            <div className="relative bg-gray-900 rounded-lg p-4 border border-green-500/30 h-full">
              <div className="flex items-center space-x-2 mb-1">
                <CheckSquare className="text-green-400 w-5 h-5" />
                <span className="text-green-400 font-medium">Tasks</span>
              </div>
              <div className="text-3xl font-bold text-white">{sketchSummary.totalTasks}</div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300" />
            <div className="relative bg-gray-900 rounded-lg p-4 border border-yellow-500/30 h-full">
              <div className="flex items-center space-x-2 mb-1">
                <Flag className="text-yellow-400 w-5 h-5" />
                <span className="text-yellow-400 font-medium">Milestones</span>
              </div>
              <div className="text-3xl font-bold text-white">{sketchSummary.totalMilestones}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});