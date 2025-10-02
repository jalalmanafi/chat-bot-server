import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { uploadFile, deleteFile } from '../config/storage';
import { CreateTicketDTO, UpdateTicketDTO, Ticket, AppError } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { validateFileType, validateFileSize } from '../utils/validation';

// Create ticket
export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticketData: CreateTicketDTO = req.body;

    const ticket: Partial<Ticket> = {
      id: uuidv4(),
      ticket_number: `CC${Date.now().toString().slice(-6)}`,
      subject: ticketData.subject,
      description: ticketData.description,
      customer_name: ticketData.contact.name,
      customer_phone: ticketData.contact.phone,
      customer_email: ticketData.contact.email,
      conversation: ticketData.conversation,
      language: ticketData.language,
      source: ticketData.source || 'web',
      status: 'open',
      priority: 'normal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('tickets')
      .insert(ticket)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create ticket', error);
      throw new AppError(500, 'Failed to create ticket');
    }

    logger.info('Ticket created successfully', { ticketNumber: data.ticket_number });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

// Get all tickets
export const getAllTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, language, source, limit = '50', offset = '0' } = req.query;

    let query = supabase
      .from('tickets')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) query = query.eq('status', status);
    if (language) query = query.eq('language', language);
    if (source) query = query.eq('source', source);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch tickets', error);
      throw new AppError(500, 'Failed to fetch tickets');
    }

    logger.info('Tickets fetched successfully', { count: data?.length });
    res.json({
      tickets: data,
      total: count,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    next(error);
  }
};

// Get single ticket
export const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Failed to fetch ticket', error);
      throw new AppError(500, 'Failed to fetch ticket');
    }

    if (!data) {
      throw new AppError(404, 'Ticket not found');
    }

    logger.info('Ticket fetched successfully', { ticketId: id });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// Update ticket
export const updateTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates: UpdateTicketDTO = req.body;

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
      ...(updates.status === 'resolved' && { resolved_at: new Date().toISOString() })
    };

    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update ticket', error);
      throw new AppError(500, 'Failed to update ticket');
    }

    if (!data) {
      throw new AppError(404, 'Ticket not found');
    }

    logger.info('Ticket updated successfully', { ticketId: id, updates });
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// Delete ticket
export const deleteTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Get ticket first to check if has file
    const { data: ticket } = await supabase
      .from('tickets')
      .select('receipt_filename')
      .eq('id', id)
      .single();

    // Delete file if exists
    if (ticket?.receipt_filename) {
      try {
        await deleteFile(ticket.receipt_filename);
      } catch (err) {
        logger.warn('Failed to delete file from storage', err);
      }
    }

    // Delete ticket
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Failed to delete ticket', error);
      throw new AppError(500, 'Failed to delete ticket');
    }

    logger.info('Ticket deleted successfully', { ticketId: id });
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Upload receipt
export const uploadReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      throw new AppError(400, 'No file uploaded');
    }

    // Validate file type
    if (!validateFileType(file.mimetype)) {
      throw new AppError(400, 'Invalid file type. Only PDF, JPEG, and PNG are allowed');
    }

    // Validate file size (5MB max)
    if (!validateFileSize(file.size, 5)) {
      throw new AppError(400, 'File size must be less than 5MB');
    }

    // Check if ticket exists
    const { data: existingTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('id, receipt_filename')
      .eq('id', id)
      .single();

    if (fetchError || !existingTicket) {
      throw new AppError(404, 'Ticket not found');
    }

    // Delete old file if exists
    if (existingTicket.receipt_filename) {
      try {
        await deleteFile(existingTicket.receipt_filename);
      } catch (err) {
        logger.warn('Failed to delete old file', err);
      }
    }

    // Upload new file
    const { url, filename } = await uploadFile(file, 'receipts');

    // Update ticket with file info
    const { data, error } = await supabase
      .from('tickets')
      .update({
        receipt_url: url,
        receipt_filename: filename,
        receipt_uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update ticket with receipt', error);
      throw new AppError(500, 'Failed to update ticket with receipt');
    }

    logger.info('Receipt uploaded successfully', { ticketId: id, filename });
    res.json(data);
  } catch (error) {
    next(error);
  }
};
