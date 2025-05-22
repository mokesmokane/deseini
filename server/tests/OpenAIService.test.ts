// server/tests/OpenAIService.test.ts

import { OpenAIService, ProjectTask, ProjectContext, ChatMessage, parseMarkdownToTaskTreeInternal, RoleInfo } from '../services/OpenAIService'; // Adjust path as needed
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock OpenAI module
// We need to mock the top-level 'openai' import
const mockCreate = vi.fn();
vi.mock('openai', () => {
  // This is the factory function for the 'openai' module
  return {
    OpenAI: vi.fn(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

// Mock parseMarkdownToTaskTreeInternal for specific tests if needed, or use the real one
// We need to ensure that the mock is properly set up for parseMarkdownToTaskTreeInternal
// as it's part of the same module being tested (OpenAIService.ts)
// The path for mocking should be relative to the test file itself or the project root
// depending on how Vitest resolves it. Let's assume '../services/OpenAIService' is correct.
const mockParseMarkdown = vi.fn();
vi.mock('../services/OpenAIService', async (importOriginal) => {
  const originalModule = await importOriginal() as any; // Cast to any to access non-exported items if necessary
  return {
    ...originalModule, // Import and retain all original exports
    parseMarkdownToTaskTreeInternal: mockParseMarkdown, // Mock this specific function
  };
});


describe('parseMarkdownToTaskTreeInternal', () => {
  // Existing tests for parseMarkdownToTaskTreeInternal will go here
  // For brevity, I'm omitting them as they were in the previous step's output
  // but they should be kept.
  // Reset the mockParseMarkdown before each of these tests if it's used by them
  beforeEach(() => {
    mockParseMarkdown.mockReset();
    // If the actual implementation is needed for some tests of parseMarkdownToTaskTreeInternal:
    // mockParseMarkdown.mockImplementation(vi.requireActual('../services/OpenAIService').parseMarkdownToTaskTreeInternal);
  });

  it('should return an empty array for empty markdown', () => {
    mockParseMarkdown.mockImplementation(vi.requireActual('../services/OpenAIService').parseMarkdownToTaskTreeInternal);
    expect(parseMarkdownToTaskTreeInternal('')).toEqual([]);
  });

  it('should parse simple, single-level markdown', () => {
    mockParseMarkdown.mockImplementation(vi.requireActual('../services/OpenAIService').parseMarkdownToTaskTreeInternal);
    const markdown = `- Task 1
- Task 2`;
    const expected: ProjectTask[] = [
      { id: 'task-1', name: 'Task 1' },
      { id: 'task-2', name: 'Task 2' },
    ];
    expect(parseMarkdownToTaskTreeInternal(markdown)).toEqual(expected);
  });

  it('should parse multi-level markdown', () => {
    mockParseMarkdown.mockImplementation(vi.requireActual('../services/OpenAIService').parseMarkdownToTaskTreeInternal);
    const markdown = `- Task 1
  - Subtask 1.1
- Task 2
  - Subtask 2.1
    - Sub-subtask 2.1.1`;
    const expected: ProjectTask[] = [
      { 
        id: 'task-1', 
        name: 'Task 1', 
        children: [
          { id: 'task-2', name: 'Subtask 1.1', parent: 'task-1' },
        ],
      },
      { 
        id: 'task-3', 
        name: 'Task 2', 
        children: [
          { 
            id: 'task-4', 
            name: 'Subtask 2.1', 
            parent: 'task-3', 
            children: [
              { id: 'task-5', name: 'Sub-subtask 2.1.1', parent: 'task-4' },
            ],
          },
        ],
      },
    ];
    expect(parseMarkdownToTaskTreeInternal(markdown)).toEqual(expected);
  });

  it('should handle inconsistent spacing (assuming 2 spaces indent)', () => {
    mockParseMarkdown.mockImplementation(vi.requireActual('../services/OpenAIService').parseMarkdownToTaskTreeInternal);
    const markdown = `- Task 1
   - Subtask 1.1`; // 3 spaces for indent
    const expected: ProjectTask[] = [
      { 
        id: 'task-1', 
        name: 'Task 1', 
        children: [
          { id: 'task-2', name: 'Subtask 1.1', parent: 'task-1' },
        ],
      },
    ];
    expect(parseMarkdownToTaskTreeInternal(markdown)).toEqual(expected); 
  });

  it('should handle markdown with extra blank lines', () => {
    mockParseMarkdown.mockImplementation(vi.requireActual('../services/OpenAIService').parseMarkdownToTaskTreeInternal);
    const markdown = `- Task 1

- Task 2
  - Subtask 2.1`;
    const expected: ProjectTask[] = [
      { id: 'task-1', name: 'Task 1' },
      { 
        id: 'task-2', 
        name: 'Task 2', 
        children: [
          { id: 'task-3', name: 'Subtask 2.1', parent: 'task-2' },
        ],
      },
    ];
    expect(parseMarkdownToTaskTreeInternal(markdown)).toEqual(expected);
  });

  it('should ignore lines not starting with "- "', () => {
    mockParseMarkdown.mockImplementation(vi.requireActual('../services/OpenAIService').parseMarkdownToTaskTreeInternal);
    const markdown = `This is some text
- Task 1
Another line
  - Subtask 1.1`;
    const expected: ProjectTask[] = [
      { 
        id: 'task-1', 
        name: 'Task 1',
        children: [
           { id: 'task-2', name: 'Subtask 1.1', parent: 'task-1' }
        ]
      }
    ];
    expect(parseMarkdownToTaskTreeInternal(markdown)).toEqual(expected);
  });

  it('should return an empty array if no valid task lines are present', () => {
    mockParseMarkdown.mockImplementation(vi.requireActual('../services/OpenAIService').parseMarkdownToTaskTreeInternal);
    const markdown = `Just some text
Another line of text
- 
-  `;
    expect(parseMarkdownToTaskTreeInternal(markdown)).toEqual([]);
  });

  it('should handle tasks with only hyphens and spaces (empty names)', () => {
    mockParseMarkdown.mockImplementation(vi.requireActual('../services/OpenAIService').parseMarkdownToTaskTreeInternal);
    const markdown = `- Task A
- 
- Task B`; 
    const expected: ProjectTask[] = [
      { id: 'task-1', name: 'Task A' },
      { id: 'task-2', name: 'Task B' },
    ];
    expect(parseMarkdownToTaskTreeInternal(markdown)).toEqual(expected);
  });

  it('should correctly assign parent IDs', () => {
    mockParseMarkdown.mockImplementation(vi.requireActual('../services/OpenAIService').parseMarkdownToTaskTreeInternal);
    const markdown = `- Root1
  - Child1.1
    - Grandchild1.1.1
- Root2
  - Child2.1`;
    const result = parseMarkdownToTaskTreeInternal(markdown);
    expect(result[0].children![0].parent).toBe(result[0].id);
    expect(result[0].children![0].children![0].parent).toBe(result[0].children![0].id);
    expect(result[1].children![0].parent).toBe(result[1].id);
  });

  it('should not create children array for leaf nodes', () => {
    mockParseMarkdown.mockImplementation(vi.requireActual('../services/OpenAIService').parseMarkdownToTaskTreeInternal);
    const markdown = `- Task 1
  - Leaf Task`;
    const result = parseMarkdownToTaskTreeInternal(markdown);
    expect(result[0].children![0].children).toBeUndefined();
  });

   it('should handle deeper nesting', () => {
    mockParseMarkdown.mockImplementation(vi.requireActual('../services/OpenAIService').parseMarkdownToTaskTreeInternal);
    const markdown = `- A
  - B
    - C
      - D
        - E`;
    const expected: ProjectTask[] = [
      {
        id: 'task-1', name: 'A', children: [
          {
            id: 'task-2', name: 'B', parent: 'task-1', children: [
              {
                id: 'task-3', name: 'C', parent: 'task-2', children: [
                  {
                    id: 'task-4', name: 'D', parent: 'task-3', children: [
                      { id: 'task-5', name: 'E', parent: 'task-4' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ];
    expect(parseMarkdownToTaskTreeInternal(markdown)).toEqual(expected);
  });

  it('should handle tasks added at the same indent level correctly', () => {
    mockParseMarkdown.mockImplementation(vi.requireActual('../services/OpenAIService').parseMarkdownToTaskTreeInternal);
    const markdown = `- A
  - B
  - C
- D`;
    const expected: ProjectTask[] = [
      {
        id: 'task-1', name: 'A', children: [
          { id: 'task-2', name: 'B', parent: 'task-1' },
          { id: 'task-3', name: 'C', parent: 'task-1' },
        ]
      },
      { id: 'task-4', name: 'D' }
    ];
    expect(parseMarkdownToTaskTreeInternal(markdown)).toEqual(expected);
  });

  it('should handle tasks that de-indent then re-indent', () => {
    mockParseMarkdown.mockImplementation(vi.requireActual('../services/OpenAIService').parseMarkdownToTaskTreeInternal);
    const markdown = `- A
  - B
    - C
  - D
- E
  - F`;
    const expected: ProjectTask[] = [
      {
        id: 'task-1', name: 'A', children: [
          {
            id: 'task-2', name: 'B', parent: 'task-1', children: [
              { id: 'task-3', name: 'C', parent: 'task-2' }
            ]
          },
          { id: 'task-4', name: 'D', parent: 'task-1' }
        ]
      },
      {
        id: 'task-5', name: 'E', children: [
          { id: 'task-6', name: 'F', parent: 'task-5' }
        ]
      }
    ];
    expect(parseMarkdownToTaskTreeInternal(markdown)).toEqual(expected);
  });
});


describe('OpenAIService - generateProjectTasks', () => {
  let service: OpenAIService;
  // mockCreate is already defined at the top level from vi.mock('openai')
  // mockParseMarkdown is already defined at the top level from vi.mock('../services/OpenAIService')

  beforeEach(async () => {
    // Reset mocks before each test
    // The OpenAI constructor mock and its create method mock (mockCreate) are auto-mocked by vi.mock
    // We just need to reset their call history etc.
    mockCreate.mockReset();
    mockParseMarkdown.mockReset();
    
    // We need to instantiate the service, which will use the mocked OpenAI client
    service = new OpenAIService('test-api-key');
  });

  afterEach(() => {
    vi.clearAllMocks(); // Clears all information stored in mocks
  });

  const samplePrompt = "Plan a new website";
  const sampleProjectContext: ProjectContext = {
    projectName: "E-commerce Platform",
    description: "A platform to sell goods online.",
  };
  const samplePreviousMessages: ChatMessage[] = [
    { role: 'user', content: 'Tell me about project planning.' },
    { role: 'assistant', content: 'Project planning involves several steps...' },
  ];

  it('should generate tasks successfully with valid markdown response', async () => {
    const mockMarkdown = "- Task 1\n  - Subtask 1.1";
    const mockParsedTasks: ProjectTask[] = [{ id: 'task-1', name: 'Task 1', children: [{id: 'task-2', name: 'Subtask 1.1', parent: 'task-1'}] }];
    
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: mockMarkdown } }],
    });
    mockParseMarkdown.mockReturnValue(mockParsedTasks); // This is the mock for parseMarkdownToTaskTreeInternal

    const result = await service.generateProjectTasks(samplePrompt, sampleProjectContext, samplePreviousMessages);

    expect(mockCreate).toHaveBeenCalledOnce();
    const messagesArg = mockCreate.mock.calls[0][0].messages;
    expect(messagesArg[0].role).toBe('system');
    expect(messagesArg[0].content).toContain("You are a project planning assistant");
    // Check context inclusion - _buildProjectContextString is private, so we check its effects
    expect(messagesArg[0].content).toContain(`Project Name: ${sampleProjectContext.projectName}`);
    expect(messagesArg[0].content).toContain(`Project Description: ${sampleProjectContext.description}`);
    expect(messagesArg[messagesArg.length -1].content).toContain(samplePrompt);


    expect(mockParseMarkdown).toHaveBeenCalledWith(mockMarkdown);
    expect(result.tasks).toEqual(mockParsedTasks);
    expect(result.message).toBe("Tasks generated successfully.");
    expect(result.error).toBeUndefined();
  });
  
  it('should correctly build system message with project context', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '- Task' } }] });
    mockParseMarkdown.mockReturnValue([{ id: 'task-1', name: 'Task' }]);

    await service.generateProjectTasks(samplePrompt, sampleProjectContext);
    expect(mockCreate).toHaveBeenCalledOnce();
    const systemMessage = mockCreate.mock.calls[0][0].messages[0].content;
    expect(systemMessage).toContain(`Project Name: ${sampleProjectContext.projectName}`);
    expect(systemMessage).toContain(`Project Description: ${sampleProjectContext.description}`);
    // Also check for the instruction to use project context
    expect(systemMessage).toContain("Use this project context to create a more relevant and detailed markdown task breakdown.");
  });

  it('should correctly include previous messages', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '- Task' } }] });
    mockParseMarkdown.mockReturnValue([{ id: 'task-1', name: 'Task' }]);

    await service.generateProjectTasks(samplePrompt, null, samplePreviousMessages);
    expect(mockCreate).toHaveBeenCalledOnce();
    const messagesArg = mockCreate.mock.calls[0][0].messages;
    // System, PrevUser, PrevAssistant, CurrentUserPrompt
    // messagesArg[0] is system
    // messagesArg[1] should be samplePreviousMessages[0] (user)
    // messagesArg[2] should be samplePreviousMessages[1] (assistant)
    // messagesArg[3] should be the main user prompt
    expect(messagesArg.length).toBe(1 + samplePreviousMessages.length + 1); 
    expect(messagesArg[1].role).toBe(samplePreviousMessages[0].role);
    expect(messagesArg[1].content).toBe(samplePreviousMessages[0].content);
    expect(messagesArg[2].role).toBe(samplePreviousMessages[1].role);
    expect(messagesArg[2].content).toBe(samplePreviousMessages[1].content);
  });

  it('should return error if OpenAI provides no content', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: null } }], // Simulate null content
    });

    const result = await service.generateProjectTasks(samplePrompt);
    
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockParseMarkdown).not.toHaveBeenCalled();
    expect(result.error).toBe("Failed to generate tasks: No content received from AI.");
    expect(result.tasks).toBeUndefined();
  });

  it('should return error if markdown parsing fails (throws error)', async () => {
    const malformedMarkdown = "- Task 1\n  -Subtask 1.1"; // Example bad markdown
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: malformedMarkdown } }],
    });
    const parseError = new Error("Simulated Parsing failed");
    mockParseMarkdown.mockImplementation(() => { throw parseError; });

    const result = await service.generateProjectTasks(samplePrompt);

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockParseMarkdown).toHaveBeenCalledWith(malformedMarkdown);
    expect(result.error).toMatch(`Failed to parse generated tasks. Parser error: ${parseError.message}`);
    // Check if the original markdown is included in the message for debugging
    expect(result.message).toBe(malformedMarkdown); 
    expect(result.tasks).toBeUndefined();
  });
  
  it('should return error if parseMarkdownToTaskTreeInternal returns empty tasks for non-empty content that is not just whitespace', async () => {
    const nonEmptyButUnparsableMarkdown = "This is some text that is not a task list.";
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: nonEmptyButUnparsableMarkdown } }],
    });
    // Let the mock for parseMarkdownToTaskTreeInternal return []
    mockParseMarkdown.mockReturnValue([]); 

    const result = await service.generateProjectTasks(samplePrompt);

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockParseMarkdown).toHaveBeenCalledWith(nonEmptyButUnparsableMarkdown);
    // This behavior is based on the implementation:
    // if (parsedTasks.length === 0 && markdownContent.trim() !== '') { ... }
    expect(result.error).toBe("Generated content could not be parsed into tasks.");
    expect(result.message).toBe(nonEmptyButUnparsableMarkdown);
    expect(result.tasks).toBeUndefined();
  });
  
  it('should not return "Generated content could not be parsed..." error if markdown is empty or only whitespace and parsing results in empty tasks', async () => {
    const emptyMarkdown = "   "; // Whitespace only
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: emptyMarkdown } }],
    });
    mockParseMarkdown.mockReturnValue([]); // Parsing whitespace results in empty array

    const result = await service.generateProjectTasks(samplePrompt);

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockParseMarkdown).toHaveBeenCalledWith(emptyMarkdown);
    // In this case, it's treated as a successful generation of zero tasks, not a parsing error for valid content
    expect(result.tasks).toEqual([]);
    expect(result.message).toBe("Tasks generated successfully.");
    expect(result.error).toBeUndefined();
  });

  it('should return error if OpenAI API call fails', async () => {
    const apiError = new Error("OpenAI API Error");
    mockCreate.mockRejectedValue(apiError); // Simulate API call rejection

    const result = await service.generateProjectTasks(samplePrompt);

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockParseMarkdown).not.toHaveBeenCalled();
    expect(result.error).toBe(apiError.message);
    expect(result.tasks).toBeUndefined();
  });
});

describe('OpenAIService - extractRoleInfo', () => {
  let service: OpenAIService;
  // mockCreate is already defined at the top level from vi.mock('openai')

  beforeEach(async () => {
    mockCreate.mockReset();
    service = new OpenAIService('test-api-key');
    // Ensure system time is real for most tests, can be mocked per test if needed
    vi.useRealTimers(); 
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const sampleText = "We are looking for a Senior Software Engineer in London.";
  const expectedRoleInfo: RoleInfo = {
    title: "Senior Software Engineer",
    type: "Full-time",
    country: "UK",
    region: "London",
    level: "Senior",
    description: "A senior software engineering role."
  };

  it('should extract role information successfully when function call is present and arguments are valid JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          function_call: {
            name: "extract_role_info",
            arguments: JSON.stringify(expectedRoleInfo),
          },
        },
      }],
    });

    const result = await service.extractRoleInfo(sampleText);

    expect(mockCreate).toHaveBeenCalledOnce();
    const apiArgs = mockCreate.mock.calls[0][0];
    expect(apiArgs.model).toBe("gpt-4.1");
    expect(apiArgs.messages[0].role).toBe('system');
    expect(apiArgs.messages[1].role).toBe('user');
    expect(apiArgs.messages[1].content).toBe(sampleText);
    expect(apiArgs.functions[0].name).toBe("extract_role_info");
    expect(apiArgs.function_call.name).toBe("extract_role_info");
    
    expect(result.extraction).toEqual(expectedRoleInfo);
    expect(result.error).toBeUndefined();
  });

  it('should return empty extraction if OpenAI does not return a function call', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          // No function_call here
        },
      }],
    });

    const result = await service.extractRoleInfo(sampleText);

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(result.extraction).toEqual({});
    expect(result.error).toBeUndefined(); // As per current implementation
  });
  
  it('should return empty extraction if OpenAI returns a function call with no arguments', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          function_call: {
            name: "extract_role_info",
            arguments: undefined, // No arguments
          },
        },
      }],
    });

    const result = await service.extractRoleInfo(sampleText);
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(result.extraction).toEqual({});
    expect(result.error).toBeUndefined();
  });


  it('should return error if function call arguments are not valid JSON', async () => {
    const invalidJsonArguments = "{ title: 'Software Engineer', definitely_not_json_,,,, }";
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          function_call: {
            name: "extract_role_info",
            arguments: invalidJsonArguments,
          },
        },
      }],
    });

    const result = await service.extractRoleInfo(sampleText);

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(result.error).toBe("Failed to parse extracted role information.");
    expect(result.extraction).toBeUndefined();
  });

  it('should return error if OpenAI API call fails', async () => {
    const apiError = new Error("OpenAI API Connection Error");
    mockCreate.mockRejectedValue(apiError);

    const result = await service.extractRoleInfo(sampleText);

    expect(mockCreate).toHaveBeenCalledOnce();
    expect(result.error).toBe(apiError.message);
    expect(result.extraction).toBeUndefined();
  });
  
  it('should include current date and time in the system prompt', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          function_call: {
            name: "extract_role_info",
            arguments: JSON.stringify(expectedRoleInfo),
          },
        },
      }],
    });

    // Freeze time for testing date prefix
    const now = new Date(2023, 10, 21, 12, 30, 0); // Example: 2023-11-21 12:30:00
    vi.setSystemTime(now);


    await service.extractRoleInfo(sampleText);

    expect(mockCreate).toHaveBeenCalledOnce();
    const systemMessageContent = mockCreate.mock.calls[0][0].messages[0].content;
    expect(systemMessageContent).toContain(`Current date and time: ${now.toISOString()}`);
    
    vi.useRealTimers(); // Restore real timers
  });
});

describe('OpenAIService - generateSuggestedReplies', () => {
  let service: OpenAIService;
  // mockCreate is already defined at the top level from vi.mock('openai')

  beforeEach(async () => {
    mockCreate.mockReset(); // Reset the main mock function for OpenAI client's create
    service = new OpenAIService('test-api-key');
    // Freeze time for testing date prefix
    const now = new Date(2023, 10, 21, 12, 30, 0); // Example: 2023-11-21 12:30:00
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers(); // Restore real timers
  });

  const sampleMessages: ChatMessage[] = [
    { role: 'user', content: 'Hello there.' },
    { role: 'assistant', content: 'Hi! How can I help you plan your project?' },
    { role: 'user', content: 'I need some ideas.' },
    { role: 'assistant', content: 'Okay, what aspect are you focusing on? Timeline, scope, or team?' },
  ];
  const sampleProjectContext: ProjectContext = { projectName: "New App", description: "A cool new application." };
  const expectedSuggestions = ["Focus on timeline.", "Let's define the scope.", "Tell me about the team structure."];

  it('should generate suggested replies successfully', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          function_call: {
            name: "provide_suggested_replies",
            arguments: JSON.stringify({ suggestions: expectedSuggestions }),
          },
        },
      }],
    });

    const result = await service.generateSuggestedReplies(sampleMessages, sampleProjectContext);

    expect(mockCreate).toHaveBeenCalledOnce();
    const apiArgs = mockCreate.mock.calls[0][0];
    expect(apiArgs.model).toBe("gpt-4.1");
    expect(apiArgs.messages[0].role).toBe('system');
    expect(apiArgs.messages[0].content).toContain("You are an AI assistant helping a user plan a project.");
    // Check that project context string is in the system message (indirectly checking _buildProjectContextString)
    expect(apiArgs.messages[0].content).toContain(`Project Name: ${sampleProjectContext.projectName}`);
    // It should use the last assistant message for context
    expect(apiArgs.messages[1].role).toBe('assistant');
    expect(apiArgs.messages[1].content).toBe(sampleMessages[sampleMessages.length -1].content); 
    expect(apiArgs.functions[0].name).toBe("provide_suggested_replies");
    expect(apiArgs.function_call.name).toBe("provide_suggested_replies");
    
    expect(result.suggestions).toEqual(expectedSuggestions);
    expect(result.error).toBeUndefined();
  });

  it('should include project context in system message if provided', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { function_call: { name: "provide_suggested_replies", arguments: JSON.stringify({ suggestions: [] }) } } }],
    });

    await service.generateSuggestedReplies(sampleMessages, sampleProjectContext);
    expect(mockCreate).toHaveBeenCalledOnce();
    const systemMessage = mockCreate.mock.calls[0][0].messages[0].content;
    expect(systemMessage).toContain(`Project Name: ${sampleProjectContext.projectName}`);
    expect(systemMessage).toContain(`Project Description: ${sampleProjectContext.description}`);
    // Check for specific instruction related to using context
    expect(systemMessage).toContain("Relevant Project Context:"); // This implies context was added
  });

  it('should return empty suggestions if no messages are provided', async () => {
    const result = await service.generateSuggestedReplies([]);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(result.suggestions).toEqual([]);
    expect(result.error).toBeUndefined();
  });

  it('should return empty suggestions if no assistant messages are present', async () => {
    const userOnlyMessages: ChatMessage[] = [{ role: 'user', content: 'Hi' }];
    const result = await service.generateSuggestedReplies(userOnlyMessages);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(result.suggestions).toEqual([]);
    expect(result.error).toBeUndefined();
  });

  it('should return empty suggestions if OpenAI does not return a function call', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: {} }] }); // No function_call
    const result = await service.generateSuggestedReplies(sampleMessages);
    expect(mockCreate).toHaveBeenCalledOnce(); // API is called, but no function_call in response
    expect(result.suggestions).toEqual([]);
    expect(result.error).toBeUndefined();
  });
  
  it('should return empty suggestions if function call has no arguments', async () => {
    mockCreate.mockResolvedValue({ 
      choices: [{ message: { function_call: { name: "provide_suggested_replies", arguments: undefined } } }],
    });
    const result = await service.generateSuggestedReplies(sampleMessages);
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(result.suggestions).toEqual([]);
    expect(result.error).toBeUndefined();
  });

  it('should return error if function call arguments are invalid JSON', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { function_call: { name: "provide_suggested_replies", arguments: "not json" } } }],
    });
    const result = await service.generateSuggestedReplies(sampleMessages);
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(result.error).toBe("Failed to parse suggested replies.");
    expect(result.suggestions).toBeUndefined();
  });

  it('should return error if OpenAI API call fails', async () => {
    const apiError = new Error("Network Error");
    mockCreate.mockRejectedValue(apiError);
    const result = await service.generateSuggestedReplies(sampleMessages);
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(result.error).toBe(apiError.message);
    expect(result.suggestions).toBeUndefined();
  });
  
  it('should correctly use the last assistant message for context', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { function_call: { name: "provide_suggested_replies", arguments: JSON.stringify({ suggestions: [] }) } } }],
    });

    const messagesWithMultipleAssistantResponses: ChatMessage[] = [
      { role: 'user', content: 'User 1'},
      { role: 'assistant', content: 'Assistant 1 (Older)'},
      { role: 'user', content: 'User 2'},
      { role: 'assistant', content: 'Assistant 2 (Last one)'}
    ];
    await service.generateSuggestedReplies(messagesWithMultipleAssistantResponses);
    expect(mockCreate).toHaveBeenCalledOnce();
    const passedMessages = mockCreate.mock.calls[0][0].messages;
    // System message + Last Assistant Message
    expect(passedMessages.length).toBe(2); 
    expect(passedMessages[1].role).toBe('assistant');
    expect(passedMessages[1].content).toBe('Assistant 2 (Last one)');
  });

  it('should include current date and time in the system prompt', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { function_call: { name: "provide_suggested_replies", arguments: JSON.stringify({ suggestions: [] }) } } }],
    });
    const now = new Date(2023, 10, 21, 12, 30, 0); // Already set in beforeEach
    
    await service.generateSuggestedReplies(sampleMessages);
    expect(mockCreate).toHaveBeenCalledOnce();
    const systemMessageContent = mockCreate.mock.calls[0][0].messages[0].content;
    expect(systemMessageContent).toContain(`Current date and time: ${now.toISOString()}`);
  });
});
