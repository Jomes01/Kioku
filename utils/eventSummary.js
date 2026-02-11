export function buildEventSummary(events = [], { maxItems = 2, emptyLabel = 'Not a Special Day' } = {}) {
  if (!Array.isArray(events) || events.length === 0) {
    return emptyLabel;
  }

  const names = events
    .map((event) => {
      if (!event) return null;
      const title = typeof event.title === 'string' ? event.title.trim() : '';
      if (title) return title;
      const type = typeof event.type === 'string' ? event.type.trim() : '';
      return type || null;
    })
    .filter(Boolean);

  if (names.length === 0) {
    return emptyLabel;
  }

  const displayed = names.slice(0, maxItems);
  const remaining = names.length - displayed.length;
  return remaining > 0 ? `${displayed.join(' • ')} +${remaining}` : displayed.join(' • ');
}
