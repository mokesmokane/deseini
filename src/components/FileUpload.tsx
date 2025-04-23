import { useCallback } from 'react';
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
      className={`flex justify-center items-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors duration-200 ease-in-out ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'} ${
        isDragActive ? 'border-neutral-400 bg-neutral-50' : 'border-gray-300'
      }`}
    >
      <div className="text-center">
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4 flex text-sm leading-6 text-gray-600">
          <label className={`relative rounded-md bg-white font-semibold text-neutral-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-neutral-600 focus-within:ring-offset-2 hover:text-neutral-600 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
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