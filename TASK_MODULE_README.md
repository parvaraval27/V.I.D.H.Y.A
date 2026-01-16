# Task Manager Module

A comprehensive task management system that helps users build streaks, monitor daily tasks, and maintain consistency.


- **Create Tasks**: Add new tasks with title, description, frequency, tags, difficulty level, and visibility settings
- **Mark Completions**: Quick one-tap marking for daily task completions
- **Task History**: View day-by-day completion history for the last 7, 30, or 90 days
- **Dashboard**: Central hub to see all tasks at a glance with quick access to mark completions

#### Task Model (`models/Task.js`)

Main task configuration stored for each user:

- title,         // Task title
- description,   // Optional description
- tags,          // User provided tags for categorization
- startDate,      // Date task started

#### TaskLog Model (`models/TaskLog.js`)

Records individual task completion logs with date and count.

  taskId,        // Reference to Task

#### TaskSummary Model (`models/TaskSummary.js`)


#### Tasks
- `GET /api/tasks` - List all tasks (optional `?archive=true/false`)
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Archive task (soft delete)
- `POST /api/tasks/:id/mark` - Mark task completion
- `POST /api/tasks/:id/unmark` - Remove a completion
- `GET /api/tasks/:id/history?from=&to=` - Get completion logs for date range
- `GET /api/tasks/:id/summary` - Get TaskSummary for specific task
- `GET /api/tasks/dashboard?range=30` - Get all tasks with recent logs
