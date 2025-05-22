import { SearchIcon, ClockIcon, BarChart2, ChevronLeftIcon, Upload } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useFinalPlan } from '@/hooks/useFinalPlan';

interface Chart {
  id: string;
  name: string;
  updatedAt?: string;
}

interface SidebarChartsPanelProps {
  charts: Chart[];
  onClose: () => void;
  onChartSelect: (chartId: string, event: React.MouseEvent) => void;
}

export const SidebarChartsPanel = ({ charts, onClose, onChartSelect }: SidebarChartsPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishComplete, setPublishComplete] = useState(false);
  const [publishTimeout, setPublishTimeout] = useState<NodeJS.Timeout | null>(null);
  const { generateFinalPlan, isGeneratingFinalPlan } = useFinalPlan();

  const Spinner = () => (
    <div className="inline-block w-4 h-4 mr-2 align-middle">
      <div className="w-full h-full rounded-full border-2 border-b-transparent border-black animate-spin" />
    </div>
  );

  const handlePublish = async () => {
    setPublishComplete(false);
    setIsPublishing(true);
    
    try {
      await generateFinalPlan();
      setPublishComplete(true);
      
      // Reset success state after 3 seconds
      if (publishTimeout) clearTimeout(publishTimeout);
      setPublishTimeout(setTimeout(() => setPublishComplete(false), 3000));
    } catch (err) {
      console.error('Publish error:', err);
      // Error is already logged to console
    } finally {
      setIsPublishing(false);
    }
  };

  const uniqueCharts = useMemo(() => {
    const uniqueMap = new Map<string, Chart>();
    charts.forEach(chart => {
      if (!uniqueMap.has(chart.id)) {
        uniqueMap.set(chart.id, chart);
      }
    });
    return Array.from(uniqueMap.values());
  }, [charts]);

  const filteredCharts = useMemo(() => {
    return uniqueCharts.filter((chart) =>
      chart.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uniqueCharts, searchQuery]);

  const recentCharts = useMemo(() => {
    return [...uniqueCharts]
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [uniqueCharts]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Schedules</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePublish}
            disabled={isPublishing || isGeneratingFinalPlan}
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 hover:bg-gray-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            title="Publish current plan"
          >
            {isPublishing || isGeneratingFinalPlan ? (
              <>
                <Spinner />
                <span>Publishing...</span>
              </>
            ) : publishComplete ? (
              <span>Published! ✓</span>
            ) : (
              <>
                <Upload size={14} className="mr-1.5" />
                <span>Publish</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close panel"
          >
            <ChevronLeftIcon size={20} />
          </button>
        </div>
      </div>
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Search schedules..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <SearchIcon size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {searchQuery !== '' ? (
          <>
            <div className="flex items-center text-xs font-medium text-gray-500 mb-2 px-2">
              <SearchIcon size={14} className="mr-1.5" />
              <span>Search Results</span>
            </div>
            {filteredCharts.length > 0 ? (
              <ul>
                {filteredCharts.map((chart) => (
                  <li
                    key={chart.id}
                    className="p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors text-sm"
                    onClick={(event) => onChartSelect(chart.id, event)}
                  >
                    <div className="font-medium truncate flex items-center gap-2">
                      <BarChart2 size={16} className="text-gray-400" />
                      <span className="truncate">{chart.name}</span>
                    </div>
                    {chart.updatedAt && (
                      <div className="text-xs text-gray-500 truncate">
                        {new Date(chart.updatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-4 px-2 text-center text-sm text-gray-500">
                No schedules found matching "{searchQuery}"
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center text-xs font-medium text-gray-500 mb-2 px-2">
              <ClockIcon size={14} className="mr-1.5" />
              <span>Recent</span>
            </div>
            <ul>
              {recentCharts.map((chart) => (
                <li
                  key={chart.id}
                  className="p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors text-sm"
                  onClick={(event) => onChartSelect(chart.id, event)}
                >
                  <div className="font-medium truncate flex items-center gap-2">
                    <BarChart2 size={16} className="text-gray-400" />
                    {chart.name}
                  </div>
                  {chart.updatedAt && (
                    <div className="text-xs text-gray-500 truncate">
                      {new Date(chart.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex items-center text-xs font-medium text-gray-500 mt-4 mb-2 px-2">
              <BarChart2 size={14} className="mr-1.5" />
              <span>All Schedules</span>
            </div>
            <ul>
              {uniqueCharts.map((chart) => (
                <li
                  key={chart.id}
                  className="p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors text-sm"
                  onClick={(event) => onChartSelect(chart.id, event)}
                >
                  <div className="font-medium truncate flex items-center gap-2">
                    <BarChart2 size={16} className="text-gray-400" />
                    {chart.name}
                  </div>
                  {chart.updatedAt && (
                    <div className="text-xs text-gray-500 truncate">
                      {new Date(chart.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {/* Optional: Add a create new schedule button if needed
      <div className="pt-2">
        <button
          onClick={...}
          className="flex w-full items-center justify-center gap-2 bg-white hover:bg-gray-100 text-black px-3 py-2 rounded-lg transition-colors text-sm font-medium border border-gray-200"
        >
          <PlusIcon size={16} />
          <span>Create New Schedule</span>
        </button>
      </div>
      */}
    </div>
  );
};
