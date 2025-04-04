import React, { useState, useEffect, useRef } from 'react';

export interface EditableFieldProps {
  value: string | number;
  fieldName?: string; 
  type?: 'text' | 'number' | 'textarea' | 'select' | 'date';
  options?: { value: string; label: string }[];
  onSave: (value: string | number) => void;
  className?: string;
  displayClasses?: string; 
  inputClasses?: string; 
  textareaRows?: number; 
}

export default function EditableField({
  value,
  fieldName,
  type = 'text',
  options,
  onSave,
  className = '',
  displayClasses = 'cursor-pointer hover:bg-gray-50 p-1 rounded',
  inputClasses = 'w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm',
  textareaRows = 3
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (currentValue !== value) {
      onSave(currentValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };

  const textareaClasses = 'w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm';

  if (isEditing) {
    if (type === 'textarea') {
      return (
        <div className={className}>
          {fieldName && <div className="mb-1 text-sm font-medium text-gray-700">{fieldName}</div>}
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={textareaClasses}
            rows={textareaRows}
          />
        </div>
      );
    } else if (type === 'select' && options) {
      return (
        <div className={className}>
          {fieldName && <div className="mb-1 text-sm font-medium text-gray-700">{fieldName}</div>}
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={currentValue as string}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur}
            className={inputClasses}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    } else if (type === 'date') {
      return (
        <div className={className}>
          {fieldName && <div className="mb-1 text-sm font-medium text-gray-700">{fieldName}</div>}
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={currentValue as string}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={inputClasses}
          />
        </div>
      );
    } else {
      return (
        <div className={className}>
          {fieldName && <div className="mb-1 text-sm font-medium text-gray-700">{fieldName}</div>}
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            value={currentValue}
            onChange={(e) => setCurrentValue(type === 'number' ? Number(e.target.value) : e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={inputClasses}
          />
        </div>
      );
    }
  }

  return (
    <div 
      onClick={() => setIsEditing(true)} 
      className={`${displayClasses} ${className}`}
    >
      {fieldName && <div className="text-sm font-medium text-gray-500">{fieldName}</div>}
      <div>
        {type === 'date'
          ? formatDate(value as string)
          : type === 'select' && options
          ? options.find((option) => option.value === value)?.label || value
          : value || <span className="italic text-gray-400">Click to edit</span>}
      </div>
    </div>
  );
}