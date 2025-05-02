import { CSSProperties } from 'react';

export interface TimelineItem {
  id: string | number;
  label?: string;
  color?: string;
  tooltip?: string;
  date?: string | Date;
  status?: 'active' | 'completed' | 'pending';
}

export interface AnimatedTimelineProps {
  items: TimelineItem[];
  primaryColor?: string;
  secondaryColor?: string;
  lineHeight?: number;
  dotSize?: number;
  animationDuration?: number;
  className?: string;
  style?: CSSProperties;
  showTooltips?: boolean;
  onDotClick?: (item: TimelineItem, index: number) => void;
}