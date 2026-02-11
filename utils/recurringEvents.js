export const YEARLY_RECURRING_TYPES = ['Birthday', 'Anniversary', 'Death Anniversary'];

export function isRecurringEvent(event) {
  if (!event) return false;
  return YEARLY_RECURRING_TYPES.includes(event.type);
}

export function buildRecurringIndex(eventsByDate = {}) {
  const index = {};
  Object.keys(eventsByDate).forEach((dateKey) => {
    const [, month, day] = dateKey.split('-');
    if (!month || !day) return;
    const mapKey = `${month}-${day}`;
    const events = eventsByDate[dateKey] || [];
    events.forEach((event) => {
      if (!isRecurringEvent(event)) return;
      if (!index[mapKey]) index[mapKey] = [];
      index[mapKey].push({
        ...event,
        sourceDate: event.sourceDate || dateKey,
        originalId: event.originalId || event.id,
      });
    });
  });
  return index;
}

export function getEventsForDate(eventsByDate = {}, dateKey, recurringIndex = null) {
  if (!dateKey) return [];
  const baseEvents = (eventsByDate[dateKey] || []).map((event) => ({
    ...event,
    sourceDate: event.sourceDate || dateKey,
    occurrenceDate: dateKey,
    originalId: event.originalId || event.id,
    isRecurringInstance: false,
    id: event.id,
    date: dateKey,
  }));

  const mdKey = dateKey.slice(5);
  const recurringMap = recurringIndex || buildRecurringIndex(eventsByDate);
  const recurringPool = recurringMap[mdKey] || [];
  const existingIds = new Set(baseEvents.map((event) => event.originalId));

  const recurringInstances = recurringPool
    .filter((event) => event.sourceDate !== dateKey)
    .filter((event) => !existingIds.has(event.originalId || event.id))
    .map((event) => {
      const originalId = event.originalId || event.id;
      return {
        ...event,
        id: `${originalId}::${dateKey}`,
        originalId,
        sourceDate: event.sourceDate,
        date: dateKey,
        occurrenceDate: dateKey,
        isRecurringInstance: true,
      };
    });

  return [...baseEvents, ...recurringInstances];
}
