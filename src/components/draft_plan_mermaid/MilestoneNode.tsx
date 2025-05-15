import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';


interface MilestoneData {
  id: string;
  label: string;
  startDate: Date;
  sectionName: string;
  isVisible: boolean;
  hasDate: boolean;
}
 
interface MilestoneNodeProps extends NodeProps<MilestoneData> {
  onLabelChange?: (id: string, newLabel: string) => void;
  selected: boolean;
  isAnyLabelEditing: boolean;
  setIsAnyLabelEditing: (editing: boolean) => void;
}

const MilestoneNode: React.FC<MilestoneNodeProps> = ({ data, dragging, onLabelChange, selected, setIsAnyLabelEditing }) => {
  // Format date for display
  const formatDate = (date: Date): string => {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(data.label);
  }, [data.label]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = () => {
    setEditing(true);
    setInputValue(data.label);
    setIsAnyLabelEditing(true);
  };

  const handleInputBlur = () => {
    setEditing(false);
    setIsAnyLabelEditing(false);
    if (inputValue.trim() && inputValue !== data.label && onLabelChange) {
      onLabelChange(data.id, inputValue.trim());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setIsAnyLabelEditing(false);
      setInputValue(data.label);
    }
  };

  const dateStr = formatDate(data.startDate);
  // const [hovered, setHovered] = useState(false);
  
  return (
    <div
      style={{
        position: 'relative',
        width: '40px',
        height: '40px',
        transition: dragging ? 'none' : 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        background:'transparent',
        borderRadius: 10,
        boxShadow: 'none',
        zIndex: selected ? 12 : undefined,
      }}
      // onMouseEnter={() => !dragging && setHovered(true)}
      // onMouseLeave={() => setHovered(false)}
    >
      {/* {hovered && !dragging && (
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '26px',
            whiteSpace: 'nowrap',
            zIndex: 20
          }}
        >
          {data.label}
        </div>
      )} */}
      
      {/* Diamond shape */}
      <div
        style={{
          position: 'absolute',
          top: '-35px',
          left: '-25px',
          width: '45px',
          height: '45px',
          backgroundColor: selected ? 'rgba(0,0,0,0.06)' : '#ffffff',
          border: selected ? '2.5px solid #222' : '2px solid #000000',
          transform: 'rotate(45deg)',
          borderRadius: '8px',
          zIndex: 10,
          boxShadow: 'none',
        }}
        title={!dragging ? `${data.label}\nDate: ${dateStr}` : undefined}
      />
      {/* Label centered with diamond */}
      <div
        style={{
          position: 'absolute',
          top: '-13px',
          left: '40px',
          transform: 'translateY(-50%)',
          fontSize: '22px',
          color: '#000',
          fontWeight: 400,
          zIndex: 15,
          minWidth: 40,
          background: 'transparent',
          borderRadius: 4,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          whiteSpace: 'nowrap',
        }}
      >
        {editing ? (
          <>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              style={{
                fontSize: '22px',
                padding: '2px 6px',
                border: 'none',
                outline: 'none',
                background: 'white',
                color: 'black',
                fontWeight: 500,
                textAlign: 'center',
                boxShadow: 'none',
                width: 'auto',
                minWidth: 40,
                maxWidth: 'none',
              }}
              maxLength={80}
            />
            <span
              ref={el => {
                if (!el || !inputRef.current) return;
                el.style.fontSize = '22px';
                el.style.fontWeight = '500';
                el.style.visibility = 'hidden';
                el.style.position = 'absolute';
                el.style.whiteSpace = 'pre';
                el.style.pointerEvents = 'none';
                setTimeout(() => {
                  if (inputRef.current && el) {
                    inputRef.current.style.width = `${el.offsetWidth + 16}px`;
                  }
                }, 0);
              }}
              aria-hidden="true"
              style={{
                fontSize: '22px',
                fontWeight: 500,
                visibility: 'hidden',
                whiteSpace: 'pre',
                pointerEvents: 'none',
                left: 0,
                top: 0,
              }}
            >{inputValue || ' '}</span>
          </>
        ) : (
          <span
            onDoubleClick={handleDoubleClick}
            style={{
              display: 'block',
              textAlign: 'center',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >{data.label}</span>
        )}
      </div>
      {/* Date display */}
      {data.hasDate && (
        <div 
          style={{
            position: 'absolute',
            top: '15px',
            left: '-25px',
            width: '100%',
            fontSize: '16px',
            color: '#000000',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            background: 'transparent',
            borderRadius: 0,
            padding: 0,
            boxShadow: 'none',
          }}
        >
          {dateStr}
        </div>
      )}
      {/* Left handle (target) aligned to diamond tip */}
      <Handle 
        type="target"
        position={Position.Left}
        style={{ 
          background: '#555', 
          top: '-13px', // vertical center of diamond in container
          left: '-35px', // aligns with diamond's left tip
          zIndex: 20
        }} 
      />
      {/* Right handle (source) aligned to diamond tip */}
      <Handle 
        type="source"
        position={Position.Right}
        style={{ 
          background: '#555', 
          top: '-13px', // vertical center of diamond in container
          right: '10px', // aligns with diamond's right tip
          zIndex: 20
        }} 
      />
    </div>
  );
};

export default memo(MilestoneNode);
