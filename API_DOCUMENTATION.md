# EduVoice Notes - API Documentation

## Table of Contents
- [Authentication](#authentication)
- [Documents](#documents)
- [Courses](#courses)
- [Audio Files](#audio-files)
- [Analytics](#analytics)
- [Error Handling](#error-handling)

## Base URL
```
http://localhost:8000/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Register User
**POST** `/auth/register/`

Request:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student"
}
```

Response:
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "student",
    ...
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

### Login
**POST** `/auth/login/`

Request:
```json
{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Get Current User
**GET** `/auth/user/`

Response:
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student",
  "preferred_voice_type": "female",
  "preferred_speech_rate": 1.0,
  "preferred_language": "en",
  "high_contrast_mode": false,
  "font_size": "medium",
  "reduced_motion": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Update User Preferences
**PUT** `/auth/user/preferences/`

Request:
```json
{
  "preferred_voice_type": "male",
  "preferred_speech_rate": 1.5,
  "high_contrast_mode": true,
  "font_size": "large",
  "audio_preferences": {
    "default_voice": "en-US-Standard-B",
    "email_notifications": true
  }
}
```

## Documents

### List Documents
**GET** `/documents/`

Query Parameters:
- `page`: Page number (default: 1)
- `search`: Search query
- `file_type`: Filter by file type (pdf, docx, txt)
- `status`: Filter by status (uploaded, processing, ready, error)
- `course`: Filter by course ID
- `subject`: Filter by subject

Response:
```json
{
  "count": 42,
  "next": "http://localhost:8000/api/documents/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Introduction to Python",
      "description": "Basic Python programming concepts",
      "file": "/media/documents/1/abc123.pdf",
      "file_url": "http://localhost:8000/media/documents/1/abc123.pdf",
      "file_type": "pdf",
      "file_size": 1024000,
      "uploaded_by": {
        "id": 2,
        "username": "teacher1",
        ...
      },
      "course": 1,
      "course_name": "CS101 - Intro to Computer Science",
      "subject": "Programming",
      "status": "ready",
      "is_public": true,
      "has_audio": true,
      "upload_date": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Upload Document
**POST** `/documents/`

Content-Type: `multipart/form-data`

Form Data:
- `title`: Document title (required)
- `description`: Document description (optional)
- `file`: Document file (required)
- `course`: Course ID (optional)
- `subject`: Subject (optional)
- `is_public`: Boolean (optional, default: false)

Response: Same as single document object

### Get Document Details
**GET** `/documents/{id}/`

Response:
```json
{
  "id": 1,
  "title": "Introduction to Python",
  "description": "Basic Python programming concepts",
  "file_url": "http://localhost:8000/media/documents/1/abc123.pdf",
  "file_type": "pdf",
  "file_size": 1024000,
  "uploaded_by": {...},
  "course": 1,
  "course_name": "CS101 - Intro to Computer Science",
  "subject": "Programming",
  "status": "ready",
  "is_public": true,
  "has_audio": true,
  "extracted_text": "Introduction to Python...",
  "audio_files": [
    {
      "id": 1,
      "audio_url": "http://localhost:8000/media/audio/1/xyz789.mp3",
      "duration": 300.5,
      "voice_type": "female",
      "speech_rate": 1.0,
      "language": "en",
      "status": "completed",
      ...
    }
  ],
  "upload_date": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Convert Document to Audio
**POST** `/documents/{id}/convert/`

Request:
```json
{
  "voice_type": "female",
  "speech_rate": 1.0,
  "language": "en"
}
```

Response:
```json
{
  "message": "Audio conversion started.",
  "task_id": "abc123-def456-ghi789"
}
```

### Delete Document
**DELETE** `/documents/{id}/`

Response: `204 No Content`

## Courses

### List Courses
**GET** `/documents/courses/`

Response:
```json
[
  {
    "id": 1,
    "name": "Introduction to Computer Science",
    "code": "CS101",
    "description": "Fundamentals of computer science",
    "created_by": {...},
    "is_active": true,
    "student_count": 25,
    "document_count": 10,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### Create Course
**POST** `/documents/courses/`

Request:
```json
{
  "name": "Introduction to Computer Science",
  "code": "CS101",
  "description": "Fundamentals of computer science",
  "is_active": true
}
```

### Enroll in Course
**POST** `/documents/courses/{id}/enroll/`

Response:
```json
{
  "message": "Successfully enrolled in course."
}
```

## Audio Files

### List Audio Files
**GET** `/audio/`

Query Parameters:
- `page`: Page number
- `search`: Search query
- `status`: Filter by status
- `voice_type`: Filter by voice type
- `language`: Filter by language

Response:
```json
{
  "count": 15,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "document": 1,
      "document_title": "Introduction to Python",
      "audio_file": "/media/audio/1/xyz789.mp3",
      "audio_url": "http://localhost:8000/media/audio/1/xyz789.mp3",
      "duration": 300.5,
      "voice_type": "female",
      "speech_rate": 1.0,
      "language": "en",
      "status": "completed",
      "error_message": "",
      "download_count": 5,
      "file_size_mb": 4.5,
      "generated_date": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Download Audio File
**GET** `/audio/{id}/download/`

Response: Binary audio file (MP3)

### Stream Audio File
**GET** `/audio/{id}/stream/`

Response: Streamable audio file

### Get Conversion Status
**GET** `/audio/{id}/status/`

Response:
```json
{
  "id": 1,
  "status": "processing",
  "progress": {
    "state": "PROGRESS",
    "info": {
      "current": 50,
      "total": 100
    }
  }
}
```

## Analytics

### Get User Statistics
**GET** `/analytics/user-stats/`

Query Parameters:
- `days`: Number of days to include (default: 30)

Response:
```json
{
  "user": {
    "username": "johndoe",
    "role": "student",
    "member_since": "2024-01-01T00:00:00Z"
  },
  "documents": {
    "total": 10,
    "recent": 3
  },
  "audio": {
    "total": 8,
    "completed": 7,
    "processing": 1,
    "total_listening_time_minutes": 150.5,
    "total_downloads": 25
  },
  "courses": {
    "enrolled": 5,
    "created": 0
  },
  "recent_activities": [
    {
      "activity_type": "document_upload",
      "count": 3
    }
  ],
  "time_range_days": 30
}
```

### Get Admin Statistics (Admin Only)
**GET** `/analytics/admin-stats/`

Query Parameters:
- `days`: Number of days to include (default: 30)

Response:
```json
{
  "users": {
    "total": 100,
    "new_users": 10,
    "by_role": [
      {"role": "student", "count": 80},
      {"role": "teacher", "count": 18},
      {"role": "admin", "count": 2}
    ]
  },
  "documents": {
    "total": 500,
    "recent": 50,
    "by_type": [
      {"file_type": "pdf", "count": 300},
      {"file_type": "docx", "count": 150},
      {"file_type": "txt", "count": 50}
    ],
    "total_storage_mb": 5000
  },
  "audio": {
    "total": 400,
    "completed": 380,
    "failed": 20,
    "success_rate": 95.0,
    "total_storage_mb": 8000,
    "avg_conversions_per_user": 4.0
  },
  ...
}
```

### Log Activity
**POST** `/analytics/log-activity/`

Request:
```json
{
  "activity_type": "audio_play",
  "metadata": {
    "audio_id": 1,
    "duration_played": 120
  }
}
```

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message",
  "detail": "Detailed error description",
  "field": "field_name"  // For validation errors
}
```

Common HTTP Status Codes:
- `200 OK`: Success
- `201 Created`: Resource created
- `204 No Content`: Success with no response body
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

- Anonymous users: 100 requests/hour
- Authenticated users: 1000 requests/hour
- Audio conversions: 10 conversions/hour per user

## File Size Limits

- Document uploads: 10 MB maximum
- Supported formats: PDF, DOCX, TXT
