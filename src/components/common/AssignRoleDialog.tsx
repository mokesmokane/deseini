import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Task } from '@/types';

// Export the Role interface
export interface Role {
  id: string;
  name: string;
  avatar: string;
  type: 'creative' | 'ai_agent';
  isFavorite?: boolean;
}

interface AssignRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (roleId: string) => void;
  task: Task | null;
  roles: Role[];
}

// Define the possible filter types
type FilterType = 'all' | 'creative' | 'ai_agent';

export const AssignRoleDialog: React.FC<AssignRoleDialogProps> = ({
  isOpen,
  onClose,
  onAssign,
  task,
  roles,
}) => {
  // State only for filter type
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Split roles based directly on props, favorite status, and filterType
  // Filter favorites based on the selected type as well
  const favoriteRoles = roles.filter(role => 
    role.isFavorite && 
    (filterType === 'all' || role.type === filterType)
  );
  const nonFavoriteRoles = roles.filter(role => !role.isFavorite);

  const aiAgentRoles = (filterType === 'all' || filterType === 'ai_agent') 
    ? nonFavoriteRoles.filter(role => role.type === 'ai_agent') 
    : [];

  const creativeRoles = (filterType === 'all' || filterType === 'creative') 
    ? nonFavoriteRoles.filter(role => role.type === 'creative') 
    : [];

  const handleAssign = (roleId: string) => {
    onAssign(roleId);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Background overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Dialog panel transition */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Updated Dialog Title */}
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Assign role to {task?.name || 'Task'}
                </Dialog.Title>

                {/* Filter Buttons */}
                <div className="my-4 flex space-x-2">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 rounded-md text-sm font-medium 
                      ${filterType === 'all' 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType('creative')}
                    className={`px-3 py-1 rounded-md text-sm font-medium 
                      ${filterType === 'creative' 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    Creatives
                  </button>
                  <button
                    onClick={() => setFilterType('ai_agent')}
                    className={`px-3 py-1 rounded-md text-sm font-medium 
                      ${filterType === 'ai_agent' 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    AI Agents
                  </button>
                </div>

                {/* Description and Search Bar Removed */} 

                {/* Role list container with scrolling - Increase max height */}
                <div className="max-h-96 overflow-y-auto pr-2 -mr-2 mt-4">
                  {/* Favorites section */}
                  {favoriteRoles.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Favorites
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {favoriteRoles.map(role => (
                          <button
                            key={role.id}
                            className="flex items-center p-2 rounded-md hover:bg-gray-100 transition-colors"
                            onClick={() => handleAssign(role.id)}
                          >
                            <div className="w-10 h-10 rounded-full mr-2 overflow-hidden flex-shrink-0">
                              <img 
                                src={role.avatar} 
                                alt={role.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-sm font-medium truncate">{role.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Agents section */}
                  {aiAgentRoles.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        AI Agents
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {aiAgentRoles.map(role => (
                          <button
                            key={role.id}
                            className="flex items-center p-2 rounded-md hover:bg-gray-100 transition-colors"
                            onClick={() => handleAssign(role.id)}
                          >
                            <div className="w-10 h-10 rounded-full mr-2 overflow-hidden flex-shrink-0">
                              <img 
                                src={role.avatar} 
                                alt={role.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-sm font-medium truncate">{role.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Creatives section */}
                  {creativeRoles.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Creatives 
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {creativeRoles.map(role => (
                          <button
                            key={role.id}
                            className="flex items-center p-2 rounded-md hover:bg-gray-100 transition-colors"
                            onClick={() => handleAssign(role.id)}
                          >
                            <div className="w-10 h-10 rounded-full mr-2 overflow-hidden flex-shrink-0">
                              <img 
                                src={role.avatar} 
                                alt={role.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-sm font-medium truncate">{role.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Updated No results state */}
                  {favoriteRoles.length === 0 && aiAgentRoles.length === 0 && creativeRoles.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      {`No ${filterType !== 'all' ? filterType.replace('_', ' ') + 's' : 'roles'} available`}
                    </div>
                  )}
                </div>

                {/* Cancel Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
