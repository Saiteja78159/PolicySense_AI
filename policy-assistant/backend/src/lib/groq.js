import Groq from 'groq-sdk';
import { config } from '../config.js';

export const groq = new Groq({ apiKey: config.groq.apiKey });

export async function createChatCompletion(messages, options = {}) {
  const res = await groq.chat.completions.create({
    model: config.groq.chatModel,
    messages,
    max_tokens: options.maxTokens ?? options.max_tokens ?? 1024,
    temperature: options.temperature ?? 0.2,
  });
  return res.choices[0]?.message?.content ?? '';
}
