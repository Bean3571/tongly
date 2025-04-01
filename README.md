# Tongly - Language Learning Platform

Tongly is a platform connecting language students with tutors for personalized lessons.

## Backend Architecture

The backend follows a Clean Architecture approach:

- **Entities**: Core domain objects (User, Student, Tutor, Lesson, etc.)
- **Repositories**: Database access layer using raw SQL
- **Use Cases**: Business logic layer
- **HTTP Handlers**: REST API endpoints
- **Router**: Combines all handlers and middleware

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and get token
- `POST /api/auth/refresh`: Refresh authentication token

### User
- `GET /api/user/profile`: Get current user profile
- `PUT /api/user/profile`: Update user profile
- `PUT /api/user/password`: Update user password
- `DELETE /api/user/account`: Delete user account

### Student
- `GET /api/student/profile`: Get student profile
- `PUT /api/student/profile`: Update student profile
- `PUT /api/student/streak`: Update streak
- `GET /api/student/lessons/upcoming`: Get upcoming lessons
- `GET /api/student/lessons/past`: Get past lessons
- `POST /api/student/languages`: Add a language
- `DELETE /api/student/languages/:languageId`: Remove a language
- `POST /api/student/interests`: Add an interest
- `DELETE /api/student/interests/:interestId`: Remove an interest
- `POST /api/student/goals`: Add a goal
- `DELETE /api/student/goals/:goalId`: Remove a goal

### Tutor
- `GET /api/tutor/profile`: Get tutor profile
- `PUT /api/tutor/profile`: Update tutor profile
- `GET /api/tutor/availabilities`: Get availabilities
- `POST /api/tutor/availabilities`: Add availability
- `PUT /api/tutor/availabilities/:availabilityId`: Update availability
- `DELETE /api/tutor/availabilities/:availabilityId`: Delete availability
- `GET /api/tutor/lessons/upcoming`: Get upcoming lessons
- `GET /api/tutor/lessons/past`: Get past lessons
- `GET /api/tutors/search`: Search tutors (public)

### Lessons
- `POST /api/lessons`: Book a new lesson
- `GET /api/lessons/:lessonId`: Get lesson details
- `POST /api/lessons/:lessonId/cancel`: Cancel a lesson
- `PUT /api/lessons/:lessonId/notes`: Update lesson notes
- `POST /api/lessons/:lessonId/reviews`: Add a review

### Common Data
- `GET /api/languages`: Get all languages
- `GET /api/languages/proficiencies`: Get all language proficiency levels
- `GET /api/interests`: Get all interests
- `GET /api/goals`: Get all goals

## Getting Started

1. Install dependencies:
   ```
   go mod download
   ```

2. Set up the PostgreSQL database:
   ```
   psql -U postgres -c "CREATE DATABASE tongly"
   ```

3. Run the migrations:
   ```
   # TODO: Add migration command
   ```

4. Start the server:
   ```
   go run cmd/server/main.go
   ```

The server will be available at http://localhost:8080

---

## Table of Contents

1. [Features](#features)
2. [Technologies](#technologies)

---

## Features

- **User Registration & Authentication**: Students and tutors can register and log in securely using JWT.
- **Tutor Management**: Tutors can manage their profiles, availability, and schedules.
- **Lesson Scheduling**: Students can book lessons with tutors.
- **Gamification**: Language challenges and leaderboards to engage students.
- **Localization**: Multi-language support for a global audience.

---

## Technologies

### Frontend
- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: Adds static typing to JavaScript for better development experience.
- **Tailwind CSS**: A utility-first CSS framework for styling.
- **React Router**: For navigation between pages.

### Backend
- **Golang**: A fast and efficient programming language.
- **Gin-Gonic**: A web framework for building APIs in Go.
- **PostgreSQL**: A powerful, open-source relational database.
- **JWT**: JSON Web Tokens for secure authentication.
- **WebRTC**: For real-time video communication.

### Infrastructure
- **Docker**: For containerization and easy deployment.
- **Nginx**: As a reverse proxy for serving the application.

