import React, { useState, useEffect, useRef } from 'react';

interface EditableFieldProps {
  value: string | number;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'date';
  options?: { value: string; label: string }[];
  onSave: (value: string | number) => void;
  className?: string;
  textClassName?: string;
  inputClassName?: string;
}

export default function EditableField({
  value,
  type = 'text',
  options,
  onSave,
  className = '',
  textClassName = 'cursor-pointer hover:bg-gray-50 p-1 rounded',
  inputClassName = 'w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

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
      // Parse the date string and adjust for timezone
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      // Parse the date string and adjust for timezone
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch (e) {
      // If the date is in a different format (e.g., "1-Jul-21"), try to parse it
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
      return dateStr;
    }
  };

  if (!isEditing) {
    return (
      <div
        className={`${className} ${textClassName}`}
        onClick={() => setIsEditing(true)}
      >
        {type === 'date' ? formatDate(value.toString()) : value}
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputClassName}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (type === 'textarea') {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputClassName}
        rows={3}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={type}
      value={type === 'date' ? formatDateForInput(currentValue.toString()) : currentValue}
      onChange={(e) => setCurrentValue(type === 'number' ? Number(e.target.value) : e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={inputClassName}
    />
  );
}