import React from 'react';
import { DocumentIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatFileSize } from '../utils/format';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface AttachmentListProps {
  attachments: Attachment[];
  onDelete: (id: string) => void;
  onDownload: (attachment: Attachment) => void;
}

export default function AttachmentList({ attachments, onDelete, onDownload }: AttachmentListProps) {
  return (
    <ul className="divide-y divide-gray-200">
      {attachments.map((attachment) => (
        <li key={attachment.id} className="flex items-center justify-between py-3">
          <div className="flex items-center min-w-0 flex-1">
            <DocumentIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
            <div className="ml-4 min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{attachment.name}</p>
              <p className="truncate text-sm text-gray-500">{formatFileSize(attachment.size)}</p>
            </div>
          </div>
          <div className="ml-4 flex flex-shrink-0 space-x-2">
            <button
              type="button"
              onClick={() => onDownload(attachment)}
              className="rounded bg-white text-sm font-semibold text-blue-600 hover:text-blue-500"
            >
              Download
            </button>
            <button
              type="button"
              onClick={() => onDelete(attachment.id)}
              className="rounded text-sm font-semibold text-red-600 hover:text-red-500"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}