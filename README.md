# Kioku - Remember Important Dates

Offline-first mobile app to remember birthdays, anniversaries, and other important dates. Built with React Native (Expo) for Android.

## Features

- **Date-list calendar** – Month selector, date list with event summaries, swipe between months
- **Month picker modal** – Full month grid with swipe gestures and event list
- **Event management** – Add, edit, delete events with types (Birthday, Anniversary, Death Anniversary, Other)
- **Category sidebar** – Filter events by type (Birthday, Anniversary, Death Anniversary, Other)
- **Color-coded events** – Visual indicators by type, recurring instances for birthdays/anniversaries
- **Smart reminders** – Same day, 1 day before, 1 week before (at 5:00 AM)
- **Search** – Token-based search across title, type, description, and date with relevance ranking
- **Offline only** – No internet, no backend, no auth
- **Custom branding** – Azonix font, Kioku logo
- **Back navigation** – Android back button closes modals and returns to current month

## Run the app

```bash
npx expo start
```

Then press `a` for Android emulator, or scan the QR code with Expo Go on your device.

### Development build (recommended for reminders)

Notifications require a development build (not Expo Go):

```bash
npx expo install expo-dev-client
npx expo run:android
```

### Build APK

```bash
npx expo prebuild --clean
npx expo run:android
```

Or use [EAS Build](https://docs.expo.dev/build/introduction/) for production APKs.

## Project structure

```
├── App.js                 # Main app, state, modals
├── components/
│   ├── CalendarView.js    # Date-list view with month/year selector
│   ├── DateRow.js         # Single date row in list
│   ├── DayCell.js         # (if used) Date cell
│   ├── EventModal.js      # Add/edit event form
│   ├── EventList.js       # List of events (modal)
│   ├── MonthCalendarModal.js  # Month grid modal with swipe
│   ├── SearchBar.js       # Search input
│   └── Sidebar.js         # Category drawer
├── utils/
│   ├── storage.js         # AsyncStorage helpers
│   ├── notifications.js   # Local reminder scheduling
│   ├── recurringEvents.js # Yearly recurring logic
│   ├── eventSummary.js    # Event summary builder
│   └── search.js          # Token-based search
├── styles/
│   └── theme.js           # Colors, spacing, typography, font
└── assets/
    └── fonts/
        └── Azonix.otf     # Custom app font
```

## Data storage

Events are stored in AsyncStorage as JSON:

```json
{
  "YYYY-MM-DD": [
    {
      "id": "uuid",
      "title": "Event Name",
      "type": "Birthday",
      "description": "Optional",
      "reminders": {
        "sameDay": true,
        "oneDayBefore": true,
        "oneWeekBefore": false
      },
      "notificationIds": []
    }
  ]
}
```

## Theme

- **Colors** – Black, Dark Navy, Orange, Light Gray, White
- **Event types** – Birthday (red), Anniversary (green), Death Anniversary (blue), Other (yellow)
