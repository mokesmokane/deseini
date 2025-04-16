import React from 'react';

// Types from DraftPlanContextMermaid
type ActionType = 
  | 'ADD_SECTION'
  | 'ADD_TASK'
  | 'ADD_MILESTONE'
  | 'UPDATE_TASK'
  | 'UPDATE_MILESTONE'
  | 'UPDATE_TIMELINE'
  | 'RESOLVE_DEPENDENCY'
  | 'PROCESS_DEPENDENCIES';

interface BufferedAction {
  type: ActionType;
  payload: any;
  timestamp: number;
}

interface ActionPreviewProps {
  nextAction: BufferedAction | null;
  actionBufferLength: number;
  processingBufferProgress: number;
  startProcessingBuffer: () => void;
  processAllBuffer: () => void;
  actionBuffer?: BufferedAction[]; 
}

export const ActionPreview: React.FC<ActionPreviewProps> = ({
  nextAction,
  actionBufferLength,
  processingBufferProgress,
  startProcessingBuffer,
  processAllBuffer,
  actionBuffer = [] 
}) => {
  if (!nextAction) return null;
  
  // Format the action type with appropriate styling
  const getActionTypeStyle = (type: string) => {
    switch (type) {
      case 'ADD_SECTION':
        return { backgroundColor: '#e6f7ff', color: '#0958d9' };
      case 'ADD_TASK':
      case 'UPDATE_TASK':
        return { backgroundColor: '#f6ffed', color: '#389e0d' };
      case 'ADD_MILESTONE':
      case 'UPDATE_MILESTONE':
        return { backgroundColor: '#fff7e6', color: '#d48806' };
      case 'UPDATE_TIMELINE':
        return { backgroundColor: '#f0f0ff', color: '#1d39c4' };
      case 'RESOLVE_DEPENDENCY':
        return { backgroundColor: '#fff1f0', color: '#cf1322' };
      case 'PROCESS_DEPENDENCIES':
        return { backgroundColor: '#f9f0ff', color: '#722ed1' };
      default:
        return { backgroundColor: '#f5f5f5', color: '#000000' };
    }
  };
  
  // Function to copy all actions to clipboard
  const copyActionsToClipboard = () => {
    // Combine nextAction with actionBuffer for complete copying
    const allActions = [nextAction, ...actionBuffer];
    const actionsText = JSON.stringify(allActions, null, 2);
    
    navigator.clipboard.writeText(actionsText)
      .then(() => {
        // Could add toast notification here in the future
        console.log('Actions copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy actions: ', err);
      });
  };
  
  const actionTypeStyle = getActionTypeStyle(nextAction.type);
  
  // Common button style for reuse
  const buttonBaseStyle = {
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 15px',
    fontSize: '12px',
    fontWeight: 'normal' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };
  
  return (
    <div style={{ 
      marginTop: '12px', 
      backgroundColor: '#f9f9f9', 
      border: '1px solid #eaeaea',
      borderRadius: '6px',
      padding: '12px',
      fontSize: '12px',
      textAlign: 'left'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        Next Update Preview:
      </div>
      
      <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
        <span style={{ 
          ...actionTypeStyle, 
          padding: '2px 8px', 
          borderRadius: '4px', 
          fontSize: '11px', 
          fontWeight: 'medium'
        }}>
          {nextAction.type}
        </span>
        <span style={{ 
          marginLeft: '8px', 
          fontSize: '11px', 
          color: '#888888' 
        }}>
          Added: {new Date(nextAction.timestamp).toLocaleTimeString()}
        </span>
      </div>
      
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #eaeaea',
        borderRadius: '4px',
        padding: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        maxHeight: '150px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap'
      }}>
        {JSON.stringify(nextAction.payload, null, 2)}
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        marginTop: '12px'
      }}>
        <button
          onClick={() => startProcessingBuffer()}
          style={{
            ...buttonBaseStyle,
            flex: '1'
          }}
        >
          Apply This Update
        </button>
        
        {actionBufferLength > 0 && (
          <button
            onClick={() => processAllBuffer()}
            style={{
              ...buttonBaseStyle,
              backgroundColor: '#000000',
              color: '#ffffff',
              flex: '1'
            }}
          >
            Apply All ({actionBufferLength + 1})
          </button>
        )}
        
        <button
          onClick={copyActionsToClipboard}
          style={{
            ...buttonBaseStyle,
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '1px solid #000000'
          }}
        >
          Copy All Actions
        </button>
      </div>
      
      {/* Buffer progress bar */}
      <div style={{ 
        marginTop: '4px', 
        height: '4px', 
        width: '100%', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '2px', 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          height: '100%', 
          width: `${processingBufferProgress}%`, 
          backgroundColor: '#000000',
          transition: 'width 0.3s ease'
        }} />
      </div>
      
      <div style={{ 
        fontSize: '11px', 
        color: '#666', 
        textAlign: 'right', 
        marginTop: '2px' 
      }}>
        {actionBufferLength} more updates pending
      </div>
    </div>
  );
};

export default ActionPreview;
