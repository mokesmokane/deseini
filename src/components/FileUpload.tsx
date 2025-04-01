import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

export interface FileUploadProps {
  onUpload: (files: File[]) => void;
  disabled?: boolean;
}

export default function FileUpload({ onUpload, disabled = false }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    disabled
  });

  return (
    <div
      {...getRootProps()}
      className={`mt-2 flex justify-center rounded-lg border border-dashed px-6 py-10 ${
        isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="text-center">
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4 flex text-sm leading-6 text-gray-600">
          <label className={`relative rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <span>Upload files</span>
            <input {...getInputProps()} />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs leading-5 text-gray-600">Any file up to 50MB</p>
        {disabled && (
          <p className="text-xs text-red-500 mt-2">File upload is disabled</p>
        )}
      </div>
    </div>
  );
}