import { Request, Response, NextFunction } from 'express';
import { validatePhone, validateEmail } from '../utils/validation';
import { AppError } from '../types';

export const validateTicketInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, description, contact, language } = req.body;

    if (!subject || !description) {
      throw new AppError(400, 'Subject and description are required');
    }

    if (!contact || !contact.name || !contact.phone || !contact.email) {
      throw new AppError(400, 'Complete contact information is required');
    }

    if (!validatePhone(contact.phone)) {
      throw new AppError(400, 'Invalid Azerbaijan phone number format. Use: +994XXXXXXXXX');
    }

    if (!validateEmail(contact.email)) {
      throw new AppError(400, 'Invalid email format');
    }

    if (!language || !['az', 'ru'].includes(language)) {
      throw new AppError(400, 'Language must be either "az" or "ru"');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateChatInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, language } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError(400, 'Message is required');
    }

    if (!language || !['az', 'ru'].includes(language)) {
      throw new AppError(400, 'Language must be either "az" or "ru"');
    }

    next();
  } catch (error) {
    next(error);
  }
};