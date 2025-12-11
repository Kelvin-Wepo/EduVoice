# EduVoice Notes - Accessibility-Focused Educational Platform

EduVoice Notes is a full-stack web application that converts educational documents into audio files for students with literacy challenges or visual impairments. Built with Django REST Framework and React TypeScript.

## 🎯 Features

### Core Functionality
- **Document Upload & Management**: Support for PDF, DOCX, and TXT files up to 10MB
- **Text-to-Speech Conversion**: Async conversion with dual TTS engines:
  - **Google TTS**: Free, fast conversion with basic voices
  - **ElevenLabs AI**: Premium quality, natural-sounding AI voices (optional)
- **Dual Listening Modes**: Stream online or download for offline listening
- **Custom Audio Player**: Full-featured player with speed control, seeking, and download
- **Course Management**: Organize documents by courses and subjects
- **User Roles**: Student, Teacher, and Admin role-based access control

### Accessibility Features
- ♿ High contrast mode toggle
- 🔤 Adjustable font sizes (small, medium, large, extra-large)
- ⌨️ Full keyboard navigation support
- 🔊 Screen reader friendly with ARIA labels
- 🎨 Focus indicators for navigation
- ⚡ Reduced motion option
- 🔗 Skip to main content link

### Analytics & Dashboard
- User statistics (documents, audio files, listening time)
- Admin dashboard with system-wide metrics
- Activity tracking and engagement analytics
- Download counts and usage reports

## 🛠️ Tech Stack

### Backend

- **Framework**: Django 4.2+ with Django REST Framework
- **Database**: PostgreSQL (or SQLite for development)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Task Queue**: Celery with Redis
- **TTS Engines**: 
  - Google Text-to-Speech (gTTS) - Free, default
  - ElevenLabs API - Premium AI voices (optional)
- **File Processing**: PyPDF2, python-docx

### Frontend
- **Framework**: React 18+ with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **UI Components**: Lucide React icons
- **Notifications**: React Hot Toast
- **Build Tool**: Vite

## 📋 Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- FFmpeg (for audio processing)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd EduVOICE
```

### 2. Backend Setup

```bash
cd eduvoice_backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install FFmpeg (required for pydub)
# Ubuntu/Debian:
sudo apt-get install ffmpeg

# macOS:
brew install ffmpeg

# Windows: Download from https://ffmpeg.org/download.html

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env

# IMPORTANT: Add your ElevenLabs API key (optional, for premium voices)
# Get your key from: https://elevenlabs.io/app/settings/api-keys
# Add to .env: ELEVENLABS_API_KEY=your_api_key_here
```

### 3. Database Setup

```bash
# Create PostgreSQL database
sudo -u postgres psql

postgres=# CREATE DATABASE eduvoice_db;
postgres=# CREATE USER eduvoice_user WITH PASSWORD 'eduvoice_pass';
postgres=# GRANT ALL PRIVILEGES ON DATABASE eduvoice_db TO eduvoice_user;
postgres=# \q

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load sample data (optional)
python manage.py loaddata fixtures/sample_data.json
```

### 4. Redis Setup

```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# macOS
brew install redis
brew services start redis

# Verify Redis is running
redis-cli ping  # Should return "PONG"
```

### 5. Frontend Setup

```bash
cd ../eduvoice-frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit if needed (default points to localhost:8000)
nano .env
```

### 6. Running the Application

#### Terminal 1: Django Server
```bash
cd eduvoice_backend
source venv/bin/activate
python manage.py runserver
```

#### Terminal 2: Celery Worker
```bash
cd eduvoice_backend
source venv/bin/activate
celery -A eduvoice_backend worker -l info
```

#### Terminal 3: Celery Beat (Optional - for scheduled tasks)
```bash
cd eduvoice_backend
source venv/bin/activate
celery -A eduvoice_backend beat -l info
```

#### Terminal 4: React Dev Server
```bash
cd eduvoice-frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Django Admin: http://localhost:8000/admin
- API Documentation: http://localhost:8000/api/docs

## 📁 Project Structure

```
EduVOICE/
├── eduvoice_backend/
│   ├── eduvoice_backend/        # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── celery.py
│   │   └── ...
│   ├── users/                   # User management app
│   │   ├── models.py           # CustomUser, AudioPreference
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── documents/              # Document management app
│   │   ├── models.py           # Document, Course
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── utils.py            # Text extraction utilities
│   │   └── urls.py
│   ├── audio/                  # Audio conversion app
│   │   ├── models.py           # AudioFile
│   │   ├── tasks.py            # Celery tasks
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── analytics/              # Analytics app
│   │   ├── models.py           # UserActivity
│   │   ├── views.py
│   │   └── urls.py
│   ├── media/                  # Uploaded files
│   ├── fixtures/               # Sample data
│   ├── requirements.txt
│   └── manage.py
│
└── eduvoice-frontend/
    ├── src/
    │   ├── components/         # Reusable components
    │   │   ├── Navbar.tsx
    │   │   ├── FileUploader.tsx
    │   │   ├── AudioPlayer.tsx
    │   │   ├── DocumentCard.tsx
    │   │   └── ProtectedRoute.tsx
    │   ├── contexts/           # React contexts
    │   │   ├── AuthContext.tsx
    │   │   └── ThemeContext.tsx
    │   ├── pages/              # Page components
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Upload.tsx
    │   │   └── ...
    │   ├── services/           # API services
    │   │   └── api.ts
    │   ├── types/              # TypeScript types
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── public/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── tsconfig.json
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/user/` - Get current user
- `PUT /api/auth/user/` - Update user profile
- `PUT /api/auth/user/preferences/` - Update preferences
- `POST /api/auth/user/change-password/` - Change password

### Documents
- `GET /api/documents/` - List documents
- `POST /api/documents/` - Upload document
- `GET /api/documents/{id}/` - Get document details
- `DELETE /api/documents/{id}/` - Delete document
- `POST /api/documents/{id}/convert/` - Convert to audio
- `GET /api/documents/my_documents/` - Get user's documents

### Courses
- `GET /api/documents/courses/` - List courses
- `POST /api/documents/courses/` - Create course
- `GET /api/documents/courses/{id}/` - Get course details
- `POST /api/documents/courses/{id}/enroll/` - Enroll in course

### Audio
- `GET /api/audio/` - List audio files
- `GET /api/audio/{id}/` - Get audio details
- `GET /api/audio/{id}/download/` - Download audio
- `GET /api/audio/{id}/stream/` - Stream audio
- `GET /api/audio/{id}/status/` - Get conversion status
- `GET /api/audio/my_audio/` - Get user's audio files

### Analytics
- `GET /api/analytics/user-stats/` - Get user statistics
- `GET /api/analytics/admin-stats/` - Get admin statistics
- `POST /api/analytics/log-activity/` - Log user activity

## 👥 Default Users (from fixtures)

```
Admin:
- Username: admin
- Email: admin@eduvoice.com
- Password: (set during createsuperuser)

Teacher:
- Username: teacher1
- Email: teacher@eduvoice.com

Student:
- Username: student1
- Email: student@eduvoice.com
```

## 🧪 Testing

### Backend Tests
```bash
cd eduvoice_backend
python manage.py test
```

### Frontend Tests
```bash
cd eduvoice-frontend
npm run test
```

## 🐳 Docker Setup (Optional)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

## 🔧 Environment Variables

### Backend (.env)
```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=eduvoice_db
DB_USER=eduvoice_user
DB_PASSWORD=eduvoice_pass
DB_HOST=localhost
DB_PORT=5432

# Use SQLite for development (set to False)
USE_POSTGRES=False

CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Text-to-Speech (Optional - for premium AI voices)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

## 🎨 Accessibility Guidelines

The application follows WCAG 2.1 Level AA standards:

1. **Keyboard Navigation**: All interactive elements are keyboard accessible
2. **Screen Readers**: Proper ARIA labels and semantic HTML
3. **Color Contrast**: Meets minimum contrast ratios (4.5:1 for text)
4. **Focus Indicators**: Visible focus indicators for all interactive elements
5. **Alternative Text**: All images have descriptive alt text
6. **Responsive Design**: Works on all screen sizes and devices

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For support, email support@eduvoice.com or open an issue on GitHub.

## 🙏 Acknowledgments

- Google Text-to-Speech for TTS capabilities
- Django and React communities
- Accessibility advocates and testers
# EduVoice
