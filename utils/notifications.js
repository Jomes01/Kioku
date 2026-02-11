/**
 * Expo Notifications - local smart reminders
 * Schedules same-day, 1-day-before, and 1-week-before reminders per event.
 * All reminders at 5:00 AM. Yearly recurrence handled by rescheduling on app launch.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { hasAnyReminder } from './storage';
import { updateEventNotificationIds } from './storage';

// Default time for all reminder types (5:00 AM)
const REMINDER_HOUR = 5;
const REMINDER_MINUTE = 0;

// Configure how notifications are shown when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions (required for Android 13+)
 */
export async function requestPermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Build notification identifier for a reminder type (used to cancel later)
 */
function reminderIdentifier(eventId, kind) {
  return `kioku-${eventId}-${kind}`;
}

/**
 * Check if event type is recurring (birthday, anniversary → repeat yearly)
 */
function isRecurringEvent(type) {
  return type === 'Birthday' || type === 'Anniversary';
}

/**
 * If triggerDate is in the past, advance to next year (for recurring events)
 */
function toNextOccurrenceIfPast(triggerDate, recurring) {
  const now = new Date();
  if (triggerDate > now) return triggerDate;
  if (recurring) {
    const next = new Date(triggerDate);
    next.setFullYear(next.getFullYear() + 1);
    return next;
  }
  return null;
}

/**
 * Schedule one notification. Returns identifier or null if not scheduled (e.g. in past).
 */
async function scheduleOne(content, triggerDate, identifier) {
  const now = new Date();
  if (triggerDate <= now) return null;

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      ...content,
      data: content.data || {},
    },
    trigger: {
      date: triggerDate,
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      channelId: 'reminders',
    },
  });
  return identifier;
}

/**
 * Schedule all enabled smart reminders for an event.
 * Same day → event date at 5:00 AM
 * 1 day before → event date − 1 day at 5:00 AM
 * 1 week before → event date − 7 days at 5:00 AM
 * Skips past dates. For recurring events, uses next year when date has passed.
 *
 * @param {Object} event - Event with id, title, type, reminders, notificationIds
 * @param {string} dateStr - YYYY-MM-DD event date
 * @returns {Promise<string[]>} Identifiers of scheduled notifications
 */
export async function scheduleSmartReminders(event, dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const reminders = event.reminders || {};
  const recurring = isRecurringEvent(event.type || 'Other');
  const bodySuffix = `${event.type || 'Other'} - ${formatDateDisplay(dateStr)}`;
  const scheduled = [];

  // Same day: event date at 5:00 AM
  if (reminders.sameDay) {
    const triggerDate = new Date(year, month - 1, day, REMINDER_HOUR, REMINDER_MINUTE, 0);
    const when = toNextOccurrenceIfPast(triggerDate, recurring);
    if (when) {
      const id = reminderIdentifier(event.id, 'sameDay');
      await scheduleOne(
        {
          title: `🎂 Today: ${event.title}`,
          body: bodySuffix,
          data: { eventId: event.id, date: dateStr },
        },
        when,
        id
      );
      scheduled.push(id);
    }
  }

  // 1 day before: event date − 1 day at 5:00 AM
  if (reminders.oneDayBefore) {
    const d = new Date(year, month - 1, day, REMINDER_HOUR, REMINDER_MINUTE, 0);
    d.setDate(d.getDate() - 1);
    const when = toNextOccurrenceIfPast(d, recurring);
    if (when) {
      const id = reminderIdentifier(event.id, 'oneDayBefore');
      await scheduleOne(
        {
          title: `⏰ Tomorrow: ${event.title}`,
          body: bodySuffix,
          data: { eventId: event.id, date: dateStr },
        },
        when,
        id
      );
      scheduled.push(id);
    }
  }

  // 1 week before: event date − 7 days at 5:00 AM
  if (reminders.oneWeekBefore) {
    const d = new Date(year, month - 1, day, REMINDER_HOUR, REMINDER_MINUTE, 0);
    d.setDate(d.getDate() - 7);
    const when = toNextOccurrenceIfPast(d, recurring);
    if (when) {
      const id = reminderIdentifier(event.id, 'oneWeekBefore');
      await scheduleOne(
        {
          title: `📅 In 1 week: ${event.title}`,
          body: bodySuffix,
          data: { eventId: event.id, date: dateStr },
        },
        when,
        id
      );
      scheduled.push(id);
    }
  }

  return scheduled;
}

/**
 * Cancel all reminders for an event (by stored notificationIds and by kioku- prefix)
 */
export async function cancelReminder(event) {
  const ids = event?.notificationIds || [];
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (_) {
      // ignore
    }
  }
  // Also cancel by known identifiers in case IDs weren't stored
  const eventId = event?.id;
  if (eventId) {
    for (const kind of ['sameDay', 'oneDayBefore', 'oneWeekBefore']) {
      try {
        await Notifications.cancelScheduledNotificationAsync(reminderIdentifier(eventId, kind));
      } catch (_) {
        // ignore
      }
    }
  }
}

/**
 * Reschedule all reminders from events. Call on app launch.
 * Cancels existing Kioku notifications, then schedules from storage and updates notificationIds.
 */
export async function rescheduleAllReminders(events) {
  // Cancel all existing Kioku reminders
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier && n.identifier.startsWith('kioku-')) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  const flat = [];
  Object.keys(events).forEach((date) => {
    (events[date] || []).forEach((event) => {
      flat.push({ date, ...event });
    });
  });

  for (const item of flat) {
    if (!hasAnyReminder(item)) continue;

    const notificationIds = await scheduleSmartReminders(item, item.date);
    await updateEventNotificationIds(item.date, item.id, notificationIds);
  }
}

/**
 * Create notification channel for Android
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Event Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: true,
    });
  }
}

function formatDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}
