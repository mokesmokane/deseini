import { SearchIcon, PlusIcon, ClockIcon, BarChart2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';

interface Chart {
  id: string;
  name: string;
  updatedAt?: string;
}

interface SidebarChartsPanelProps {
  charts: Chart[];
  onClose: () => void;
  onChartSelect: (chartId: string) => void;
}

export const SidebarChartsPanel = ({ charts, onClose, onChartSelect }: SidebarChartsPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');

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
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-lg pl-1">Published Schedules</div>
        <button
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          onClick={onClose}
          title="Close"
          aria-label="Close charts panel"
          type="button"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-gray-500"><path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
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
                    onClick={() => onChartSelect(chart.id)}
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
                  onClick={() => onChartSelect(chart.id)}
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
                  onClick={() => onChartSelect(chart.id)}
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
