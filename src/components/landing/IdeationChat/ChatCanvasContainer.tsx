import React from 'react';
import { motion } from 'framer-motion';
import { ChatPanel } from './ChatPanel';
import Canvas from '../IdeationCanvas/Canvas';
import TextInput from './TextInput';
import Sidebar from '../IdeationSidebar/Sidebar';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useMessaging } from '../../../contexts/Messaging/MessagingProvider';
import { useProject } from '../../../contexts/ProjectContext';
import { useGantt } from '../../../contexts/GanttContext';
import { useParams } from 'react-router-dom';
import { GanttChart } from '../../chart/GanttChart';
import { useState, useEffect, useRef } from 'react';

const ChatCanvasContainer: React.FC = () => {
  const { messages, isCanvasVisible: canvasVisible, isChatVisible, toggleChat } = useMessaging();
  const {projectId, chartId} = useParams<{ projectId: string , chartId: string }>();
  //if theres a chartid on the url then we are displaying the chart pane reather than the canvas
  const showChart = chartId && chartId !== 'new';
  const {project, fetchProjectCharts} = useProject();
  const isCanvasVisible = canvasVisible || project !== null && project !== undefined


  const [isLoading, setIsLoading] = useState(true);
  const { loadChartById } = useGantt();


    
  // Fetch charts when project is loaded or projectId changes
  useEffect(() => {
    if (projectId && projectId !== project?.id && projectId !== 'new') {
      fetchProjectCharts(projectId);
    }
  }, [projectId, fetchProjectCharts]); // Added fetchProjectCharts dependency

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


  return (
    <div className="relative w-full bg-gray-100 h-full flex min-h-0 min-w-0">
      {/* Sidebar that slides in from the left when canvas is visible */}
      <Sidebar isVisible={project !== null} />
      
      {/* Chat panel that slides to the left when canvas is visible */}
      <motion.div 
        className="flex flex-col relative"
        initial={{ width: '100%' }}
        animate={{ 
          width: isCanvasVisible ? (isChatVisible ? '36rem' : '0') : '100%',
          marginLeft: isCanvasVisible ? '0' : 'auto', 
          marginRight: isCanvasVisible ? '0' : 'auto'
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className={`flex-grow overflow-hidden relative ${project !== null ? 'pl-[72px]' : ''}`}>
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm pointer-events-none z-0 transition-all duration-300" />
          <div className="relative z-0 h-full">
            <ChatPanel />
          </div>

          {/* Position the TextInput absolutely at the bottom of the container */}
          <div className={`absolute bottom-0 left-0 right-0 px-2 pb-4 pt-2 z-10 ${project !== null ? 'pl-[80px]' : ''}`}>
            {isChatVisible && <TextInput hasStarted={true} />}
          </div>
        </div>
      </motion.div>
      
      {/* Toggle chat button */}
      {isCanvasVisible && (
        <button
          onClick={toggleChat}
          style={{ left: isChatVisible ? 'calc(36rem)' : '72px', zIndex: 60 }}
          className="absolute top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1.5 border-0 focus:outline-none"
          aria-label={isChatVisible ? "Hide Chat" : "Show Chat"}
          title={isChatVisible ? "Hide Chat" : "Show Chat"}
        >
          {isChatVisible ? (
            <ChevronLeftIcon className="h-4 w-4 text-gray-700" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-gray-700" />
          )}
        </button>
      )}
      
      {/* Canvas that slides in from the right */}
      <motion.div
        className={`h-full w-full min-h-0 min-w-0 overflow-hidden ${project !== null && !isChatVisible ? 'pl-[72px]' : ''}`}
        initial={{ width: 0 }}
        animate={{ 
          width: isCanvasVisible ? (isChatVisible ? 'calc(100% - 36rem)' : '') : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >{showChart ? 

    <div className="flex items-center justify-center p-4 w-full h-full min-h-0 min-w-0">
    <div className="w-full h-full min-h-0 min-w-0 bg-white rounded-xl shadow-xl overflow-hidden flex flex-col border-gray-200">
        <GanttChart />
    </div>
    </div>
    : <Canvas isVisible={isCanvasVisible} isChatVisible={isChatVisible} />}
      </motion.div>
    </div>
  );
};

export default ChatCanvasContainer;
