import { MILESTONE_SIZE } from '../constants/gantt';
import { Milestone } from '../../../types';

interface MilestoneNodeProps {
  data: Milestone;
}

export const MilestoneNode = ({ data }: MilestoneNodeProps) => (
  <div className="relative" style={{ width: `${MILESTONE_SIZE}px`, height: `${MILESTONE_SIZE}px` }}>
    <div 
      className="absolute left-1/2 top-1/2 bg-red-500 -translate-x-1/2 -translate-y-1/2 rotate-45"
      style={{ 
        width: `${MILESTONE_SIZE}px`,
        height: `${MILESTONE_SIZE}px`,
        borderRadius: `${MILESTONE_SIZE * 0.15}px`
      }}
    />
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap text-sm">
      {data.name}
    </div>
  </div>
);
