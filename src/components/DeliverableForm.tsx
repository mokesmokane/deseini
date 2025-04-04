import React from 'react';
import { Deliverable } from '../types';
import { useForm } from 'react-hook-form';

interface DeliverableFormProps {
  deliverable?: Deliverable;
  onSave: (deliverable: Deliverable) => void;
  onCancel: () => void;
}

const defaultDeliverable: Deliverable = {
  deliverableName: '',
  deadline: '',
  fee: null,
  description: ''
};

export default function DeliverableForm({ deliverable = defaultDeliverable, onSave, onCancel }: DeliverableFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<Deliverable>({
    defaultValues: deliverable
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4 bg-gray-50 p-4 rounded-md">
      <div>
        <label htmlFor="deliverableName" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          {...register('deliverableName', { required: 'Name is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
        />
        {errors.deliverableName && (
          <p className="mt-1 text-sm text-red-600">{errors.deliverableName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
          Deadline
        </label>
        <input
          type="date"
          {...register('deadline', { required: 'Deadline is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="fee" className="block text-sm font-medium text-gray-700">
          Fee (£)
        </label>
        <input
          type="number"
          step="0.01"
          {...register('fee', {
            setValueAs: v => v === '' ? null : parseFloat(v),
            min: { value: 0, message: 'Fee must be positive' }
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neutral-700 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
        >
          Save
        </button>
      </div>
    </form>
  );
}