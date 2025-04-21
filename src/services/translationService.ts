import api from './api';

// Types for translation
type TranslationResult = {
  translations: { [id: number]: string };
  method: string;
};

// More comprehensive dictionaries for common phrases
const dictionaries: { [lang: string]: { [phrase: string]: string } } = {
  es: {
    // Common phrases
    'Hello': 'Hola',
    'Good morning': 'Buenos días',
    'Good afternoon': 'Buenas tardes',
    'Good evening': 'Buenas noches',
    'How are you?': '¿Cómo estás?',
    'I am fine': 'Estoy bien',
    'Thank you': 'Gracias',
    'You\'re welcome': 'De nada',
    'Yes': 'Sí',
    'No': 'No',
    'Maybe': 'Quizás',
    'Please': 'Por favor',
    'Sorry': 'Lo siento',
    'Excuse me': 'Disculpe',
    'Goodbye': 'Adiós',
    'See you later': 'Hasta luego',
    'Nice to meet you': 'Encantado de conocerte',
    'How much is this?': '¿Cuánto cuesta esto?',
    'I don\'t understand': 'No entiendo',
    'Can you help me?': '¿Puedes ayudarme?',
    'Where is': 'Dónde está',
    'What time is it?': '¿Qué hora es?',
    'Today': 'Hoy',
    'Tomorrow': 'Mañana',
    'Yesterday': 'Ayer',
    'Meeting': 'Reunión',
    'Project': 'Proyecto',
    'Task': 'Tarea',
    'Important': 'Importante',
    'Urgent': 'Urgente'
  },
  fr: {
    // Common phrases
    'Hello': 'Bonjour',
    'Good morning': 'Bonjour',
    'Good afternoon': 'Bon après-midi',
    'Good evening': 'Bonsoir',
    'How are you?': 'Comment allez-vous?',
    'I am fine': 'Je vais bien',
    'Thank you': 'Merci',
    'You\'re welcome': 'De rien',
    'Yes': 'Oui',
    'No': 'Non',
    'Maybe': 'Peut-être',
    'Please': 'S\'il vous plaît',
    'Sorry': 'Désolé',
    'Excuse me': 'Excusez-moi',
    'Goodbye': 'Au revoir',
    'See you later': 'À plus tard',
    'Nice to meet you': 'Enchanté de vous rencontrer',
    'How much is this?': 'Combien ça coûte?',
    'I don\'t understand': 'Je ne comprends pas',
    'Can you help me?': 'Pouvez-vous m\'aider?',
    'Where is': 'Où est',
    'What time is it?': 'Quelle heure est-il?',
    'Today': 'Aujourd\'hui',
    'Tomorrow': 'Demain',
    'Yesterday': 'Hier',
    'Meeting': 'Réunion',
    'Project': 'Projet',
    'Task': 'Tâche',
    'Important': 'Important',
    'Urgent': 'Urgent'
  },
  de: {
    // Common phrases
    'Hello': 'Hallo',
    'Good morning': 'Guten Morgen',
    'Good afternoon': 'Guten Tag',
    'Good evening': 'Guten Abend',
    'How are you?': 'Wie geht es dir?',
    'I am fine': 'Mir geht es gut',
    'Thank you': 'Danke',
    'You\'re welcome': 'Bitte',
    'Yes': 'Ja',
    'No': 'Nein',
    'Maybe': 'Vielleicht',
    'Please': 'Bitte',
    'Sorry': 'Entschuldigung',
    'Excuse me': 'Entschuldigen Sie',
    'Goodbye': 'Auf Wiedersehen',
    'Meeting': 'Besprechung',
    'Project': 'Projekt',
    'Task': 'Aufgabe',
    'Important': 'Wichtig',
    'Urgent': 'Dringend'
  }
};

// Simple dictionary-based translation
export const translateText = (text: string, targetLanguage: string): string => {
  // If the target language is English or unsupported, return the original text
  if (targetLanguage === 'en' || !dictionaries[targetLanguage]) {
    return text;
  }

  const dictionary = dictionaries[targetLanguage];
  let translatedText = text;

  // Replace known phrases (case-insensitive, whole words only)
  Object.entries(dictionary).forEach(([english, foreign]) => {
    // Escape special regex characters in the English term
    const escapedEnglish = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedEnglish}\\b`, 'gi');
    translatedText = translatedText.replace(regex, () => foreign);
  });

  return translatedText;
};

// Translate all messages using local dictionary
export const translateMessages = (
  messages: { id: number; content: string }[],
  targetLanguage: string
): { [id: number]: string } => {
  const translations: { [id: number]: string } = {};

  messages.forEach((message) => {
    translations[message.id] = translateText(message.content, targetLanguage);
  });

  return translations;
};

// Try server translation, fall back to client-side if it fails
export const translateWithFallback = async (
  messages: { id: number; content: string }[],
  targetLanguage: string
): Promise<TranslationResult> => {
  // Skip processing if target is English or no messages
  if (targetLanguage === 'en' || messages.length === 0) {
    return { translations: {}, method: 'none' };
  }
  
  try {
    // Try server-side Python translation (using deep-translator)
    const response = await api.post('/api/translate', {
      messages,
      targetLanguage,
    });
    
    return { 
      translations: response.data.translations, 
      method: 'server' 
    };
  } catch (error) {
    console.log('Server translation failed, using client-side fallback...');
  }
  
  // Fall back to client-side dictionary translation
  const translations = translateMessages(messages, targetLanguage);
  return { translations, method: 'client' };
};

export default {
  translateText,
  translateMessages,
  translateWithFallback,
}; 