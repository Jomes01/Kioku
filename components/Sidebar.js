/**
 * Sidebar - Drawer showing event categories
 * Tap a category to see its events list
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import { colors, spacing, typography, fontFamily, eventTypeColors, EVENT_TYPES } from '../styles/theme';

const SIDEBAR_WIDTH = 280;

export default function Sidebar({
  visible,
  onClose,
  onSelectCategory,
  events = {},
}) {
  const flatEvents = React.useMemo(() => {
    const flat = [];
    Object.keys(events).forEach((date) => {
      (events[date] || []).forEach((event) => {
        flat.push({ date, ...event });
      });
    });
    return flat;
  }, [events]);

  const categoryCounts = React.useMemo(() => {
    const counts = {};
    EVENT_TYPES.forEach((t) => { counts[t] = 0; });
    flatEvents.forEach((e) => {
      const t = e.type || 'Other';
      if (counts[t] !== undefined) counts[t]++;
      else counts.Other++;
    });
    return counts;
  }, [flatEvents]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sidebar} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Image source={require('../Kioku_Logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>EVENTS</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoryList}>
            {EVENT_TYPES.map((category) => {
              const count = categoryCounts[category] || 0;
              const color = eventTypeColors[category] || colors.primary;
              return (
                <TouchableOpacity
                  key={category}
                  style={styles.categoryItem}
                  onPress={() => onSelectCategory(category)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.categoryDot, { backgroundColor: color }]} />
                  <Text style={styles.categoryName}>{category}</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{count}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <TouchableOpacity style={styles.dimArea} activeOpacity={1} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.card,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  dimArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    width: 36,
    height: 36,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    color: colors.text,
    fontFamily,
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 20,
    color: colors.muted,
    fontFamily,
  },
  categoryList: {
    paddingVertical: spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
    fontFamily,
  },
  countBadge: {
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: typography.small,
    color: colors.muted,
    fontWeight: '600',
    fontFamily,
  },
});
