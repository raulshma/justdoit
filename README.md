# JustDoIt

A React Native goal-tracking and productivity app built with Expo. JustDoIt helps users set, manage, and achieve their daily goals with features like AI assistance, gamification, and smart notifications.

## Features

- Goal Management: Create, edit, and track daily goals with subgoals and priorities
- AI Assistant: Get AI-powered suggestions for breaking down goals and staying motivated
- Gamification: Earn XP, unlock badges, complete challenges, and track streaks
- Smart Notifications: Configurable reminders and goal-specific notifications
- Voice Input: Add goals using speech recognition
- Calendar Integration: View calendar events alongside your goals
- Statistics: Track completion rates, streaks, and personal bests
- Templates: Save and reuse goal templates for recurring tasks
- Categories: Organize goals with custom categories
- Dark Mode: Full dark mode support with customizable color palettes
- Focus Mode: Distraction-free mode for concentrated work sessions

## Tech Stack

- React Native 0.81.5
- Expo SDK 54
- TypeScript
- React Navigation 7
- React Native Paper (Material Design 3)
- React Native MMKV (storage)
- React Native Reanimated (animations)
- Expo Notifications
- Expo Speech Recognition
- Expo Calendar

## Prerequisites

- Node.js 18+ or Bun
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd justdoit
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Generate native projects (if needed):
```bash
bun expo prebuild --clean --platform android
```

## Running the App

Start the development server:
```bash
bun start
```

Run on Android:
```bash
bun android
```

Run on iOS:
```bash
bun ios
```

Run on web:
```bash
bun web
```

## Project Structure

```
src/
  components/     # Reusable UI components
  context/        # React context providers (goals, settings, gamification, etc.)
  data/           # Static data files
  navigation/     # Navigation configuration
  screens/        # App screens
  services/       # Business logic and data services
  theme/          # Theme configuration and colors
  types/          # TypeScript type definitions
```

## Testing

Run the test suite:
```bash
bun test
```

## Configuration

The app uses several Expo plugins that require permissions:
- Microphone access for voice input
- Speech recognition for voice commands
- Calendar access for event integration
- Notifications for reminders

## License

Private
