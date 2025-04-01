import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon, ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import TreeView, { flattenTree } from 'react-accessible-treeview';
import { useProject } from '../../contexts/ProjectContext';
import { useParams } from 'react-router-dom';

// Interface for our task data without extending INode
interface TaskData {
  name: string;
  id: number | string;
  parent?: number | string;
  metadata?: { [key: string]: any };
}

// Interface for our tree nodes with children property
interface TreeTaskNode extends TaskData {
  children?: TreeTaskNode[];
}

interface Task {
    id: string;
    title: string;
    selected: boolean;
    subtasks: Task[];
    expanded?: boolean;
  }
  
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
  }

interface CreateChartDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateChartDialog({ isOpen, onClose }: CreateChartDialogProps) {
  const { project, userCharts } = useProject();
  const { projectId } = useParams<{ projectId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [treeData, setTreeData] = useState<TreeTaskNode[]>([]);
  const [checkedNodes, setCheckedNodes] = useState<Set<number|string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'expanding-width' | 'loading' | 'complete'>('initial');

  // Format the project JSON representation to be sent to the API
  const getProjectJsonRepresentation = () => {
    if (!project) return null;
    
    // Create a complete project representation
    return {
      id: projectId,
      projectName: project.projectName || '',
      description: project.description || '',
      roles: project.roles || [],
      charts: userCharts || []
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: ChatMessage = { role: 'user', content: input };
    setMessages([...messages, newMessage]);
    setLoading(true);
    setError(null);

    try {
      // Get project context to send to the API
      const projectData = getProjectJsonRepresentation();

      // First API call to get confirmation or generate tasks
      const response = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input,
          // Include project context for better task generation
          projectContext: projectData,
          // If we're awaiting confirmation, include confirmUseFunction = true
          // If we're not yet awaiting confirmation, don't include confirmUseFunction
          ...(awaitingConfirmation ? { confirmUseFunction: true } : {})
        }),
      });

      if (!response.ok) {
        // First try to parse as JSON, but handle case where response is HTML
        const errorText = await response.text();
        let errorMessage = 'Failed to generate tasks';
        
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If it's not valid JSON (likely HTML), use a cleaner error message
          console.error('API returned non-JSON response:', errorText.substring(0, 150) + '...');
          errorMessage = 'Server returned an invalid response. Please ensure the API server is running.';
        }
        
        throw new Error(errorMessage);
      }

      // Safely parse JSON response
      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Invalid response format from server');
      }

      if (data.needsConfirmation) {
        // First phase - we need to ask for confirmation
        setMessages([...messages, newMessage, { 
          role: 'assistant', 
          content: data.message 
        }]);
        setAwaitingConfirmation(true);
      } else if (data.tasks) {
        // Second phase - we received the tasks
        setTreeData(data.tasks);
        
        // Create a proper rootNode with id
        const rootNode = { id: 0, name: "Project Tasks", children: data.tasks };
        const flattenedNodes = flattenTree(rootNode);
        setCheckedNodes(new Set(flattenedNodes.map(node => node.id)));
        
        setMessages([...messages, newMessage, { 
          role: 'assistant', 
          content: 'I\'ve created a task breakdown based on your requirements. You can find it in the canvas to the right.' 
        }]);
        
        setShowCanvas(true);
        setAnimationPhase('expanding-width');
        setAwaitingConfirmation(false);
        
        setTimeout(() => setAnimationPhase('loading'), 800);
        setTimeout(() => setAnimationPhase('complete'), 1600);
      } else if (data.message) {
        // In case of cancellation or other messages
        setMessages([...messages, newMessage, { 
          role: 'assistant', 
          content: data.message 
        }]);
        setAwaitingConfirmation(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setMessages([...messages, newMessage, { 
        role: 'assistant', 
        content: `I encountered an error: ${error instanceof Error ? error.message : 'An unknown error occurred'}` 
      }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  // Create a properly typed root node for TreeView
  const rootNode = treeData.length 
    ? { id: 0, name: "Project Tasks", children: treeData } 
    : { id: 0, name: "Project Tasks", children: [] };
    
  const flattenedData = flattenTree(rootNode);
  const defaultExpandedIds = flattenedData
    .filter(node => node.children && node.children.length > 0)
    .map(node => node.id);

  const handleNodeSelect = (nodeId: number|string) => {
    const newCheckedNodes = new Set(checkedNodes);
    const node = flattenedData.find(n => n.id === nodeId);
    
    if (!node) return;

    if (checkedNodes.has(nodeId)) {
      newCheckedNodes.delete(nodeId);
    } else {
      newCheckedNodes.add(nodeId);
    }

    const handleChildren = (parentId: number|string, shouldCheck: boolean) => {
      const children = flattenedData.filter(n => n.parent === parentId);
      children.forEach(child => {
        if (shouldCheck) {
          newCheckedNodes.add(child.id);
        } else {
          newCheckedNodes.delete(child.id);
        }
        if (child.children?.length) {
          handleChildren(child.id, shouldCheck);
        }
      });
    };

    const handleParents = (childId: number|string) => {
      const node = flattenedData.find(n => n.id === childId);
      if (!node || node.parent === undefined || node.parent === 0) return;

      const siblings = flattenedData.filter(n => n.parent === node.parent);
      const hasCheckedChild = siblings.some(sibling => newCheckedNodes.has(sibling.id));
      
      if (node.parent !== null) {
        if (hasCheckedChild) {
          newCheckedNodes.add(node.parent);
        }

        handleParents(node.parent);
      }
    };

    if (!checkedNodes.has(nodeId)) {
      handleChildren(nodeId, true);
    } else {
      handleChildren(nodeId, false);
    }
    handleParents(nodeId);

    setCheckedNodes(newCheckedNodes);
  };

  const getCanvasClassName = () => {
    const baseClasses = 'transition-all duration-[800ms] ease-in-out absolute right-0 top-0';
    
    if (!showCanvas) return `${baseClasses} opacity-0 w-0 h-0`;
    
    switch (animationPhase) {
      case 'expanding-width':
        return `${baseClasses} opacity-100 w-[380px] h-0 overflow-hidden`;
      case 'loading':
        return `${baseClasses} opacity-100 w-[380px] h-full overflow-hidden`;
      case 'complete':
        return `${baseClasses} opacity-100 w-[380px] h-full`;
      default:
        return `${baseClasses} opacity-0 w-0 h-0`;
    }
  };

  const getChatClassName = () => {
    const baseClasses = 'transition-all duration-[800ms] ease-in-out bg-gray-50 rounded-lg p-4 border border-gray-200 h-full';
    
    if (!showCanvas) {
      return `${baseClasses} w-full`;
    }
    
    switch (animationPhase) {
      case 'expanding-width':
      case 'loading':
      case 'complete':
        return `${baseClasses} w-[calc(100%-380px)] mr-[380px]`;
      default:
        return `${baseClasses} w-full`;
    }
  };

  const handleCreateChart = () => {
    // Collect checked nodes
    const selectedNodes = flattenedData.filter(node => checkedNodes.has(node.id));
    
    // Todo: Send selected tasks to the backend and create actual chart
    console.log('Creating chart with selected tasks:', selectedNodes);
    
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 fixed inset-0 z-50" />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-5 rounded-lg w-[90vw] max-w-[1200px] h-[80vh] overflow-hidden z-50"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <Dialog.Title className="text-2xl font-bold mb-4 text-gray-800">Create a New Chart</Dialog.Title>
          
          <div className="flex flex-col h-[calc(100%-80px)]">
            <div className="flex-1 relative overflow-hidden">
              {/* Chat area */}
              <div className={getChatClassName()}>
                <div className="h-[calc(100%-60px)] overflow-y-auto mb-4 flex flex-col space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-gray-500 italic">
                      Describe your project and I'll help you break it down into tasks...
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-blue-100 ml-auto max-w-[80%]' 
                            : 'bg-gray-200 mr-auto max-w-[80%]'
                        }`}
                      >
                        {msg.content}
                      </div>
                    ))
                  )}
                  {loading && (
                    <div className="flex space-x-2 p-3 bg-gray-200 rounded-lg mr-auto max-w-[80%]">
                      <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                    </div>
                  )}
                  {error && (
                    <div className="p-3 bg-red-100 text-red-600 rounded-lg mr-auto max-w-[80%]">
                      Error: {error}
                    </div>
                  )}
                </div>
                
                <form onSubmit={handleSubmit} className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={awaitingConfirmation ? "Type 'yes' to confirm..." : "Describe your project..."}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-2 rounded-lg disabled:bg-blue-300"
                    disabled={loading || !input.trim()}
                  >
                    {loading ? "..." : "Send"}
                  </button>
                </form>
              </div>
              
              {/* Task canvas */}
              <div className={getCanvasClassName()}>
                <div className="h-full bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-y-auto">
                  <h3 className="text-lg font-semibold mb-3">Task Breakdown</h3>
                  
                  <div className="mb-4">
                    <TreeView 
                      data={flattenedData}
                      defaultExpandedIds={defaultExpandedIds}
                      aria-label="Project task tree"
                      nodeRenderer={({
                        element,
                        isBranch,
                        isExpanded,
                        isSelected,
                        getNodeProps,
                        level,
                      }) => (
                        <div 
                          {...getNodeProps({ onClick: isSelected ? undefined : () => {} })}
                          style={{ paddingLeft: `${level * 20}px` }}
                          className="flex items-center py-1.5 hover:bg-gray-100 rounded"
                        >
                          {isBranch && (
                            <div className="mr-1">
                              {isExpanded ? (
                                <ChevronDownIcon />
                              ) : (
                                <ChevronRightIcon />
                              )}
                            </div>
                          )}
                          
                          <Checkbox.Root
                            className="flex h-4 w-4 appearance-none items-center justify-center rounded bg-white border border-gray-300 mr-2"
                            checked={checkedNodes.has(element.id)}
                            onCheckedChange={() => handleNodeSelect(element.id)}
                            id={`checkbox-${element.id}`}
                          >
                            <Checkbox.Indicator>
                              <CheckIcon className="h-4 w-4 text-blue-500" />
                            </Checkbox.Indicator>
                          </Checkbox.Root>
                          
                          <span className="text-sm">{element.name}</span>
                        </div>
                      )}
                    />
                  </div>
                  
                  <div className="mt-auto">
                    <button
                      onClick={handleCreateChart}
                      className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                      disabled={checkedNodes.size === 0}
                    >
                      Create Chart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}