/**
 * Kioku - Remember important dates
 * Offline-first calendar app with reminders and search
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  LogBox,
  Image,
  BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';

// expo-notifications shows errors in Expo Go (SDK 53+); suppress them when using Expo Go
if (Constants.appOwnership === 'expo') {
  LogBox.ignoreLogs(['expo-notifications', 'development build']);
}
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import CalendarView from './components/CalendarView';
import EventModal from './components/EventModal';
import EventList from './components/EventList';
import SearchBar from './components/SearchBar';
import MonthCalendarModal from './components/MonthCalendarModal';
import Sidebar from './components/Sidebar';

import { loadEvents, upsertEvent, deleteEvent, getAllEventsFlat, hasAnyReminder } from './utils/storage';
import { searchEvents } from './utils/search';
import {
  requestPermissions,
  setupNotificationChannel,
  rescheduleAllReminders,
  scheduleSmartReminders,
  cancelReminder,
} from './utils/notifications';
import { updateEventNotificationIds } from './utils/storage';
import { buildRecurringIndex, getEventsForDate } from './utils/recurringEvents';

import { colors, spacing, fontFamily } from './styles/theme';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Azonix: require('./assets/fonts/Azonix.otf'),
  });

  const [events, setEvents] = useState({});
  const [currentDate] = useState(new Date());
  const [modalDate, setModalDate] = useState(null);
  const [listVisible, setListVisible] = useState(false);
  const [listDate, setListDate] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [categoryListVisible, setCategoryListVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [addEventType, setAddEventType] = useState(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const recurringIndex = useMemo(() => buildRecurringIndex(events), [events]);

  // Load events and setup notifications on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      const data = await loadEvents();
      if (mounted) setEvents(data);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/09642b9c-fbe8-4d0b-a90f-5edd784313a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:init',message:'init complete',data:{appOwnership:Constants.appOwnership,skippedNotifications:Constants.appOwnership==='expo'},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      // Skip notification setup in Expo Go (not supported in SDK 53+)
      if (Constants.appOwnership !== 'expo') {
        await requestPermissions();
        await setupNotificationChannel();
        await rescheduleAllReminders(data);
      }
    }

    init();
    return () => { mounted = false; };
  }, []);

  // Android back button: close topmost modal/screen
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (monthPickerVisible) {
        setMonthPickerVisible(false);
        return true;
      }
      if (categoryListVisible) {
        setCategoryListVisible(false);
        setCategoryFilter(null);
        return true;
      }
      if (listVisible) {
        setListVisible(false);
        return true;
      }
      if (sidebarVisible) {
        setSidebarVisible(false);
        return true;
      }
      if (searchVisible) {
        setSearchVisible(false);
        setSearchQuery('');
        setShowSearchResults(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [monthPickerVisible, categoryListVisible, listVisible, sidebarVisible, searchVisible]);

  // Search handler
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const results = searchEvents(events, q);
    setSearchResults(results);
    setShowSearchResults(true);
  }, [searchQuery, events]);

  const refreshEvents = useCallback(async (newEvents) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/09642b9c-fbe8-4d0b-a90f-5edd784313a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:refreshEvents',message:'refreshEvents called',data:{appOwnership:Constants.appOwnership,isExpoGo:Constants.appOwnership==='expo'},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    setEvents(newEvents);
    await rescheduleAllReminders(newEvents);
  }, []);

  const handleDayPress = (date) => {
    setListDate(date);
    setListVisible(true);
  };

  const handleMonthSelect = (date) => {
    handleDayPress(date);
    setMonthPickerVisible(false);
  };

  const handleAddEvent = (date, type) => {
    const resolvedDate = date || todayStr;
    setModalDate(resolvedDate);
    setEditEvent(null);
    setAddEventType(type || null);
    setAddModalVisible(true);
  };

  const handleHeaderLayout = useCallback((height) => {
    setHeaderHeight((prev) => (Math.abs(prev - height) > 0.5 ? height : prev));
  }, []);

  const handleEventSubmit = async (eventData) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/09642b9c-fbe8-4d0b-a90f-5edd784313a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:handleEventSubmit',message:'async submit started',data:{hasDate:!!(eventData.date||modalDate||listDate)},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    const date = eventData.date || modalDate || listDate;
    if (!date) return;

    const payload = {
      title: eventData.title,
      type: eventData.type || 'Other',
      description: eventData.description || '',
      reminders: eventData.reminders || { sameDay: true, oneDayBefore: false, oneWeekBefore: false },
      notificationIds: [],
    };

    if (eventData.id) {
      // Edit: cancel existing notifications, then reschedule if any reminders enabled
      const existingEvent = { id: eventData.id, ...payload, notificationIds: editEvent?.notificationIds || [] };
      await cancelReminder(existingEvent);

      const { events: newEvents, createdEvent } = await upsertEvent(date, payload, eventData.id);
      const eventToSchedule = createdEvent || { ...payload, id: eventData.id };

      if (hasAnyReminder(eventToSchedule)) {
        const notificationIds = await scheduleSmartReminders(eventToSchedule, date);
        await updateEventNotificationIds(date, eventToSchedule.id, notificationIds);
      }
      await refreshEvents(newEvents);
    } else {
      const { events: newEvents, createdEvent } = await upsertEvent(date, payload);
      if (hasAnyReminder(createdEvent)) {
        const notificationIds = await scheduleSmartReminders(createdEvent, date);
        await updateEventNotificationIds(date, createdEvent.id, notificationIds);
      }
      await refreshEvents(newEvents);
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/09642b9c-fbe8-4d0b-a90f-5edd784313a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:handleEventSubmit',message:'async submit completed',data:{success:true},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    setAddModalVisible(false);
    setEditEvent(null);
    setAddEventType(null);
    setListVisible(false);
    setCategoryListVisible(false);
  };

  const handleEditEvent = (event) => {
    if (!event) return;
    const sourceDate = event.sourceDate || event.date;
    const normalizedEvent = {
      ...event,
      id: event.originalId || event.id,
      date: sourceDate,
    };
    setEditEvent(normalizedEvent);
    setListDate(sourceDate);
    setListVisible(false);
    setAddModalVisible(true);
    setModalDate(sourceDate);
  };

  const handleDeleteEvent = async (event) => {
    if (!event) return;
    const sourceDate = event.sourceDate || event.date;
    const eventId = event.originalId || event.id;
    const eventForCancellation = { ...event, id: eventId, date: sourceDate };
    await cancelReminder(eventForCancellation);
    const newEvents = await deleteEvent(sourceDate, eventId);
    await refreshEvents(newEvents);
    setListVisible(false);
    setCategoryListVisible(false);
  };

  const handleSearchResultPress = (item) => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchVisible(false);
    setListDate(item.date);
    setListVisible(true);
  };

  const listEvents = listDate ? getEventsForDate(events, listDate, recurringIndex) : [];

  const categoryEvents = useMemo(() => {
    if (!categoryFilter) return [];
    const flat = getAllEventsFlat(events);
    const filtered = flat.filter((e) => (e.type || 'Other') === categoryFilter);
    return filtered.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [events, categoryFilter]);

  const todayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  // #region agent log
  (()=>{const now=new Date();const stale=now.getDate()!==currentDate.getDate()||now.getMonth()!==currentDate.getMonth()||now.getFullYear()!==currentDate.getFullYear();if(stale)fetch('http://127.0.0.1:7242/ingest/09642b9c-fbe8-4d0b-a90f-5edd784313a5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.js:todayStr',message:'todayStr stale',data:{currentDate:currentDate.toISOString(),now:now.toISOString()},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});})();
  // #endregion
  const selectedDate = listDate || todayStr;

  const statusBarHeight = Constants.statusBarHeight ?? 0;

  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.root, styles.loadingCenter]}>
        <Image source={require('./Kioku_Logo.png')} style={styles.loadingLogo} resizeMode="contain" />
        <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: statusBarHeight }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Search bar - shown when user taps search icon */}
        {searchVisible && (
          <View style={styles.searchBarRow}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, type, or date..."
            />
            <TouchableOpacity style={styles.searchCloseBtn} onPress={() => { setSearchVisible(false); setSearchQuery(''); setShowSearchResults(false); }}>
              <Text style={styles.searchCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search results dropdown */}
        {showSearchResults && searchQuery.trim() ? (
          <View style={styles.searchResults}>
            <ScrollView
              style={styles.searchScroll}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {searchResults.length === 0 ? (
                <Text style={styles.searchEmpty}>No matching events</Text>
              ) : (
                searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.searchItem}
                    onPress={() => handleSearchResultPress(item)}
                  >
                    <Text style={styles.searchItemTitle}>{item.title}</Text>
                    <Text style={styles.searchItemMeta}>
                      {item.type} • {item.date}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        ) : (
          /* Calendar view - date list with header */
          <CalendarView
            currentDate={currentDate}
            events={events}
            recurringIndex={recurringIndex}
            onDayPress={handleDayPress}
            selectedDate={selectedDate}
            onMenuPress={() => setSidebarVisible(true)}
            onSearchPress={() => setSearchVisible(true)}
            onCalendarPress={() => {
              setListVisible(false);
              setMonthPickerVisible(true);
            }}
            onHeaderLayout={handleHeaderLayout}
          />
        )}

        {/* Floating Add button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            setModalDate(dateStr);
            setEditEvent(null);
            setAddModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Add/Edit Event Modal */}
      <EventModal
        visible={addModalVisible}
        onClose={() => {
          setAddModalVisible(false);
          setEditEvent(null);
          setAddEventType(null);
        }}
        onSubmit={handleEventSubmit}
        initialDate={modalDate || ''}
        initialType={addEventType}
        editEvent={editEvent}
        recurringIndex={recurringIndex}
        events={events}
      />

      {/* Events list modal (when tapping a date) */}
      <EventList
        visible={listVisible}
        onClose={() => setListVisible(false)}
        events={listEvents}
        dateLabel={listDate ? `Events - ${listDate}` : 'Events'}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onAdd={() => {
          setListVisible(false);
          handleAddEvent(listDate);
        }}
      />

      <MonthCalendarModal
        visible={monthPickerVisible}
        onClose={() => setMonthPickerVisible(false)}
        onSelectDate={handleMonthSelect}
        selectedDate={selectedDate}
        events={events}
        recurringIndex={recurringIndex}
        topOffset={statusBarHeight + headerHeight}
      />

      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onSelectCategory={(category) => {
          setSidebarVisible(false);
          setListVisible(false);
          setCategoryFilter(category);
          setCategoryListVisible(true);
        }}
        events={events}
      />

      <EventList
        visible={categoryListVisible}
        onClose={() => {
          setCategoryListVisible(false);
          setCategoryFilter(null);
        }}
        events={categoryEvents}
        dateLabel={categoryFilter ? `${categoryFilter} Events` : 'Events'}
        showDateInItem
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onAdd={() => {
          handleAddEvent(todayStr, categoryFilter);
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  loadingCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: 120,
    height: 120,
    marginBottom: spacing.lg,
  },
  loadingSpinner: {
    marginTop: spacing.md,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchCloseBtn: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  searchCloseText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
    fontFamily,
  },
  searchResults: {
    flex: 1,
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: 12,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchScroll: {
    padding: spacing.sm,
  },
  searchEmpty: {
    textAlign: 'center',
    color: colors.muted,
    padding: spacing.lg,
    fontFamily,
  },
  searchItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily,
  },
  searchItemMeta: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
    fontFamily,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: colors.primary,
    fontWeight: '300',
    lineHeight: 36,
    fontFamily,
  },
});
