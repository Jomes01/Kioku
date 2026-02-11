/**
 * Search utilities for event lookup
 * Matches title, type, description, and date with tokenized queries
 */

import { getAllEventsFlat } from './storage';

const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTH_ABBR = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * Build searchable text from an event (title, type, description, date)
 */
function getSearchableText(event) {
  const parts = [
    event.title || '',
    event.type || '',
    event.description || '',
    event.date || '',
  ];
  const text = parts.join(' ').toLowerCase();
  const dateDigits = (event.date || '').replace(/\D/g, '');
  return { text, dateDigits };
}

/**
 * Parse query into tokens (words)
 */
function tokenizeQuery(q) {
  const trimmed = q.trim().toLowerCase();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).filter(Boolean);
}

/**
 * Check if event matches a single token
 */
function tokenMatchesEvent(token, event, searchable) {
  const { text, dateDigits } = searchable;
  if (text.includes(token)) return true;
  const tokenDigits = token.replace(/\D/g, '');
  if (tokenDigits.length >= 1 && dateDigits && dateDigits.includes(tokenDigits)) return true;
  const monthIdx = MONTH_NAMES.findIndex((m) => m.startsWith(token) || token.startsWith(m));
  if (monthIdx >= 0 && event.date) {
    const [, month] = (event.date || '').split('-');
    if (month && parseInt(month, 10) === monthIdx + 1) return true;
  }
  const abbrIdx = MONTH_ABBR.findIndex((m) => m.startsWith(token) || token.startsWith(m));
  if (abbrIdx >= 0 && event.date) {
    const [, month] = (event.date || '').split('-');
    if (month && parseInt(month, 10) === abbrIdx + 1) return true;
  }
  return false;
}

/**
 * Compute relevance score for ranking (higher = better match)
 */
function getRelevanceScore(event, q, tokens, searchable) {
  const { text } = searchable;
  const qLower = q.toLowerCase();
  let score = 0;
  if (event.title && event.title.toLowerCase() === qLower) score += 100;
  else if (event.title && event.title.toLowerCase().includes(qLower)) score += 50;
  else if (event.title && tokens.every((t) => event.title.toLowerCase().includes(t))) score += 30;
  if (event.type && event.type.toLowerCase().includes(qLower)) score += 25;
  else if (event.type && tokens.every((t) => event.type.toLowerCase().includes(t))) score += 15;
  if (event.description && event.description.toLowerCase().includes(qLower)) score += 20;
  else if (event.description && tokens.every((t) => event.description.toLowerCase().includes(t))) score += 10;
  if (event.date && event.date.includes(q.replace(/\D/g, ''))) score += 40;
  else if (event.date && tokens.some((t) => (event.date || '').includes(t))) score += 5;
  return score;
}

/**
 * Search events by query
 * @param {Object} events - Events object from storage
 * @param {string} query - Search query
 * @returns {Array} Sorted, deduplicated results
 */
export function searchEvents(events, query) {
  const q = (query || '').trim();
  if (!q) return [];

  const flat = getAllEventsFlat(events);
  const tokens = tokenizeQuery(q);
  const qLower = q.toLowerCase();
  const qDigits = q.replace(/\D/g, '');

  const matched = flat.filter((e) => {
    const searchable = getSearchableText(e);
    if (tokens.length > 0) {
      const allTokensMatch = tokens.every((t) => tokenMatchesEvent(t, e, searchable));
      if (allTokensMatch) return true;
    }
    if (searchable.text.includes(qLower)) return true;
    if (qDigits.length >= 1 && searchable.dateDigits.includes(qDigits)) return true;
    return false;
  });

  const scored = matched.map((e) => ({
    event: e,
    score: getRelevanceScore(e, q, tokens, getSearchableText(e)),
  }));
  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.event);
}
