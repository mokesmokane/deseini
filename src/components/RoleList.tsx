import React, { useState } from 'react';
import { Role } from '../types';
import RoleCard from './RoleCard';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface RoleListProps {
  roles: Role[];
  onAddRole: (role: Omit<Role, 'id'>) => void;
  onDeleteRole: (index: number) => void;
  onUpdateRole: (index: number, role: Role) => void;
  onCloneRole?: (index: number) => void;
  onDeleteDeliverable?: (deliverableId: string) => void;
  displayMode?: 'full' | 'card';
  onSelectRole?: (index: number) => void;
  selectedRoleIndex?: number;
}

interface AddRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRole: (role: Omit<Role, 'id'>) => void;
}

// Define the expected structure for the OpenAI response
interface AIRoleExtraction {
  title?: string;
  type?: string;
  country?: string;
  region?: string;
  town?: string;
  level?: string;
  professions?: string;
  startDate?: string;
  endDate?: string;
  paymentBy?: string;
  hourlyRate?: number;
  description?: string;
}

function AddRoleDialog({ isOpen, onClose, onAddRole }: AddRoleDialogProps) {
  const [formData, setFormData] = useState<Omit<Role, 'id'>>({
    title: '',
    type: '',
    country: '',
    region: '',
    town: '',
    level: '',
    professions: '',
    startDate: '',
    endDate: '',
    paymentBy: '',
    hourlyRate: 0,
    description: '',
    deliverables: []
  });
  
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hourlyRate' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRole(formData);
    onClose();
  };
  
  const handleTextPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPastedText(e.target.value);
  };
  
  // Function to process text using OpenAI
  const processWithAI = async () => {
    if (!pastedText.trim()) {
      setProcessingError('Please paste some text to process');
      return;
    }
    
    setIsProcessing(true);
    setProcessingError('');
    
    try {
      const response = await fetch('/api/extract-role-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: pastedText }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process text');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update form data with extracted information
      const extracted: AIRoleExtraction = data.extraction;
      
      setFormData(prev => ({
        ...prev,
        title: extracted.title || prev.title,
        type: extracted.type || prev.type,
        country: extracted.country || prev.country,
        region: extracted.region || prev.region,
        town: extracted.town || prev.town,
        level: extracted.level || prev.level,
        professions: extracted.professions || prev.professions,
        startDate: extracted.startDate || prev.startDate,
        endDate: extracted.endDate || prev.endDate,
        paymentBy: extracted.paymentBy || prev.paymentBy,
        hourlyRate: extracted.hourlyRate || prev.hourlyRate,
        description: extracted.description || prev.description,
      }));
      
      // Clear the pasted text after successful processing
      setPastedText('');
      
    } catch (error) {
      console.error('Error processing text:', error);
      setProcessingError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-4xl w-full">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Role</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        
        {/* AI Text Extraction Section */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Fill with AI</h4>
          <div className="flex flex-col space-y-3">
            <textarea
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={4}
              placeholder="Paste job description or role information here to automatically extract fields..."
              value={pastedText}
              onChange={handleTextPaste}
            />
            <div className="flex justify-between items-center">
              {processingError && (
                <p className="text-sm text-red-600">{processingError}</p>
              )}
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neutral-700 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50"
                onClick={processWithAI}
                disabled={isProcessing || !pastedText.trim()}
              >
                {isProcessing ? 'Processing...' : 'Extract Information'}  
              </button>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
                placeholder="Role title"
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <input
                type="text"
                name="type"
                id="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
                placeholder="Role type"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                type="text"
                name="country"
                id="country"
                value={formData.country}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
                placeholder="Country"
              />
            </div>
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                Region
              </label>
              <input
                type="text"
                name="region"
                id="region"
                value={formData.region}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
                placeholder="Region"
              />
            </div>
            <div>
              <label htmlFor="town" className="block text-sm font-medium text-gray-700">
                Town
              </label>
              <input
                type="text"
                name="town"
                id="town"
                value={formData.town}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
                placeholder="Town"
              />
            </div>
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                Level
              </label>
              <input
                type="text"
                name="level"
                id="level"
                value={formData.level}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
                placeholder="Level"
              />
            </div>
            <div>
              <label htmlFor="professions" className="block text-sm font-medium text-gray-700">
                Professions
              </label>
              <input
                type="text"
                name="professions"
                id="professions"
                value={formData.professions}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
                placeholder="Professions"
              />
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="paymentBy" className="block text-sm font-medium text-gray-700">
                Payment By
              </label>
              <select
                name="paymentBy"
                id="paymentBy"
                value={formData.paymentBy}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
              >
                <option value="">Select payment method</option>
                <option value="Timesheet Based">Timesheet Based</option>
                <option value="Deliverable Based">Deliverable Based</option>
              </select>
            </div>
            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                Hourly Rate (£)
              </label>
              <input
                type="number"
                name="hourlyRate"
                id="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
            <div className="md:col-span-2">
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
                placeholder="Role description"
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
              Add Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RoleList({ 
  roles, 
  onAddRole, 
  onDeleteRole, 
  onUpdateRole,
  onCloneRole,
  onDeleteDeliverable,
  displayMode = 'full',
  onSelectRole,
  selectedRoleIndex
}: RoleListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Simple role card for grid view
  const RoleCardSimple = ({ role, index }: { role: Role, index: number }) => {
    const isSelected = selectedRoleIndex === index;
    const deliverableCount = role.deliverables?.length || 0;
    
    return (
      <div 
        onClick={() => onSelectRole && onSelectRole(index)}
        className={`cursor-pointer p-3 rounded-lg shadow-sm border transition-all h-32 flex flex-col justify-between ${
          isSelected 
            ? 'border-neutral-600 bg-neutral-100' 
            : 'border-gray-200 bg-white hover:border-neutral-400 hover:bg-neutral-50/50'
        }`}
      >
        <div className="w-full">
          <h3 className="font-medium text-gray-900 text-md truncate mb-2">{role.title || 'Untitled Role'}</h3>
          {(role.type || role.level) && (
            <div className="flex items-center text-sm text-gray-600">
              {role.type && <span className="truncate">{role.type}</span>}
              {role.type && role.level && <span className="mx-1.5">•</span>}
              {role.level && <span className="truncate">{role.level}</span>}
            </div>
          )}
        </div>
        
        {deliverableCount > 0 && (
          <div className="self-end">
            <span className="inline-flex items-center justify-center bg-neutral-200 text-neutral-800 text-xs font-medium rounded-full h-6 w-6">
              {deliverableCount}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pt-8 border-gray-200">
      <div className="flex justify-between items-center mb-0">
        <div>
          <h6 className="text-base text-gray-500 tracking-wider font-semibold">Roles</h6>
        </div>
      </div>
      
      {displayMode === 'card' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {roles.map((role, index) => (
            <RoleCardSimple 
              key={role.id || index} 
              role={role} 
              index={index} 
            />
          ))}
          {/* Add Role card with plus icon */}
          <div
            onClick={() => setIsDialogOpen(true)}
            className="cursor-pointer p-5 rounded-lg shadow-sm border border-dashed border-gray-300 bg-white hover:border-neutral-400 hover:bg-neutral-50/50 flex items-center justify-center h-32 transition-all"
          >
            <PlusIcon className="h-8 w-8 text-gray-400 hover:text-neutral-600" aria-hidden="true" />
          </div>
        </div>
      ) : (
        <div className="space-y-8 mt-6">
          {roles.map((role, index) => (
            <RoleCard
              key={role.id || index}
              role={role}
              onDelete={() => onDeleteRole(index)}
              onUpdate={(updatedRole) => onUpdateRole(index, updatedRole)}
              onClone={onCloneRole ? () => onCloneRole(index) : undefined}
              onDeleteDeliverable={onDeleteDeliverable}
            />
          ))}
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neutral-700 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Role
          </button>
        </div>
      )}

      <AddRoleDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        onAddRole={onAddRole}
      />
    </div>
  );
}