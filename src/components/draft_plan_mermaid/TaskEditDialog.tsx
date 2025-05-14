import React, { useState, useEffect } from 'react';

interface TaskEditDialogProps {
  isOpen: boolean;
  task: any | null;
  onSave: (updatedTask: any) => void;
  onClose: () => void;
}

const TaskEditDialog: React.FC<TaskEditDialogProps> = ({ isOpen, task, onSave, onClose }) => {
  const [form, setForm] = useState<any>(task || {});

  useEffect(() => {
    setForm(task || {});
  }, [task]);

  if (!isOpen || !task) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
      <div className="bg-white text-black rounded-lg shadow-lg w-full max-w-md p-8 relative">
        <h2 className="text-2xl font-semibold mb-6">Edit Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="label"
              value={form.label || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-black bg-white text-black"
              required
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                name="start"
                value={form.start || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-black bg-white text-black"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                name="end"
                value={form.end || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-black bg-white text-black"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dependencies (comma-separated IDs)</label>
            <input
              type="text"
              name="dependencies"
              value={form.dependencies || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-black bg-white text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              name="type"
              value={form.type || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-black bg-white text-black"
            >
              <option value="task">Task</option>
              <option value="milestone">Milestone</option>
              <option value="event">Event</option>
              <option value="report">Report</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-black text-black bg-white hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-900 transition"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskEditDialog;
