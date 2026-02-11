/**
 * DayCell - Single date cell in calendar grid
 * Shows date number and colored dots for events
 */

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, spacing, typography, eventTypeColors } from '../styles/theme';

export default function DayCell({
  date,
  dayNumber,
  isCurrentMonth,
  isToday,
  events = [],
  onPress,
}) {
  const hasEvents = events && events.length > 0;

  return (
    <TouchableOpacity
      style={[
        styles.cell,
        !isCurrentMonth && styles.otherMonth,
      ]}
      onPress={() => onPress(date, dayNumber)}
      activeOpacity={0.7}
    >
      <View style={[styles.dayNumber, isToday && styles.todayCircle]}>
        <Text
          style={[
            styles.dayText,
            !isCurrentMonth && styles.otherMonthText,
            isToday && styles.todayText,
          ]}
        >
          {dayNumber}
        </Text>
      </View>
      {hasEvents && (
        <View style={styles.dots}>
          {events.slice(0, 4).map((e) => (
            <View
              key={e.id}
              style={[
                styles.dot,
                { backgroundColor: eventTypeColors[e.type] || colors.other },
              ]}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  otherMonth: {
    opacity: 0.4,
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: colors.today,
  },
  dayText: {
    fontSize: typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  todayText: {
    color: '#FFFFFF',
  },
  otherMonthText: {
    color: colors.muted,
  },
  dots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 3,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
