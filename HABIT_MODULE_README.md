# Habit Tracker Module

A comprehensive habit tracking system that helps users build streaks, monitor daily habits, and maintain consistency.

## Features

### Core Features

- **Create Habits**: Add new habits with title, description, frequency, tags, difficulty level, and visibility settings
- **Mark Completions**: Quick one-tap marking for daily habit completions
- **Streak Tracking**: Track current streaks, best streaks, and completion percentages
- **Habit History**: View day-by-day completion history for the last 7, 30, or 90 days
- **Dashboard**: Central hub to see all habits at a glance with quick access to mark completions

### Schedule Types

- **Daily**: Complete every day
- **Weekdays**: Complete Monday through Friday
- **Every N Days**: Flexible recurring schedule
- **Monthly**: Once per month
- **Custom**: Customizable day patterns

### Analytics & Insights

- Current streak counter
- Maximum streak achievement
- Overall completion rate percentage
- Total completions count
- Last completed date tracking

## Backend Implementation

### Models

#### Habit Model (`models/Habit.js`)
Main habit configuration stored for each user:
```javascript
{
  userId,          // Reference to User
  title,           // Required
  description,     // Optional
  tags,           // Array of strings
  startDate,      // Date habit started
  schedule,       // Schedule configuration
  reminder,       // Reminder settings (enabled, time, channels)
  target,         // Times to complete per day (default: 1)
  difficulty,     // easy | medium | hard
  visibility,     // private | friends | public
  archive,        // Soft delete flag
  settings: {
    allowMissedMarking  // Can mark past dates
  }
}
```

#### HabitLog Model (`models/HabitLog.js`)
Records each completion:
```javascript
{
  habitId,        // Reference to Habit
  userId,         // Reference to User
  date,           // Normalized to user's midnight
  count,          // Times completed that day
  meta: {
    device,       // 'web', 'mobile', etc.
    source        // Where marked from
  }
}
```

#### HabitSummary Model (`models/HabitSummary.js`)
Materialized view for fast dashboard queries:
```javascript
{
  habitId,
  userId,
  currentStreak,
  maxStreak,
  completionRate,    // 0 to 1
  lastCompletedAt,
  totalCompletions,
  longestGapDays
}
```

### API Endpoints

All endpoints require authentication (checkAuth middleware).

#### Habits
- `GET /api/habits` - List all habits (optional `?archive=true/false`)
- `POST /api/habits` - Create new habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Archive habit (soft delete)

#### Completions
- `POST /api/habits/:id/mark` - Mark habit completion
  - Body: `{ date?: ISOString, count?: number }`
- `POST /api/habits/:id/unmark` - Remove a completion
  - Body: `{ date?: ISOString }`

#### History & Analytics
- `GET /api/habits/:id/history?from=&to=` - Get completion logs for date range
- `GET /api/habits/:id/summary` - Get HabitSummary for specific habit
- `GET /api/habits/dashboard?range=30` - Get all habits with recent logs

### Logic

#### Streak Calculation
When marking a habit as complete:
1. Create/update HabitLog for the date
2. Calculate if the date is consecutive to lastCompletedAt
3. Update currentStreak (increment if consecutive, reset to 1 if not)
4. Update maxStreak if currentStreak exceeds it
5. Recalculate completionRate = totalCompletions / daysSinceStart

#### Completion Rate
- Calculated as: `totalCompletions / totalScheduledDaysSinceStart`
- Updated whenever a log is created or deleted
- Capped at 100% (1.0)

## Frontend Implementation

### Pages

#### Habit Dashboard (`pages/habit-dashboard.tsx`)
Main page showing all active habits:
- Grid of HabitCard components
- Create new habit button opens CreateHabitDialog
- Shows summary stats for each habit
- Quick mark button on each card
- Click card to navigate to detail page

#### Habit Detail (`pages/habit-detail.tsx`)
Detailed view for a single habit:
- Large streak display with flame icon
- Best streak record
- Completion rate progress bar
- Habit settings and tags
- Recent completion history (7/30/90 day views)
- Mark today's completion button
- Edit/Archive buttons

### Components

#### HabitCard (`components/habits/HabitCard.tsx`)
Reusable card component showing:
- Habit title and description
- Current streak with flame icon
- Completion rate progress bar
- Tags
- Difficulty level
- Quick mark button

#### CreateHabitDialog (`components/habits/CreateHabitDialog.tsx`)
Modal form to create new habits:
- Title (required)
- Description
- Tags (add/remove)
- Schedule selection
- Difficulty level
- Visibility setting
- Daily target count

### Hooks

#### useHabits (`hooks/useHabits.ts`)
Main hook for habit management:
```typescript
{
  habits,           // Array of habits
  loading,          // Loading state
  error,            // Error message
  fetchHabits,      // Fetch all habits
  createHabit,      // Create new habit
  updateHabit,      // Update existing habit
  deleteHabit,      // Archive habit
  markComplete,     // Mark completion
  unmarkComplete    // Remove completion
}
```

#### useHabitDetail (`hooks/useHabits.ts`)
Hook for single habit detail:
```typescript
{
  summary,          // HabitSummary data
  history,          // Array of HabitLog
  loading,          // Loading state
  error,            // Error message
  fetchSummary,     // Fetch habit summary
  fetchHistory      // Fetch logs for date range
}
```

### API Utilities

#### habitAPI (`lib/habitApi.ts`)
Axios-based API client with methods:
- `getAllHabits(archive)`
- `createHabit(habit)`
- `updateHabit(id, updates)`
- `deleteHabit(id)`
- `markComplete(id, date?, count?)`
- `unmarkComplete(id, date?)`
- `getHistory(id, from?, to?)`
- `getSummary(id)`
- `getDashboard(range)`

## Integration

The Habit module is integrated into the main app:

1. **Routes Added to App.tsx**:
   - `/habits` - Habit dashboard page
   - `/habits/:id` - Habit detail page

2. **Navigation Updated**:
   - Home page includes "Habit Tracker" feature card
   - Click navigates to `/habits` route

3. **Backend Routes**:
   - All habit endpoints under `/api/habits`
   - All require authentication

## Usage

### Creating a Habit
1. Click "New Habit" button on dashboard
2. Fill in habit details (title required)
3. Select schedule type and difficulty
4. Add tags for organization
5. Click "Create Habit"

### Marking Completions
- Click green checkmark on habit card for quick mark
- Or click "Mark Today's Completion" on detail page
- Can optionally mark past dates via API

### Viewing Progress
- Dashboard shows all habits with current stats
- Detail page shows comprehensive breakdown
- History view shows day-by-day completions
- Completion rate updates automatically

### Archiving Habits
- Click Archive button on detail page
- Archived habits can be filtered from list
- Past data remains for analytics

## Future Enhancements

### Planned Features
- [ ] Reminders & notifications
- [ ] Social sharing (share streaks)
- [ ] Accountability buddy system
- [ ] Habit chaining (multi-habit rewards)
- [ ] Badges and achievements
- [ ] XP/gamification system
- [ ] Calendar heatmap visualization
- [ ] Advanced analytics and trends
- [ ] Habit suggestions based on patterns
- [ ] Mobile app integration

### Optimization Ideas
- Background worker for reminder scheduling
- Aggregation pipeline for analytics
- Caching for frequently accessed data
- Real-time updates via WebSockets
- Export data to CSV/PDF

## Technical Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Authentication**: JWT-based with httpOnly cookies
- **Validation**: Built-in Mongoose validation

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide Icons** for UI icons
- **Axios** for API calls

## Database Indexes

For optimal performance:
```javascript
// Habit model
habitSchema.index({ userId: 1 });
habitSchema.index({ userId: 1, archive: 1 });

// HabitLog model
habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });
habitLogSchema.index({ userId: 1, date: 1 });
habitLogSchema.index({ userId: 1 });

// HabitSummary model
habitSummarySchema.index({ userId: 1 });
```

## Testing

### Sample Habit Creation
```json
POST /api/habits
{
  "title": "Morning Meditation",
  "description": "10 minutes of mindfulness meditation",
  "tags": ["wellness", "mental-health"],
  "schedule": { "kind": "daily" },
  "difficulty": "medium",
  "visibility": "private",
  "target": 1
}
```

### Sample Completion
```json
POST /api/habits/{habitId}/mark
{
  "date": "2024-12-24T00:00:00Z",
  "count": 1
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad request
- 403: Unauthorized (wrong user)
- 404: Not found
- 500: Server error

Error responses include message explaining the issue.

## Security

- All endpoints require authentication
- Users can only access their own habits
- Archive operations prevent accidental deletions
- Input validation on all create/update operations
- CORS enabled for frontend communication
