import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Dimensions, View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, PanResponder, Animated, Vibration } from 'react-native';
import { colors, spacing, typography, fontFamily, eventTypeColors, shadows } from '../styles/theme';
import { getEventsForDate } from '../utils/recurringEvents';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAX_SHEET_HEIGHT = Dimensions.get('window').height * 0.6;
const SWIPE_THRESHOLD = 40;
const MAX_DRAG = 100;
const TRANSITION_DISTANCE = 80;

function parseDateString(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toDateId(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatMonthYear(date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function buildMonthMatrix(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = 42; // 6 weeks * 7 days
  const cells = [];

  for (let idx = 0; idx < totalCells; idx += 1) {
    const dayNumber = idx - firstDay + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push(null);
      continue;
    }

    cells.push({
      dayNumber,
      date: new Date(year, month, dayNumber),
    });
  }

  const weeks = [];
  for (let w = 0; w < 6; w += 1) {
    weeks.push(cells.slice(w * 7, w * 7 + 7));
  }
  return weeks;
}

function buildDots(eventsForDay) {
  if (!eventsForDay?.length) return [];
  const dots = [];
  eventsForDay.forEach((event) => {
    const dotColor = eventTypeColors[event.type] || colors.primary;
    if (!dots.includes(dotColor)) {
      dots.push(dotColor);
    }
  });
  return dots.slice(0, 3);
}

function getMonthEvents(events, year, month, recurringIndex) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const items = [];

  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = getEventsForDate(events, dateStr, recurringIndex);
    const dateLabel = `${MONTH_ABBR[month]} ${d}`;

    dayEvents.forEach((event) => {
      items.push({
        dateStr,
        dateLabel,
        title: event.title || 'Untitled',
        type: event.type || 'Other',
        color: eventTypeColors[event.type] || colors.primary,
      });
    });
  }

  return items;
}

export default function MonthCalendarModal({
  visible,
  onClose,
  onSelectDate,
  selectedDate,
  events = {},
  recurringIndex,
  topOffset = 0,
}) {
  const selectedDateObj = useMemo(() => parseDateString(selectedDate) || new Date(), [selectedDate]);
  const [displayDate, setDisplayDate] = useState(selectedDateObj);
  const swipeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setDisplayDate(selectedDateObj);
      swipeX.setValue(0);
    }
  }, [visible, selectedDateObj, swipeX]);

  const weeks = useMemo(() => buildMonthMatrix(displayDate), [displayDate]);
  const todayId = toDateId(new Date());

  const monthEvents = useMemo(
    () =>
      getMonthEvents(events, displayDate.getFullYear(), displayDate.getMonth(), recurringIndex),
    [events, displayDate, recurringIndex]
  );

  const handleDayPress = (day) => {
    if (!day) return;
    const dateStr = toDateId(day.date);
    if (onSelectDate) onSelectDate(dateStr);
  };

  const goPrevMonth = useCallback(() => {
    setDisplayDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setDisplayDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  }, []);

  const swipeXClamped = useMemo(
    () =>
      swipeX.interpolate({
        inputRange: [-999, -MAX_DRAG, 0, MAX_DRAG, 999],
        outputRange: [-999, -MAX_DRAG, 0, MAX_DRAG, 999],
        extrapolate: 'clamp',
      }),
    [swipeX]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const { dx, dy } = gestureState;
          return Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy);
        },
        onPanResponderGrant: () => {
          swipeX.setValue(0);
        },
        onPanResponderMove: (_, gestureState) => {
          const clamped = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, gestureState.dx));
          swipeX.setValue(clamped);
        },
        onPanResponderRelease: (_, gestureState) => {
          const dx = gestureState.dx;
          if (dx > SWIPE_THRESHOLD) {
            Animated.timing(swipeX, {
              toValue: TRANSITION_DISTANCE,
              duration: 120,
              useNativeDriver: true,
            }).start(() => {
              Vibration.vibrate(15);
              goPrevMonth();
              swipeX.setValue(-TRANSITION_DISTANCE);
              Animated.timing(swipeX, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
              }).start();
            });
          } else if (dx < -SWIPE_THRESHOLD) {
            Animated.timing(swipeX, {
              toValue: -TRANSITION_DISTANCE,
              duration: 120,
              useNativeDriver: true,
            }).start(() => {
              Vibration.vibrate(15);
              goNextMonth();
              swipeX.setValue(TRANSITION_DISTANCE);
              Animated.timing(swipeX, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
              }).start();
            });
          } else {
            Animated.spring(swipeX, {
              toValue: 0,
              useNativeDriver: true,
              damping: 25,
              stiffness: 350,
            }).start();
          }
        },
      }),
    [goPrevMonth, goNextMonth, swipeX]
  );

  const goToday = () => {
    const today = new Date();
    setDisplayDate(today);
    if (onSelectDate) onSelectDate(toDateId(today));
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: topOffset }]}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet} {...panResponder.panHandlers}>
        <View style={styles.sheetHandle} />

        <Animated.View style={[styles.sheetContent, { transform: [{ translateX: swipeXClamped }] }]}>
        <View style={styles.sheetHeader}>
          <TouchableOpacity style={styles.navBtn} onPress={goPrevMonth}>
            <Text style={styles.navText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{formatMonthYear(displayDate)}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={goNextMonth}>
            <Text style={styles.navText}>›</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.dayNameRow}>
          {DAY_NAMES.map((day) => (
            <Text key={day} style={styles.dayNameText}>
              {day}
            </Text>
          ))}
        </View>

        {weeks.map((week, idx) => (
          <View key={`week-${idx}`} style={styles.weekRow}>
            {week.map((day, dayIdx) => {
              if (!day) {
                return <View key={`empty-${idx}-${dayIdx}`} style={styles.dayCellEmpty} />;
              }

              const dateStr = toDateId(day.date);
              const eventsForDay = getEventsForDate(events, dateStr, recurringIndex);
              const dots = buildDots(eventsForDay);
              const isSelected = selectedDate === dateStr;
              const isToday = todayId === dateStr;

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.dayCell,
                    isToday && styles.dayCellToday,
                    isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayCellText,
                      isSelected && styles.dayCellTextSelected,
                    ]}
                  >
                    {day.dayNumber}
                  </Text>
                  {dots.length > 0 && (
                    <View style={styles.dotRow}>
                      {dots.map((color, dotIdx) => (
                        <View
                          key={`${dateStr}-dot-${dotIdx}`}
                          style={[styles.dot, { backgroundColor: color }]}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={styles.monthEventsSection}>
            {monthEvents.length === 0 ? (
              <Text style={styles.monthEventsEmpty}>No events this month</Text>
            ) : (
              monthEvents.map((item, idx) => (
                <TouchableOpacity
                  key={`${item.dateStr}-${item.title}-${idx}`}
                  style={styles.monthEventRow}
                  onPress={() => {
                    const [y, m, d] = item.dateStr.split('-').map(Number);
                    handleDayPress({ date: new Date(y, m - 1, d) });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.monthEventDot, { backgroundColor: item.color }]} />
                  <Text style={styles.monthEventText}>
                    {item.dateLabel} - {item.title} ({item.type})
                  </Text>
                </TouchableOpacity>
              ))
            )}
        </View>
        </ScrollView>
        </Animated.View>

        <View style={styles.sheetFooter}>
          <TouchableOpacity style={styles.footerBtn} onPress={goToday}>
            <Text style={styles.footerBtnText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.footerBtn, styles.footerCloseBtn]} onPress={onClose}>
            <Text style={styles.footerBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: '100%',
    flex: 1,
    maxHeight: MAX_SHEET_HEIGHT,
    backgroundColor: colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    overflow: 'hidden',
    ...shadows.card,
  },
  sheetContent: {
    flex: 1,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.text,
    fontFamily,
  },
  navBtn: {
    padding: spacing.xs,
  },
  navText: {
    fontSize: 22,
    color: colors.text,
    fontFamily,
  },
  sheetScroll: {
    flex: 1,
    minHeight: 0,
  },
  sheetScrollContent: {
    paddingBottom: spacing.xl,
  },
  dayNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dayNameText: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.small,
    color: colors.muted,
    textTransform: 'uppercase',
    fontFamily,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayCellEmpty: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 2,
  },
  dayCellToday: {
    borderColor: colors.primary,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayCellText: {
    fontSize: typography.body,
    color: colors.text,
    fontWeight: '700',
    fontFamily,
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
  },
  dotRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  monthEventsSection: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  monthEventsEmpty: {
    fontSize: typography.small,
    color: colors.muted,
    textAlign: 'center',
    fontFamily,
  },
  monthEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  monthEventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  monthEventText: {
    flex: 1,
    fontSize: typography.body,
    color: colors.text,
    fontFamily,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  footerBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerCloseBtn: {
    backgroundColor: colors.cardElevated,
    marginLeft: spacing.sm,
  },
  footerBtnText: {
    color: colors.text,
    fontWeight: '600',
    fontFamily,
  },
});
