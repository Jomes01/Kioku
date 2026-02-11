/**
 * DateRow - Single date row in the date-list view (replaces time slots with dates)
 * Left: date label (day name + number). Right: event slot bar(s)
 */

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, spacing, typography, fontFamily, eventTypeColors } from '../styles/theme';
import { buildEventSummary } from '../utils/eventSummary';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DateRow({
  dateStr,
  dayNumber,
  dayName,
  isSelected,
  isToday,
  events = [],
  onPress,
}) {
  const hasEvents = events && events.length > 0;
  const summary = buildEventSummary(events);
  const primaryDotColor = hasEvents ? eventTypeColors[events[0].type] || colors.primary : colors.border;

  return (
    <TouchableOpacity
      style={[styles.row, isSelected && styles.rowSelected]}
      onPress={() => onPress(dateStr)}
      activeOpacity={0.7}
    >
      <View style={styles.dateColumn}>
        <Text style={styles.dayName}>{dayName}</Text>
        <View style={[styles.dateCircle, isSelected && styles.dateCircleSelected, isToday && !isSelected && styles.dateCircleToday]}>
          <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected, isToday && !isSelected && styles.dateNumberToday]}>
            {dayNumber}
          </Text>
        </View>
      </View>
      <View style={styles.summaryColumn}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryDot, { backgroundColor: primaryDotColor }]} />
          <Text
            style={[styles.summaryText, !hasEvents && styles.summaryTextEmpty]}
            numberOfLines={2}
          >
            {summary}
          </Text>
        </View>
        {hasEvents && (
          <View style={styles.tagRow}>
            {events.slice(0, 3).map((event) => (
              <View
                key={event.id}
                style={[styles.tag, { backgroundColor: (eventTypeColors[event.type] || colors.cardElevated) }]}
              >
                <Text style={styles.tagText}>
                  {event.type || 'Event'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    minHeight: 56,
  },
  rowSelected: {
    backgroundColor: colors.primaryMuted,
  },
  dateColumn: {
    width: 56,
    alignItems: 'center',
    paddingLeft: spacing.sm,
  },
  dayName: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
    fontFamily,
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dateCircleSelected: {
    backgroundColor: colors.primary,
  },
  dateCircleToday: {
    backgroundColor: colors.todayBg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dateNumber: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.text,
    fontFamily,
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  dateNumberToday: {
    color: colors.primary,
  },
  summaryColumn: {
    flex: 1,
    marginLeft: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 2,
  },
  summaryText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily,
  },
  summaryTextEmpty: {
    color: colors.muted,
    fontWeight: '500',
    fontFamily,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: typography.small,
    fontWeight: '600',
    textTransform: 'capitalize',
    fontFamily,
  },
});
