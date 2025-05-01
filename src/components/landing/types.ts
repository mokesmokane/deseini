export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

export type MessageSectionType = 'text' | 'code' | 'link' | 'file' | 'image';

export interface MessageSection {
  type: MessageSectionType;
  content: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

export interface Message {
  id: string;
  sections?: MessageSection[];
  timestamp: Date;
  content?: string;
  role: 'user' | 'assistant';
  status: MessageStatus;
  isTyping?: boolean;
}

export interface ChatState {
  messages: Message[];
}


// Basic section data structure
export interface SectionData {
  id: string;
  title: string;
  sectionIndex: number | null;
  content: string;
  updatedAt: Date;
}

export interface SectionUpdateState {
  sectionId?: string // The individual section that was updated
  state: "created" | "creating" | "updated" | "updating" | "deleted" | "deleting" | "error";
}

export interface UpdateState {
  sectionUpdateStates: SectionUpdateState[];
}

// Process update event to notify consumers
export interface ProcessUpdateEvent {
  section?: SectionData; // The individual section that was updated
  updateState: UpdateState;
  currentSectionId: string | null;
  creating: boolean;
}