import { Request, Response, NextFunction } from 'express';
import { findRuleBasedResponse, needsHumanAgent } from '../services/keyword.service';
import { ChatMessageRequest, ChatMessageResponse } from '../types';
import { logger } from '../utils/logger';

export const handleChatMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, language }: ChatMessageRequest = req.body;

    logger.info('Chat message received', { language, messageLength: message.length });

    // Try rule-based matching
    const ruleResponse = findRuleBasedResponse(message, language);

    if (ruleResponse) {
      const response: ChatMessageResponse = {
        reply: ruleResponse,
        source: 'rule',
        needsTicket: false
      };
      logger.info('Rule-based response sent');
      return res.json(response);
    }

    // Check if needs human agent
    if (needsHumanAgent(message)) {
      const response: ChatMessageResponse = {
        reply: language === 'az'
          ? 'Bu məsələ ilə bağlı dəstək komandamız sizə kömək edəcək.'
          : 'Наша поддержка поможет вам с этим вопросом.',
        source: 'system',
        needsTicket: true
      };
      logger.info('Human agent needed - ticket creation suggested');
      return res.json(response);
    }

    // No match found
    const response: ChatMessageResponse = {
      reply: language === 'az'
        ? 'Üzr istəyirəm, sualınızı tam başa düşmədim. Zəhmət olmasa daha ətraflı yazın.'
        : 'Извините, не понял вопрос. Напишите подробнее.',
      source: 'system',
      needsTicket: false
    };

    logger.info('Unknown message - default response sent');
    res.json(response);
  } catch (error) {
    next(error);
  }
};