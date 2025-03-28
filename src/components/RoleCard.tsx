import React from 'react';
import { Role } from '../types';
import DeliverableList from './DeliverableList';
import { TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import EditableField from './EditableField';

interface RoleCardProps {
  role: Role;
  onDelete: () => void;
  onUpdate: (role: Role) => void;
  onClone?: () => void;
  onDeleteDeliverable?: (deliverableId: string) => void;
}

export default function RoleCard({ role, onDelete, onUpdate, onClone, onDeleteDeliverable }: RoleCardProps) {
  const handleFieldUpdate = (field: keyof Role) => (value: string | number) => {
    onUpdate({
      ...role,
      [field]: value
    });
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            <EditableField
              value={role.title}
              onSave={handleFieldUpdate('title')}
              className="text-xl font-semibold"
            />
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={onClone}
              className="inline-flex items-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Clone role"
            >
              <DocumentDuplicateIcon className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center p-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="Delete role"
            >
              <TrashIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <EditableField
            value={role.type}
            type="select"
            options={[
              { value: 'Remote', label: 'Remote' },
              { value: 'On-site', label: 'On-site' },
              { value: 'Hybrid', label: 'Hybrid' }
            ]}
            onSave={handleFieldUpdate('type')}
          />
          <span className="mx-2">•</span>
          <EditableField
            value={role.level}
            type="select"
            options={[
              { value: 'Junior', label: 'Junior' },
              { value: 'Mid-level', label: 'Mid-level' },
              { value: 'Senior', label: 'Senior' },
              { value: 'Lead', label: 'Lead' }
            ]}
            onSave={handleFieldUpdate('level')}
          />
          <span className="mx-2">•</span>
          <EditableField
            value={role.professions}
            onSave={handleFieldUpdate('professions')}
          />
        </div>
      </div>

      <div className="px-6 py-5 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Location</h4>
          <div className="mt-1 space-y-1">
            <EditableField
              value={role.country}
              onSave={handleFieldUpdate('country')}
            />
            <EditableField
              value={role.region}
              onSave={handleFieldUpdate('region')}
            />
            <EditableField
              value={role.town}
              onSave={handleFieldUpdate('town')}
            />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Duration</h4>
          <div className="mt-1 space-y-1">
            <EditableField
              value={role.startDate}
              type="date"
              onSave={handleFieldUpdate('startDate')}
            />
            <EditableField
              value={role.endDate}
              type="date"
              onSave={handleFieldUpdate('endDate')}
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500">Payment</h4>
          <div className="mt-1 space-y-1">
            <EditableField
              value={role.paymentBy}
              type="select"
              options={[
                { value: 'Deliverable based', label: 'Deliverable based' },
                { value: 'Timesheet based', label: 'Timesheet based' }
              ]}
              onSave={handleFieldUpdate('paymentBy')}
            />
            <EditableField
              value={role.hourlyRate}
              type="number"
              onSave={handleFieldUpdate('hourlyRate')}
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <h4 className="text-sm font-medium text-gray-500">Description</h4>
          <div className="mt-1">
            <EditableField
              value={role.description}
              type="textarea"
              onSave={handleFieldUpdate('description')}
            />
          </div>
        </div>
      </div>

      {role.deliverables && (
        <div className="border-t border-gray-200">
          <DeliverableList 
            deliverables={role.deliverables} 
            onAddDeliverable={(deliverable) => {
              onUpdate({
                ...role,
                deliverables: [...(role.deliverables || []), deliverable]
              });
            }}
            onUpdateDeliverable={(index, deliverable) => {
              const newDeliverables = [...(role.deliverables || [])];
              newDeliverables[index] = deliverable;
              onUpdate({
                ...role,
                deliverables: newDeliverables
              });
            }}
            onDeleteDeliverable={deliverableId => {
              // Always call the parent handler first to trigger database deletion
              if (onDeleteDeliverable) {
                onDeleteDeliverable(deliverableId);
              }
              
              // Then update local state as a fallback or for UI responsiveness
              const newDeliverables = (role.deliverables || []).filter(
                deliverable => deliverable.id !== deliverableId
              );
              onUpdate({
                ...role,
                deliverables: newDeliverables
              });
            }}
          />
        </div>
      )}
    </div>
  );
}