import React from 'react';
import { StreamingPlan } from './StreamingPlanSummary/StreamingPlan';
import type { StreamSummary, SketchSummary } from '../../../utils/types';

interface PlaceholderProps {
  action: string;
  idx: number;
  hasPlan: boolean;
  newSummary?: StreamSummary;
  sketchSummary?: SketchSummary;
}

const Placeholder: React.FC<PlaceholderProps> = ({ action, idx, hasPlan, newSummary, sketchSummary }) => {
  if (action === 'CREATE_PROJECT_GANTT') {
    return (
      <StreamingPlan
        key={`placeholder-${idx}`}
        data={{
          label: hasPlan ? 'Regenerate Project Plan' : 'Generate Project Plan',
          isVisible: true,
        }}
        newSummary={newSummary}
        sketchSummary={sketchSummary}
      />
    );
  }
  return <span key={`placeholder-${idx}`}>{`[[${action}]]`}</span>;
};

export default Placeholder;
