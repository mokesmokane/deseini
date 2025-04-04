import React, { useState } from 'react';
import { Deliverable } from '../types';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import EditableField from './EditableField';

interface DeliverableListProps {
  deliverables: Deliverable[];
  onAddDeliverable: (deliverable: Deliverable) => void;
  onUpdateDeliverable: (index: number, deliverable: Deliverable) => void;
  onDeleteDeliverable: (deliverableId: string) => void;
}

interface AddDeliverableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDeliverable: (deliverable: Deliverable) => void;
}

function AddDeliverableDialog({ isOpen, onClose, onAddDeliverable }: AddDeliverableDialogProps) {
  const [formData, setFormData] = useState<Deliverable>({
    deliverableName: '',
    deadline: new Date().toISOString().split('T')[0],
    fee: null,
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'fee' ? (value === '' ? null : Number(value)) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDeliverable(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-lg w-full">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Deliverable</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="deliverableName" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="deliverableName"
                id="deliverableName"
                value={formData.deliverableName}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
                placeholder="Deliverable name"
              />
            </div>
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                Deadline
              </label>
              <input
                type="date"
                name="deadline"
                id="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="fee" className="block text-sm font-medium text-gray-700">
                Fee (£)
              </label>
              <input
                type="number"
                name="fee"
                id="fee"
                value={formData.fee ?? ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
                placeholder="Deliverable description"
              />
            </div>
          </div>
          <div className="mt-5 sm:mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-neutral-700 text-base font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 sm:text-sm"
            >
              Add Deliverable
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DeliverableList({ 
  deliverables,
  onAddDeliverable,
  onUpdateDeliverable,
  onDeleteDeliverable
}: DeliverableListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleFieldUpdate = (index: number, field: keyof Deliverable) => (value: string | number) => {
    const updatedDeliverable = {
      ...deliverables[index],
      [field]: field === 'fee' ? (value === '' ? null : Number(value)) : value
    };
    onUpdateDeliverable(index, updatedDeliverable);
  };

  return (
    <div className="px-6 py-5">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium text-gray-900">Deliverables</h4>
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neutral-700 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
        >
          <PlusIcon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
          Add Deliverable
        </button>
      </div>

      <div className="space-y-6">
        {deliverables.map((deliverable, index) => (
          <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-900 flex-grow">
                <EditableField
                  value={deliverable.deliverableName}
                  onSave={handleFieldUpdate(index, 'deliverableName')}
                  className="text-sm font-medium"
                />
              </h5>
              <button
                onClick={() => onDeleteDeliverable(deliverable.id!)}
                className="ml-2 inline-flex items-center p-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 block">Due:</span>
                <EditableField
                  value={deliverable.deadline}
                  type="date"
                  onSave={handleFieldUpdate(index, 'deadline')}
                />
              </div>
              <div>
                <span className="text-sm text-gray-500 block">Fee (£):</span>
                <EditableField
                  value={deliverable.fee ?? ''}
                  type="number"
                  onSave={handleFieldUpdate(index, 'fee')}
                />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-sm text-gray-500 block">Description:</span>
              <EditableField
                value={deliverable.description || ''}
                type="textarea"
                onSave={(value) => handleFieldUpdate(index, 'description')(value as string)}
                className="text-sm text-gray-500"
              />
            </div>
          </div>
        ))}
      </div>
      
      <AddDeliverableDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        onAddDeliverable={onAddDeliverable}
      />
    </div>
  );
}