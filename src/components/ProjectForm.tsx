import { Project, Role, Attachment } from '../types';
import RoleList from './RoleList';
import EditableField from './EditableField';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import FileUpload from './FileUpload';
import AttachmentList from './AttachmentList';
import { supabase } from '../lib/supabase';

interface ProjectFormProps {
  project: Project;
  onUpdate: (project: Project) => void;
  onSave: () => void;
  onClone: () => void;
  projectId?: string | null;
  onDeleteRole: (roleId: string) => void;
  onDeleteDeliverable: (deliverableId: string) => void;
}

export default function ProjectForm({ project, onUpdate, onSave, onClone, projectId, onDeleteRole, onDeleteDeliverable }: ProjectFormProps) {
  const handleProjectNameChange = (value: string | number) => {
    onUpdate({
      ...project,
      projectName: value.toString()
    });
  };

  const handleDescriptionChange = (value: string | number) => {
    onUpdate({
      ...project,
      description: value.toString()
    });
  };

  const handleAddRole = (newRole: Omit<Role, 'id'>) => {
    onUpdate({
      ...project,
      roles: [
        ...project.roles,
        newRole
      ]
    });
  };

  const handleUpdateRole = (index: number, updatedRole: Role) => {
    const newRoles = [...project.roles];
    newRoles[index] = updatedRole;
    onUpdate({
      ...project,
      roles: newRoles
    });
  };

  const handleCloneRole = (index: number) => {
    const roleToClone = project.roles[index];
    const clonedRole = {
      ...roleToClone,
      id: undefined, // Remove the ID so it's treated as a new role in the database
      title: `${roleToClone.title} (Copy)`,
      deliverables: roleToClone.deliverables ? roleToClone.deliverables.map(deliverable => ({
        ...deliverable,
        id: undefined // Remove deliverable IDs as well
      })) : []
    };
    onUpdate({
      ...project,
      roles: [...project.roles, clonedRole]
    });
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      if (!projectId) {
        throw new Error('Project must be saved before adding attachments');
      }

      const newAttachments: Attachment[] = [];

      for (const file of files) {
        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create attachment record in the database
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

      // Update project with new attachments
      onUpdate({
        ...project,
        attachments: [...project.attachments, ...newAttachments]
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const attachment = project.attachments.find(a => a.id === attachmentId);
      if (!attachment?.url) return;

      // Delete from storage
      const { error: deleteStorageError } = await supabase.storage
        .from('project-attachments')
        .remove([attachment.url]);

      if (deleteStorageError) throw deleteStorageError;

      // Delete from database
      const { error: deleteDbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

      if (deleteDbError) throw deleteDbError;

      // Update project state
      onUpdate({
        ...project,
        attachments: project.attachments.filter(a => a.id !== attachmentId)
      });
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      if (!attachment.url) return;

      const { data, error } = await supabase.storage
        .from('project-attachments')
        .download(attachment.url);

      if (error) throw error;

      // Create download link
      const blob = new Blob([data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Details</h1>
          <p className="mt-2 text-sm text-gray-600">
            Click on any field to edit it directly.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onClone}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DocumentDuplicateIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Clone Project
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Project
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Project Name
            </label>
            <div className="mt-1">
              <EditableField
                value={project.projectName}
                onSave={handleProjectNameChange}
                className="text-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <div className="mt-1">
              <EditableField
                value={project.description}
                type="textarea"
                onSave={handleDescriptionChange}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Attachments</h3>
            {projectId ? (
              <>
                <FileUpload onUpload={handleFileUpload} />
                <div className="mt-4">
                  <AttachmentList
                    attachments={project.attachments}
                    onDelete={handleDeleteAttachment}
                    onDownload={handleDownloadAttachment}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Save the project first to add attachments.</p>
            )}
          </div>
        </div>
      </div>

      <RoleList 
        roles={project.roles}
        onAddRole={handleAddRole}
        onDeleteRole={(index) => {
          const role = project.roles[index];
          if (role.id) {
            onDeleteRole(role.id);
          } else {
            // For roles that haven't been saved to the database yet
            const newRoles = [...project.roles];
            newRoles.splice(index, 1);
            onUpdate({
              ...project,
              roles: newRoles
            });
          }
        }}
        onUpdateRole={handleUpdateRole}
        onCloneRole={handleCloneRole}
        onDeleteDeliverable={onDeleteDeliverable}
      />
    </div>
  );
}