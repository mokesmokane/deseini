import { useParams } from 'react-router-dom';
import { GanttChart } from '../components/chart/GanttChart';
import { useEffect, useState, useRef } from 'react';
import { useGantt } from '../contexts/GanttContext';

// Following the Single Responsibility Principle - this component is only responsible for chart viewing
const ChartView = () => {
  const { chartId } = useParams<{ chartId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const { loadChartById, currentChart } = useGantt();
  
  // Use a ref to track if we've already loaded this chart ID to prevent infinite loops
  const loadedChartRef = useRef<string | null>(null);
  
  // Only load the chart when the ID changes and we haven't loaded it yet
  useEffect(() => {
    // Skip loading if we're on the "new" route or no chart ID
    if (!chartId || chartId === 'new') {
      setIsLoading(false);
      return;
    }
    
    // Skip if we've already loaded this chart ID
    if (loadedChartRef.current === chartId) {
      return;
    }
    
    const loadChart = async () => {
      try {
        setIsLoading(true);
        console.log('ChartView: Loading chart with ID:', chartId);
        await loadChartById(chartId);
        
        // Mark this chart as loaded
        loadedChartRef.current = chartId;
      } catch (error) {
        console.error('Error loading chart:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChart();
  }, [chartId, loadChartById]);
  
  // When the current chart changes, update loading state
  useEffect(() => {
    if (currentChart && isLoading) {
      setIsLoading(false);
    }
  }, [currentChart, isLoading]);
  
  if (isLoading) {
    return <div className="p-8 text-center">Loading chart...</div>;
  }
  
  return (
    <div className="h-full">
      <GanttChart />
    </div>
  );
};

export default ChartView;
