import { Project, Role, Attachment } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import RoleList, { RoleListProps } from './RoleList'; 
import EditableField, { EditableFieldProps } from './EditableField';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import FileUpload, { FileUploadProps } from './FileUpload';
import AttachmentList, { AttachmentListProps } from './AttachmentList';
import { supabase } from '../lib/supabase';
import { useProject } from '../contexts/ProjectContext';
import { useState } from 'react';
import RoleCard from './RoleCard';

export default function ProjectForm() {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number | null>(null);

  const { 
    setProject,
    saveProject,
    cloneProject, 
    deleteRole,
    deleteDeliverable,
    project
  } = useProject();

  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
  };

  const handleSaveProject = async () => {
    const savedProjectId = await saveProject();
    
    if (projectId === 'new' && savedProjectId) {
      navigate(`/projects/${savedProjectId}`, { replace: true });
    }
  };
  const handleProjectNameChange = (value: string | number) => {
    if (!project) return;
    handleProjectUpdate({
      ...project,
      projectName: value.toString()
    } );
  };

  const handleDescriptionChange = (value: string | number) => {
    if (!project) return;
    handleProjectUpdate({
      ...project,
      description: value.toString()
    });
  };

  const handleAddRole = (newRole: Omit<Role, 'id'>) => {
    if (!project) return;
    handleProjectUpdate({
      ...project,
      roles: [
        ...project.roles,
        {
            ...newRole,
            id: `temp-${Date.now()}-${Math.random()}` 
        }
      ]
    });
  };

  const handleUpdateRole = (index: number, updatedRole: Role) => {
    if (!project) return;
    const newRoles = [...project.roles];
    newRoles[index] = updatedRole;
    handleProjectUpdate({
      ...project,
      roles: newRoles
    });
  };

  const handleCloneRole = (index: number) => {
    if (!project) return;
    const roleToClone = project.roles[index];
    const clonedRole = {
      ...roleToClone,
      id: `temp-clone-${Date.now()}-${Math.random()}`,
      title: `${roleToClone.title} (Copy)`,
      deliverables: roleToClone.deliverables ? roleToClone.deliverables.map(deliverable => ({
        ...deliverable,
        id: undefined
      })) : []
    };
    handleProjectUpdate({
      ...project,
      roles: [...project.roles, clonedRole]
    });
  };

  const handleFileUpload: FileUploadProps['onUpload'] = async (files: File[]) => {
    if (!project || !projectId || projectId === 'new') {
        console.warn('Project must be saved before adding attachments');
        return;
      }
    try {
      const newAttachments: Attachment[] = [];

      for (const file of files) {
        const fileName = `${projectId}/${Date.now()}-${file.name}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from('project-attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: attachmentData, error: attachmentError } = await supabase
          .from('attachments')
          .insert({
            project_id: projectId,
            name: file.name,
            file_path: filePath,
            size: file.size,
            type: file.type
          })
          .select()
          .single();

        if (attachmentError) throw attachmentError;

        if (attachmentData) {
          const newAttachment: Attachment = {
            id: attachmentData.id,
            name: attachmentData.name,
            size: attachmentData.size,
            type: attachmentData.type,
            url: attachmentData.file_path 
          };

          newAttachments.push(newAttachment);
        }
      }

      handleProjectUpdate({
        ...project,
        attachments: [...project.attachments, ...newAttachments]
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDeleteAttachment: AttachmentListProps['onDelete'] = async (attachmentId: string) => {
    if (!project) return;
    try {
      const attachment = project.attachments.find(a => a.id === attachmentId);
      if (!attachment?.url) return;

      const { error: deleteStorageError } = await supabase.storage
        .from('project-attachments')
        .remove([attachment.url]); 

      if (deleteStorageError && deleteStorageError.message !== 'The resource was not found') {
         throw deleteStorageError;
       }

      const { error: deleteDbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

      if (deleteDbError) throw deleteDbError;

      handleProjectUpdate({
        ...project,
        attachments: project.attachments.filter(a => a.id !== attachmentId)
      });
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };
  
  const handleDownloadAttachment: AttachmentListProps['onDownload'] = async (attachment: Attachment) => {
    try {
      if (!attachment.url) return;

      const { data, error } = await supabase.storage
        .from('project-attachments')
        .download(attachment.url); 

      if (error) throw error;

      const blob = new Blob([data!]); 
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.name; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  const handleCloneProject = () => {
    if (project && project.id && projectId !== 'new') { 
      // cloneProject(project.id); 
    }
  }
  
  const handleDeleteRoleByIndex = (index: number) => {
    if (!project) return;
    const roleToDelete = project.roles[index];
    if (roleToDelete.id && !roleToDelete.id.startsWith('temp')) {
      deleteRole(roleToDelete.id);
    } else {
      const newRoles = [...project.roles];
      newRoles.splice(index, 1);
      handleProjectUpdate({ ...project, roles: newRoles });
    }
    
    // If the deleted role was selected, clear the selection
    if (selectedRoleIndex === index) {
      setSelectedRoleIndex(null);
    } else if (selectedRoleIndex !== null && selectedRoleIndex > index) {
      // If a role above the selected one was deleted, adjust the selection index
      setSelectedRoleIndex(selectedRoleIndex - 1);
    }
  };

  const handleSelectRole = (role: Role, index: number) => {
    setSelectedRoleIndex(index === selectedRoleIndex ? null : index);
  };

  if (!project) {
    return <div className="p-8 text-center text-red-500">Project not found</div>;
  }

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-full flex flex-col">
      {/* Project Header & Actions */}
      <div className="mb-6 pb-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
        <h1 className="text-2xl font-semibold text-gray-800 truncate pr-4">Project Details</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleSaveProject}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out text-sm font-medium"
          >
            Save Project
          </button>
          {projectId !== 'new' && (
            <button
              onClick={handleCloneProject} 
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
              title="Clone Project"
              disabled={!project.id} 
            >
              <DocumentDuplicateIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Top Section: Project Details & Attachments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Project Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 md:col-span-2">
          <EditableField
            fieldName="Project Name" 
            value={project.projectName}
            onSave={handleProjectNameChange}
            displayClasses="text-xl font-medium text-gray-700"
            inputClasses="text-xl font-medium"
          />
          <EditableField
            fieldName="Description" 
            value={project.description || ''}
            onSave={handleDescriptionChange}
            type="textarea"
            displayClasses="text-sm text-gray-600 mt-3"
            inputClasses="text-sm text-gray-600"
            textareaRows={3} 
          />
          <RoleList
          roles={project.roles}
          onAddRole={handleAddRole}
          onUpdateRole={handleUpdateRole}
          onCloneRole={handleCloneRole}
          onDeleteRole={handleDeleteRoleByIndex}
          onDeleteDeliverable={deleteDeliverable}
          displayMode="card"
          onSelectRole={handleSelectRole}
          selectedRoleIndex={selectedRoleIndex !== null ? selectedRoleIndex : undefined}
        />
        </div>

        {/* Attachments Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Attachments</h2>
          <FileUpload onUpload={handleFileUpload} disabled={!projectId || projectId === 'new'} /> 
          {(!projectId || projectId === 'new') && (
            <p className="text-xs text-gray-500 mt-1">Save the project first to add attachments.</p>
          )}
          <AttachmentList 
            attachments={project.attachments} 
            onDelete={handleDeleteAttachment} 
            onDownload={handleDownloadAttachment} 
          />
        </div>
      </div>

      {/* Roles Grid Section */}
      {/* <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Roles</h2>
        <p className="text-sm text-gray-600 mb-4">Click on a role to view or edit its details.</p>
        
        
      </div> */}

      {/* Selected Role Detail View */}
      {selectedRoleIndex !== null && project.roles[selectedRoleIndex] && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Role Details</h2>
          <RoleCard
            role={project.roles[selectedRoleIndex]}
            onDelete={() => handleDeleteRoleByIndex(selectedRoleIndex)}
            onUpdate={(updatedRole) => handleUpdateRole(selectedRoleIndex, updatedRole)}
            onClone={handleCloneRole ? () => handleCloneRole(selectedRoleIndex) : undefined}
            onDeleteDeliverable={deleteDeliverable}
          />
        </div>
      )}
    </div>
  );
}