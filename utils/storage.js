/**
 * AsyncStorage helpers for persisting events
 * Structure: { "YYYY-MM-DD": [ { id, title, type, description, reminders, notificationIds } ] }
 * reminders: { sameDay: bool, oneDayBefore: bool, oneWeekBefore: bool }
 * notificationIds: string[] - identifiers for scheduled notifications (for cancel/update)
 */

/** Default reminder options when creating new event */
export const DEFAULT_REMINDERS = {
  sameDay: true,
  oneDayBefore: true,
  oneWeekBefore: false,
};

/**
 * Normalize event from storage (support legacy reminder/reminderTime)
 * @param {Object} event - Raw event from storage
 * @returns {Object} Event with reminders and notificationIds
 */
export function normalizeEvent(event) {
  const reminders =
    event.reminders && typeof event.reminders === 'object'
      ? {
          sameDay: !!event.reminders.sameDay,
          oneDayBefore: !!event.reminders.oneDayBefore,
          oneWeekBefore: !!event.reminders.oneWeekBefore,
        }
      : {
          ...DEFAULT_REMINDERS,
          sameDay: event.reminder !== false,
          oneDayBefore: false,
          oneWeekBefore: false,
        };
  return {
    ...event,
    reminders,
    notificationIds: Array.isArray(event.notificationIds) ? event.notificationIds : [],
  };
}

/** True if event has at least one reminder enabled */
export function hasAnyReminder(event) {
  const r = event.reminders || {};
  return !!(r.sameDay || r.oneDayBefore || r.oneWeekBefore);
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@kioku_events';

/**
 * Load all events from AsyncStorage
 * @returns {Promise<Object>} Object with date keys and event arrays
 */
export async function loadEvents() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return {};
    const parsed = JSON.parse(data);
    // Normalize all events to new shape (reminders + notificationIds)
    const out = {};
    Object.keys(parsed).forEach((date) => {
      out[date] = (parsed[date] || []).map(normalizeEvent);
    });
    return out;
  } catch (error) {
    console.warn('Storage load error:', error);
    return {};
  }
}

/**
 * Save all events to AsyncStorage
 * @param {Object} events - Events object keyed by date
 */
export async function saveEvents(events) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.warn('Storage save error:', error);
    throw error;
  }
}

/**
 * Add or update an event
 * @param {string} date - YYYY-MM-DD format
 * @param {Object} event - Event object
 * @param {string} [existingId] - If editing, the existing event id
 * @returns {Promise<{events: Object, createdEvent: Object}>} Updated events and the created/updated event
 */
export async function upsertEvent(date, event, existingId = null) {
  const events = await loadEvents();
  const dateKey = String(date);
  let createdEvent = null;

  if (existingId) {
    for (const key of Object.keys(events)) {
      const list = events[key] || [];
      const idx = list.findIndex((e) => e.id === existingId);
      if (idx >= 0) {
        const existing = list[idx];
        list.splice(idx, 1);
        if (list.length === 0) delete events[key];
        else events[key] = list;
        createdEvent = normalizeEvent({ ...existing, ...event, id: existingId });
        break;
      }
    }
  }

  const dateEvents = events[dateKey] || [];
  if (createdEvent) {
    dateEvents.push(createdEvent);
  } else {
    const id = event.id || generateId();
    createdEvent = normalizeEvent({ ...event, id });
    dateEvents.push(createdEvent);
  }
  events[dateKey] = dateEvents;
  await saveEvents(events);
  return { events, createdEvent };
}

/**
 * Update notification IDs for an event (after scheduling)
 * @param {string} date - YYYY-MM-DD format
 * @param {string} eventId - Event id
 * @param {string[]} notificationIds - Identifiers of scheduled notifications
 * @returns {Promise<Object>} Updated events object
 */
export async function updateEventNotificationIds(date, eventId, notificationIds) {
  const events = await loadEvents();
  const dateKey = String(date);
  const dateEvents = events[dateKey] || [];
  const index = dateEvents.findIndex((e) => e.id === eventId);
  if (index >= 0) {
    dateEvents[index] = { ...dateEvents[index], notificationIds: notificationIds || [] };
    events[dateKey] = dateEvents;
    await saveEvents(events);
  }
  return events;
}

/**
 * Delete an event by id
 * @param {string} date - YYYY-MM-DD format
 * @param {string} eventId - Event id to delete
 * @returns {Promise<Object>} Updated events object
 */
export async function deleteEvent(date, eventId) {
  const events = await loadEvents();
  const dateKey = String(date);
  const dateEvents = (events[dateKey] || []).filter((e) => e.id !== eventId);

  if (dateEvents.length === 0) {
    delete events[dateKey];
  } else {
    events[dateKey] = dateEvents;
  }

  await saveEvents(events);
  return events;
}

/**
 * Get all events as a flat list for search
 * @param {Object} events - Events object from loadEvents
 * @returns {Array} Array of { date, ...event }
 */
export function getAllEventsFlat(events) {
  const flat = [];
  Object.keys(events).forEach((date) => {
    (events[date] || []).forEach((event) => {
      flat.push({ date, ...event });
    });
  });
  return flat;
}

/**
 * Generate a simple unique id
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
