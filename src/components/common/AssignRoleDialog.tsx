import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Task } from '../../types';

interface Role {
  id: string;
  name: string;
  avatar: string;
  isFavorite?: boolean;
}

interface AssignRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (roleId: string) => void;
  task: Task | null;
  roles: Role[];
}

export const AssignRoleDialog: React.FC<AssignRoleDialogProps> = ({
  isOpen,
  onClose,
  onAssign,
  task,
  roles,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  
  // Split roles into favorites and others
  const favoriteRoles = filteredRoles.filter(role => role.isFavorite);
  const otherRoles = filteredRoles.filter(role => !role.isFavorite);

  // Filter roles based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredRoles(roles);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredRoles(
        roles.filter(role => 
          role.name.toLowerCase().includes(lowerQuery)
        )
      );
    }
  }, [searchQuery, roles]);

  const handleAssign = (roleId: string) => {
    onAssign(roleId);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Assign Role to Task
                </Dialog.Title>
                {task && (
                  <div className="mt-2 mb-4">
                    <p className="text-sm text-gray-500">
                      Select a role to assign to <span className="font-medium">{task.name}</span>
                    </p>
                  </div>
                )}

                {/* Search input */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search roles..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Role list container with scrolling */}
                <div className="max-h-60 overflow-y-auto pr-2 -mr-2">
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

                  {/* Other roles section */}
                  {otherRoles.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        All Roles
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {otherRoles.map(role => (
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

                  {/* No results state */}
                  {filteredRoles.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      No roles found matching "{searchQuery}"
                    </div>
                  )}
                </div>

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
