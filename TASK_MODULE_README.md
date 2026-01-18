# Task Manager Module

A comprehensive task management system that helps users build streaks, monitor daily tasks, and maintain consistency.


- **Create Tasks**: Add new tasks with title, description, frequency, tags, difficulty level, priority, and label color
- **Mark Completions**: Quick one-tap marking for daily task completions
- **Task History**: View day-by-day completion history for the last 7, 30, or 90 days
- **Dashboard**: Central hub to see all tasks at a glance with quick access to mark completions

#### Task Model (`models/Task.js`)

Main task configuration stored for each user:

- title,         // Task title
- description,   // Optional description
- tags,          // User provided tags for categorization
- startDate,     // Date task started
- priority,      // low | medium | high (dashboard sort/highlight)
- labelColor,    // color hex for UI accent
- lastCompletedDate, // last day the task was completed (quick lookup)

#### TaskLog Model (`models/TaskLog.js`)

Records individual task completion logs with date and count.

  taskId,        // Reference to Task

#### TaskSummary Model (`models/TaskSummary.js`)

Precomputed metrics for fast dashboards and insights:

- currentStreak,   // current run of consecutive days
- maxStreak,       // longest streak achieved
- totalCompletions, // total times completed
- completionRate,   // completions / active days
- weeklyScore,      // completions in the last 7 days (gamification)
- productivityIndex // combined heuristic for ranking tasks


#### Tasks
- `GET /api/tasks` - List all tasks (optional query: `?archive=true/false&tags=tag1,tag2&priority=high&status=doneToday&sort=priority|completion|createdAt`)
- `PATCH /api/tasks/:id/position` - Update task position/zIndex/size (body: `{ position, zIndex, width, height }`)
- `POST /api/tasks/positions/bulk` - Bulk update multiple tasks positions (body: `{ positions: [{ id, position, zIndex, width, height }] }`)

Allowed label colors (hex): `#ff7eb9`, `#ff65a3`, `#7afcff`, `#feff9c`, `#fff740`
- `POST /api/tasks` - Create new task (supports `priority` and `labelColor`)
- `PUT /api/tasks/:id` - Update task (supports `priority`, `labelColor`, `archive`)
- `DELETE /api/tasks/:id` - Archive task (soft delete)
- `POST /api/tasks/:id/restore` - Restore archived task
- `POST /api/tasks/:id/mark` - Mark task completion
- `POST /api/tasks/:id/unmark` - Remove a completion
- `POST /api/tasks/bulk/mark` - Bulk mark multiple tasks
- `POST /api/tasks/bulk/unmark` - Bulk unmark multiple tasks
- `GET /api/tasks/:id/history?from=&to=` - Get completion logs for date range
- `GET /api/tasks/:id/summary` - Get TaskSummary for specific task
- `GET /api/tasks/dashboard?range=30` - Get all tasks with recent logs
- `GET /api/tasks/statistics` - Global productivity stats for dashboard
