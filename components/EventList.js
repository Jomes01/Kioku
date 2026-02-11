/**
 * EventList - List of events for a date or search results
 * Supports view, edit, delete
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { colors, spacing, typography, fontFamily, eventTypeColors } from '../styles/theme';
import { shadows } from '../styles/theme';
import { hasAnyReminder } from '../utils/storage';

export default function EventList({
  visible,
  onClose,
  events = [],
  dateLabel,
  onEdit,
  onDelete,
  onAdd,
  showDateInItem = false,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{dateLabel || 'Events'}</Text>
            <View style={styles.headerActions}>
              {onAdd && (
                <TouchableOpacity onPress={onAdd} style={styles.addBtn}>
                  <Text style={styles.addBtnText}>+ Add</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {events.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.empty}>No events</Text>
                {onAdd ? (
                  <Text style={styles.emptyHint}>Tap + Add to create one</Text>
                ) : null}
              </View>
            ) : (
              events.map((event, idx) => (
                <View
                  key={event.id && event.date ? `${event.id}-${event.date}` : event.id || `event-${idx}`}
                  style={[
                    styles.card,
                    {
                      borderLeftColor:
                        eventTypeColors[event.type] || colors.other,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          eventTypeColors[event.type] || colors.other,
                      },
                    ]}
                  />
                  <View style={styles.cardBody}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventType}>{event.type}</Text>
                    {event.description ? (
                      <Text style={styles.eventDesc}>{event.description}</Text>
                    ) : null}
                    {showDateInItem && event.date && (
                      <Text style={styles.eventDate}>{event.date}</Text>
                    )}
                    {hasAnyReminder(event) && (
                      <Text style={styles.reminderBadge}>🔔 Reminders on</Text>
                    )}
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      onPress={() => onEdit && onEdit(event)}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onDelete && onDelete(event)}
                      style={[styles.actionBtn, styles.deleteBtn]}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
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
    maxHeight: '85%',
    paddingBottom: spacing.xl,
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: typography.small,
    fontWeight: '600',
    fontFamily,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: typography.body,
    color: colors.muted,
    fontFamily,
  },
  list: {
    padding: spacing.lg,
  },
  emptyContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: typography.body,
    fontFamily,
  },
  emptyHint: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: typography.small,
    marginTop: spacing.xs,
    fontFamily,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    ...shadows.soft,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
    marginTop: 6,
  },
  cardBody: {
    flex: 1,
  },
  eventTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
    fontFamily,
  },
  eventType: {
    fontSize: typography.small,
    color: colors.muted,
    marginTop: 2,
    fontFamily,
  },
  eventDesc: {
    fontSize: typography.small,
    color: colors.text,
    marginTop: 4,
    fontFamily,
  },
  eventDate: {
    fontSize: typography.small,
    color: colors.primary,
    marginTop: 4,
    fontFamily,
  },
  reminderBadge: {
    fontSize: typography.small,
    color: colors.muted,
    marginTop: 4,
    fontFamily,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionText: {
    fontSize: typography.small,
    color: colors.primary,
    fontWeight: '500',
    fontFamily,
  },
  deleteBtn: {},
  deleteText: {
    fontSize: typography.small,
    color: '#DC2626',
    fontWeight: '500',
    fontFamily,
  },
});
