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
  content: string;
  sections?: MessageSection[];
  timestamp: Date;
  isMe: boolean;
}

export interface ChatState {
  messages: Message[];
}