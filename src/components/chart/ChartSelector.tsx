import React, { useState } from 'react';
import { useGantt } from '../../context/GanttContext';
import { GanttData } from '../../types'; 
import { v4 as uuidv4 } from 'uuid';

export const ChartSelector: React.FC<{ isSidebar?: boolean }> = ({ isSidebar = false }) => {
  const { 
    allCharts, 
    currentChart, 
    loadChartById, 
    createNewChart, 
    deleteChart,
    isLoading, 
    error 
  } = useGantt();
  
  const [showNewChartForm, setShowNewChartForm] = useState(false);
  const [newChartName, setNewChartName] = useState('');
  const [newChartDesc, setNewChartDesc] = useState('');
  
  // Create a new chart with default values
  const handleCreateChart = () => {
    if (!newChartName.trim()) return;
    
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 14); // Default 2 week period
    
    const newChart: GanttData = {
      id: uuidv4(),
      name: newChartName.trim(),
      description: newChartDesc.trim(),
      start: today.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      milestones: [],
      tasks: []
    };
    
    createNewChart(newChart).then(success => {
      if (success) {
        setNewChartName('');
        setNewChartDesc('');
        setShowNewChartForm(false);
      }
    });
  };
  
  // Handle deleting a chart with confirmation
  const handleDeleteChart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chart? This action cannot be undone.')) {
      deleteChart(id);
    }
  };
  
  return (
    <div className={`bg-white rounded-lg ${isSidebar ? 'p-0' : 'shadow-md p-4 mb-4'}`}>
      <div className="flex justify-between items-center mb-4">
        {!isSidebar && <h2 className="text-xl font-semibold">Gantt Charts</h2>}
        <button 
          onClick={() => setShowNewChartForm(!showNewChartForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          {showNewChartForm ? 'Cancel' : 'New Chart'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 mb-4 rounded text-sm">
          {error}
        </div>
      )}
      
      {showNewChartForm && (
        <div className="mb-4 p-3 border border-gray-200 rounded">
          <h3 className="font-medium mb-2 text-sm">Create New Chart</h3>
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Chart Name:
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              value={newChartName}
              onChange={(e) => setNewChartName(e.target.value)}
              placeholder="Enter chart name"
            />
          </div>
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description:
            </label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded text-sm"
              value={newChartDesc}
              onChange={(e) => setNewChartDesc(e.target.value)}
              placeholder="Enter chart description"
              rows={2}
            />
          </div>
          <button
            onClick={handleCreateChart}
            disabled={!newChartName.trim()}
            className={`px-3 py-1 rounded text-sm ${
              newChartName.trim()
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Create Chart
          </button>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-4 text-sm">Loading charts...</div>
      ) : allCharts.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          No charts available. Create one to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {allCharts.map((chart) => (
            <div
              key={chart.id}
              onClick={() => loadChartById(chart.id)}
              className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                currentChart?.id === chart.id
                  ? 'bg-blue-100 border border-blue-300'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className="overflow-hidden">
                <h3 className="font-medium text-sm truncate">{chart.name}</h3>
                <p className="text-xs text-gray-600 truncate">{chart.description}</p>
                <div className="text-xs text-gray-500 mt-1">
                  {chart.start} to {chart.end}
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteChart(chart.id, e)}
                className="text-red-500 hover:text-red-700 ml-2 text-sm"
                title="Delete chart"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
