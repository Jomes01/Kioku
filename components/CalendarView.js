/**
 * CalendarView - Modern date-list layout (dates instead of time slots)
 * Header: month selector, search, today. Left: selected date. Main: list of dates with event slots.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  PanResponder,
  Image,
  BackHandler,
  Platform,
} from 'react-native';
import { colors, spacing, typography, fontFamily, eventTypeColors } from '../styles/theme';
import { buildEventSummary } from '../utils/eventSummary';
import { getEventsForDate } from '../utils/recurringEvents';
import DateRow from './DateRow';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SWIPE_THRESHOLD = 40;

function getDaysInMonth(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= last.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, month, d);
    days.push({
      dateStr,
      dayNumber: d,
      dayName: DAY_NAMES[dateObj.getDay()],
    });
  }
  return days;
}

export default function CalendarView({
  currentDate,
  events,
  recurringIndex,
  onDayPress,
  onMenuPress,
  onSearchPress,
  onCalendarPress,
  selectedDate,
  onHeaderLayout,
}) {
  const [displayDate, setDisplayDate] = useState(currentDate);
  const todayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const activeDate = selectedDate || todayStr;

  const goPrev = useCallback(() => {
    setDisplayDate((d) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  }, []);

  const goNext = useCallback(() => {
    setDisplayDate((d) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  }, []);

  const goToday = useCallback(() => {
    setDisplayDate(new Date());
    if (onDayPress) onDayPress(todayStr);
  }, [onDayPress, todayStr]);

  const isViewingDifferentMonth =
    displayDate.getMonth() !== currentDate.getMonth() ||
    displayDate.getFullYear() !== currentDate.getFullYear();

  useEffect(() => {
    if (!isViewingDifferentMonth || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goToday();
      return true;
    });
    return () => sub.remove();
  }, [isViewingDifferentMonth, goToday]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const { dx, dy } = gestureState;
          return Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > SWIPE_THRESHOLD) {
            goPrev();
          } else if (gestureState.dx < -SWIPE_THRESHOLD) {
            goNext();
          }
        },
      }),
    [goNext, goPrev]
  );

  const days = getDaysInMonth(displayDate.getFullYear(), displayDate.getMonth());

  // Selected date display (e.g. "Sat" and "7" in circle) - parse activeDate
  const [selYear, selMonth, selDay] = (activeDate || '').split('-').map(Number);
  const selDateObj = selYear && selMonth && selDay ? new Date(selYear, selMonth - 1, selDay) : new Date();
  const selectedDayName = DAY_NAMES[selDateObj.getDay()];
  const selectedDayNum = selDateObj.getDate();
  const selectedEvents = getEventsForDate(events, activeDate, recurringIndex);
  const selectedSummary = buildEventSummary(selectedEvents, { maxItems: 99 });
  const hasSelectedEvents = selectedEvents.length > 0;
  const selectedSummaryDot = hasSelectedEvents
    ? eventTypeColors[selectedEvents[0].type] || colors.primary
    : colors.border;

  return (
    <View style={styles.container}>
      {/* Header: menu, month selector, search, today, check, avatar */}
      <View
        style={styles.header}
        onLayout={(event) => {
          onHeaderLayout?.(event.nativeEvent.layout.height);
        }}
      >
        <TouchableOpacity style={styles.logoBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={onMenuPress}>
          <Image source={require('../Kioku_Logo.png')} style={styles.headerLogo} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.appTitle}>Kioku</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={onSearchPress}>
            <Text style={styles.iconText}>⌕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, styles.calendarBtn]} onPress={onCalendarPress || goToday}>
            <Text style={styles.calendarIcon}>📅</Text>
            <View style={styles.calendarLabel}>
              <Text style={styles.calendarMonth}>{MONTHS[currentDate.getMonth()].slice(0, 3)}</Text>
              <Text style={styles.calendarDay}>{currentDate.getDate()}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body} {...panResponder.panHandlers}>
        {/* Left: month/year selector and selected date indicator */}
        <View style={styles.leftDateStrip}>
          <View style={styles.monthYearBlock}>
            <Text style={styles.monthText}>{MONTHS[displayDate.getMonth()]}</Text>
            <Text style={styles.yearText}>{displayDate.getFullYear()}</Text>
            <View style={styles.monthNavRow}>
              <TouchableOpacity onPress={goPrev} style={styles.monthNavBtn}>
                <Text style={styles.navBtnText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={goNext} style={styles.monthNavBtn}>
                <Text style={styles.navBtnText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.leftDateHeader}>
            <Text style={styles.leftDayName}>{selectedDayName}</Text>
            <View style={styles.leftDateCircle}>
              <Text style={styles.leftDateNum}>{selectedDayNum}</Text>
            </View>
          </View>
          <View style={styles.leftSummaryRow}>
            <View style={[styles.leftSummaryDot, { backgroundColor: selectedSummaryDot }]} />
            <Text
              style={[styles.leftSummaryText, !hasSelectedEvents && styles.leftSummaryTextEmpty]}
            >
              {selectedSummary}
            </Text>
          </View>
        </View>

        {/* Main: date rows (dates instead of times) */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {days.map(({ dateStr, dayNumber, dayName }) => {
            const dayEvents = getEventsForDate(events, dateStr, recurringIndex);
            const isSelected = dateStr === activeDate;
            const isToday = dateStr === todayStr;
            return (
              <DateRow
                key={dateStr}
                dateStr={dateStr}
                dayNumber={dayNumber}
                dayName={dayName}
                isSelected={isSelected}
                isToday={isToday}
                events={dayEvents}
                onPress={onDayPress}
              />
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconBtn: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  logoBtn: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  headerLogo: {
    width: 28,
    height: 28,
  },
  iconText: {
    fontSize: 20,
    color: colors.text,
    fontFamily,
  },
  calendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  calendarIcon: {
    fontSize: 18,
  },
  calendarLabel: {
    alignItems: 'flex-start',
  },
  calendarMonth: {
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    fontFamily,
  },
  calendarDay: {
    fontSize: typography.body,
    color: colors.text,
    fontWeight: '700',
    lineHeight: 16,
    fontFamily,
  },
  appTitle: {
    flex: 1,
    fontSize: typography.title,
    color: colors.text,
    fontFamily,
    textTransform: 'uppercase',
  },
  chevron: {
    fontSize: 10,
    color: colors.muted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  leftDateStrip: {
    width: 160,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  monthYearBlock: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
  },
  monthText: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.primary,
    fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  yearText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.muted,
    fontFamily,
    marginTop: 2,
    textAlign: 'center',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  leftDateHeader: {
    alignItems: 'center',
  },
  leftDayName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily,
    textAlign: 'center',
  },
  leftDateCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftDateNum: {
    fontSize: typography.subtitle + 6,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily,
  },
  leftSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  leftSummaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  leftSummaryText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    fontFamily,
  },
  leftSummaryTextEmpty: {
    color: colors.muted,
    fontWeight: '500',
    fontFamily,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  navBtnText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '600',
    fontFamily,
  },
});
