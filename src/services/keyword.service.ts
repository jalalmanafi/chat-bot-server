import { templates } from '../data/templates';
import { keywords } from '../data/keywords';

const normalizeText = (text: string): string => {
  return text.toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ə/g, 'e')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/[^\w\s]/g, '')
    .trim();
};

export const findRuleBasedResponse = (message: string, lang: 'az' | 'ru'): string | null => {
  const normalizedMsg = normalizeText(message);

  // Check menu number
  const numberMatch = normalizedMsg.match(/^(\d+)$/);
  if (numberMatch) {
    const number = parseInt(numberMatch[1]);
    const menuMap: Record<number, keyof typeof templates.az> = {
      1: 'add_card_to_app',
      2: 'qr_ticket',
      3: 'mobile_topup_guide',
      4: 'terminal_topup_guide',
      5: 'map_routes',
      6: 'use_without_card',
      7: 'balance_not_added',
      8: 'apple_wallet',
      9: 'bus_route_info'
    };
    return menuMap[number] ? templates[lang][menuMap[number]] : null;
  }

  // Check greetings
  if (normalizedMsg.includes('salam') || normalizedMsg.includes('hello') ||
      normalizedMsg.includes('привет') || normalizedMsg.includes('privet')) {
    return templates[lang].general_help;
  }

  // Score-based matching
  let bestMatch: string | null = null;
  let highestScore = 0;

  for (const [category, data] of Object.entries(keywords)) {
    let score = 0;

    for (const word of data.words) {
      if (normalizedMsg.includes(normalizeText(word))) {
        score += 1;
      }
    }

    for (const phrase of data.phrases) {
      if (normalizedMsg.includes(normalizeText(phrase))) {
        score += 3;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = category;
    }
  }

  if (highestScore >= 2 && bestMatch) {
    return templates[lang][bestMatch as keyof typeof templates.az];
  }

  return null;
};

export const needsHumanAgent = (message: string): boolean => {
  const normalized = normalizeText(message);
  const humanKeywords = [
    'sikayət', 'complaint', 'naraziyam', 'pis', 'bad',
    'islemir', 'problem', 'menecer', 'manager', 'operator',
    'insan', 'human', 'komek', 'help', 'basa dusmure',
    'жалоба', 'zhaloba', 'problema', 'не работает', 'плохо'
  ];

  return humanKeywords.some(keyword => normalized.includes(keyword));
};
