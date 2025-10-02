export interface Message {
  role: 'user' | 'assistant';
  content: string;
  source?: 'rule' | 'ai' | 'system' | 'error';
  timestamp: string;
}

export interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  source: 'web' | 'whatsapp';
  language: 'az' | 'ru';
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  conversation: Message[];
  receipt_url?: string;
  receipt_filename?: string;
  receipt_uploaded_at?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface CreateTicketDTO {
  subject: string;
  description: string;
  contact: ContactInfo;
  conversation: Message[];
  language: 'az' | 'ru';
  source?: 'web' | 'whatsapp';
}

export interface UpdateTicketDTO {
  status?: Ticket['status'];
  priority?: Ticket['priority'];
  assigned_to?: string;
}

export interface ChatMessageRequest {
  message: string;
  language: 'az' | 'ru';
}

export interface ChatMessageResponse {
  reply: string;
  source: 'rule' | 'system';
  needsTicket: boolean;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
