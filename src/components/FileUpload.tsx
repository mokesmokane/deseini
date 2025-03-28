import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className={`mt-2 flex justify-center rounded-lg border border-dashed px-6 py-10 ${
        isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
      }`}
    >
      <div className="text-center">
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4 flex text-sm leading-6 text-gray-600">
          <label className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500">
            <span>Upload files</span>
            <input {...getInputProps()} />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs leading-5 text-gray-600">Any file up to 50MB</p>
      </div>
    </div>
  );
}