/**
 * EventModal - Add or edit event form
 * Fields: Name, Type, Description, Smart Reminders (same day, 1 day before, 1 week before)
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import { colors, spacing, typography, fontFamily, EVENT_TYPES } from '../styles/theme';
import { DEFAULT_REMINDERS } from '../utils/storage';
import MonthCalendarModal from './MonthCalendarModal';

function formatDateDisplay(dateStr) {
  if (!dateStr) return 'Select Date';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EventModal({
  visible,
  onClose,
  onSubmit,
  initialDate,
  initialType = null,
  editEvent = null,
  events = {},
  recurringIndex,
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Other');
  const [description, setDescription] = useState('');
  const [sameDay, setSameDay] = useState(DEFAULT_REMINDERS.sameDay);
  const [oneDayBefore, setOneDayBefore] = useState(DEFAULT_REMINDERS.oneDayBefore);
  const [oneWeekBefore, setOneWeekBefore] = useState(DEFAULT_REMINDERS.oneWeekBefore);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title);
      setType(editEvent.type || 'Other');
      setDescription(editEvent.description || '');
      setSelectedDate(editEvent.date || initialDate);
      const r = editEvent.reminders || {};
      setSameDay(r.sameDay !== false && (r.sameDay === true || editEvent.reminder !== false));
      setOneDayBefore(!!r.oneDayBefore);
      setOneWeekBefore(!!r.oneWeekBefore);
    } else {
      setTitle('');
      setType(initialType || 'Other');
      setDescription('');
      setSelectedDate(initialDate);
      setSameDay(DEFAULT_REMINDERS.sameDay);
      setOneDayBefore(DEFAULT_REMINDERS.oneDayBefore);
      setOneWeekBefore(DEFAULT_REMINDERS.oneWeekBefore);
    }
    setSubmitError('');
  }, [editEvent, initialDate, initialType, visible]);

  const hasAnyReminder = sameDay || oneDayBefore || oneWeekBefore;

  const handleSubmit = () => {
    const trimmed = title.trim();
    setSubmitError('');
    if (!trimmed) {
      setSubmitError('Event name is required');
      return;
    }
    if (!selectedDate) {
      setSubmitError('Please select a date');
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/09642b9c-fbe8-4d0b-a90f-5edd784313a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventModal.js:handleSubmit',message:'onSubmit called, onClose next',data:{isEdit:!!editEvent?.id},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    onSubmit({
      title: trimmed,
      type,
      description: description.trim(),
      reminders: {
        sameDay,
        oneDayBefore,
        oneWeekBefore,
      },
      date: selectedDate || initialDate,
      id: editEvent?.id,
    });
    onClose();
  };

  const handleRequestClose = () => {
    if (datePickerVisible) {
      setDatePickerVisible(false);
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleRequestClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {editEvent ? 'Edit Event' : 'Add Event'}
            </Text>
            <TouchableOpacity onPress={() => setDatePickerVisible(true)} style={styles.dateSelectBtn}>
              <Text style={styles.dateSelectText}>{formatDateDisplay(selectedDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Event Name *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. John's Birthday"
              placeholderTextColor={colors.muted}
              autoFocus
            />

            <Text style={styles.label}>Event Type</Text>
            <View style={styles.typeRow}>
              {EVENT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                  onPress={() => setType(t)}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      type === t && styles.typeBtnTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Buy cake"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Smart Reminders</Text>
            <Text style={styles.reminderHint}>All at 5:00 AM. You can select one or more.</Text>
            <View style={styles.reminderOptions}>
              <View style={styles.reminderRow}>
                <Text style={styles.reminderOptionLabel}>🎂 Same day</Text>
                <Switch
                  value={sameDay}
                  onValueChange={setSameDay}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.reminderRow}>
                <Text style={styles.reminderOptionLabel}>⏰ 1 day before</Text>
                <Switch
                  value={oneDayBefore}
                  onValueChange={setOneDayBefore}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.reminderRow}>
                <Text style={styles.reminderOptionLabel}>📅 1 week before</Text>
                <Switch
                  value={oneWeekBefore}
                  onValueChange={setOneWeekBefore}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
            {!hasAnyReminder && (
              <Text style={styles.noReminderHint}>No reminders for this event.</Text>
            )}

            {submitError ? (
              <Text style={styles.submitError}>{submitError}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.submitBtn, (!title.trim() || !selectedDate) && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={!title.trim() || !selectedDate}
            >
              <Text style={styles.submitText}>
                {editEvent ? 'Save Changes' : 'Add Event'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        <MonthCalendarModal
          visible={datePickerVisible}
          onClose={() => setDatePickerVisible(false)}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setDatePickerVisible(false);
          }}
          selectedDate={selectedDate}
          events={events}
          recurringIndex={recurringIndex}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.text,
    fontFamily,
  },
  dateSelectBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: 10,
  },
  dateSelectText: {
    fontSize: typography.small,
    color: colors.text,
    fontWeight: '600',
    fontFamily,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 20,
    color: colors.muted,
    fontFamily,
  },
  form: {
    padding: spacing.lg,
  },
  formContent: {
    paddingBottom: spacing.xl,
  },
  label: {
    fontSize: typography.small,
    color: colors.muted,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
    fontFamily,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeBtnText: {
    fontSize: typography.small,
    color: colors.text,
    fontFamily,
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  reminderHint: {
    fontSize: typography.small,
    color: colors.muted,
    marginBottom: spacing.sm,
    fontFamily,
  },
  reminderOptions: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  reminderOptionLabel: {
    fontSize: typography.body,
    color: colors.text,
    fontFamily,
  },
  noReminderHint: {
    fontSize: typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
    fontFamily,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitError: {
    fontSize: typography.small,
    color: colors.danger,
    marginTop: spacing.sm,
    fontFamily,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily,
  },
});
