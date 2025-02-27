# Lesson Implementation

This is a comprehensive implementation of the lesson system for a language learning platform. It includes all necessary components for managing, scheduling, and conducting online language lessons.

## Features

- **Lesson Management**: View and manage upcoming and completed lessons
- **Real-time Video Lessons**: Integrated video conferencing for lessons
- **Chat System**: In-lesson chat functionality
- **Status Tracking**: Track lesson status (scheduled, in progress, completed, cancelled)
- **Time Management**: Automatic time tracking and notifications
- **Cancellation System**: Lesson cancellation with confirmation
- **Responsive Design**: Works on desktop and mobile devices

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── lessons/
│   │       ├── LessonList.tsx        # List of lessons with filtering
│   │       └── LessonStatusBadge.tsx # Status indicator component
│   ├── pages/
│   │   ├── Lessons.tsx              # Main lessons page
│   │   └── LessonRoom.tsx           # Video lesson room
│   ├── hooks/
│   │   └── useLessons.ts            # Custom hook for lesson data
│   └── utils/
│       └── dateUtils.ts             # Date formatting utilities
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```env
REACT_APP_API_URL=http://localhost:8080
```

3. Start the development server:
```bash
npm start
```

## Usage

### Viewing Lessons

The main lessons page (`/lessons`) shows two tabs:
- **Upcoming**: Shows scheduled and in-progress lessons
- **Completed**: Shows past lessons

### Joining a Lesson

1. Lessons can be joined 5 minutes before the scheduled start time
2. Click the "Join" button on an upcoming lesson
3. You'll be taken to the lesson room with video and chat

### Lesson Room Features

- Real-time video conferencing
- Chat with participant
- Timer showing remaining time
- Warning notification 10 minutes before end
- Automatic session management

### Cancelling Lessons

- Lessons can be cancelled up to 24 hours before start time
- Cancellation requires confirmation
- Both students and tutors can cancel lessons

## API Endpoints

The implementation uses the following API endpoints:

```
GET    /api/lessons/upcoming      # Get upcoming lessons
GET    /api/lessons/completed     # Get completed lessons
GET    /api/lessons/:id          # Get specific lesson
POST   /api/lessons/:id/cancel   # Cancel a lesson
GET    /api/lessons/:id/video    # Get video session
POST   /api/lessons/:id/video/start # Start video session
POST   /api/lessons/:id/video/end   # End video session
```

## Dependencies

- React 18
- TypeScript
- Ant Design
- Styled Components
- date-fns
- React Router DOM

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT License 