import { Role } from '../types';
import { useForm } from 'react-hook-form';

interface RoleFormProps {
  role?: Role;
  onSave: (role: Role) => void;
  onCancel: () => void;
}

const defaultRole: Role = {
  title: '',
  type: 'Remote',
  country: '',
  region: '',
  town: '',
  level: 'Mid-level',
  professions: '',
  startDate: '',
  endDate: '',
  paymentBy: 'Deliverable based',
  hourlyRate: 0,
  description: '',
  deliverables: []
};

export default function RoleForm({ role = defaultRole, onSave, onCancel }: RoleFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<Role>({
    defaultValues: role
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="bg-white shadow rounded-lg p-6">
      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            {...register('title', { required: 'Title is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              {...register('type')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
            >
              <option value="Remote">Remote</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700">
              Level
            </label>
            <select
              {...register('level')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
            >
              <option value="Junior">Junior</option>
              <option value="Mid-level">Mid-level</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              type="text"
              {...register('country', { required: 'Country is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700">
              Region
            </label>
            <input
              type="text"
              {...register('region', { required: 'Region is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="town" className="block text-sm font-medium text-gray-700">
              Town
            </label>
            <input
              type="text"
              {...register('town', { required: 'Town is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="professions" className="block text-sm font-medium text-gray-700">
            Professions
          </label>
          <input
            type="text"
            {...register('professions', { required: 'Professions is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              {...register('startDate', { required: 'Start date is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              {...register('endDate', { required: 'End date is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="paymentBy" className="block text-sm font-medium text-gray-700">
              Payment By
            </label>
            <select
              {...register('paymentBy')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
            >
              <option value="Deliverable based">Deliverable based</option>
              <option value="Timesheet based">Timesheet based</option>
            </select>
          </div>

          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
              Hourly Rate (£)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('hourlyRate', { 
                required: 'Hourly rate is required',
                min: { value: 0, message: 'Hourly rate must be positive' }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
            />
          </div>
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
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neutral-700 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
}