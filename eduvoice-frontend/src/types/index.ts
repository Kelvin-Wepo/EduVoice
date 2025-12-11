// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'teacher' | 'admin';
  email_verified: boolean;
  preferred_voice_type: 'male' | 'female';
  preferred_speech_rate: number;
  preferred_language: string;
  high_contrast_mode: boolean;
  font_size: 'small' | 'medium' | 'large' | 'extra-large';
  reduced_motion: boolean;
  audio_preferences?: AudioPreference;
  created_at: string;
}

export interface AudioPreference {
  default_voice: string;
  default_speed: number;
  default_language: string;
  auto_download: boolean;
  email_notifications: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'teacher';
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Document Types
export interface Document {
  id: number;
  title: string;
  description: string;
  file: string;
  file_url: string;
  file_type: 'pdf' | 'docx' | 'txt';
  file_size: number;
  uploaded_by: User;
  course: number | null;
  course_name: string;
  subject: string;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  is_public: boolean;
  has_audio: boolean;
  upload_date: string;
  updated_at: string;
}

export interface DocumentDetail extends Document {
  extracted_text: string;
  audio_files: AudioFile[];
}

export interface DocumentUpload {
  title: string;
  description?: string;
  file: File;
  course?: number;
  subject?: string;
  is_public?: boolean;
}

// Course Types
export interface Course {
  id: number;
  name: string;
  description: string;
  code: string;
  created_by: User;
  is_active: boolean;
  student_count: number;
  document_count: number;
  created_at: string;
  updated_at: string;
}

// Audio Types
export interface AudioFile {
  id: number;
  document: number;
  document_title: string;
  audio_file: string;
  audio_url: string;
  duration: number;
  voice_type: string;
  speech_rate: number;
  language: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string;
  download_count: number;
  file_size_mb: number;
  generated_date: string;
  updated_at: string;
}

export interface ConversionRequest {
  voice_type?: string;
  speech_rate?: number;
  language?: string;
  engine?: 'gtts' | 'elevenlabs' | 'gemini';
}

export interface ConversionResponse {
  message: string;
  task_id: string;
}

// Analytics Types
export interface UserStatistics {
  user: {
    username: string;
    role: string;
    member_since: string;
  };
  documents: {
    total: number;
    recent: number;
  };
  audio: {
    total: number;
    completed: number;
    processing: number;
    total_listening_time_minutes: number;
    total_downloads: number;
  };
  courses: {
    enrolled: number;
    created: number;
  };
  recent_activities: Array<{
    activity_type: string;
    count: number;
  }>;
  time_range_days: number;
}

export interface AdminStatistics {
  users: {
    total: number;
    new_users: number;
    by_role: Array<{ role: string; count: number }>;
  };
  documents: {
    total: number;
    recent: number;
    by_type: Array<{ file_type: string; count: number }>;
    total_storage_mb: number;
  };
  audio: {
    total: number;
    completed: number;
    failed: number;
    success_rate: number;
    total_storage_mb: number;
    avg_conversions_per_user: number;
  };
  courses: {
    total: number;
    active: number;
  };
  recent_activities: Array<{
    activity_type: string;
    count: number;
  }>;
  most_active_users: Array<{
    user__username: string;
    user__role: string;
    activity_count: number;
  }>;
  most_converted_documents: Array<{
    title: string;
    audio_count: number;
  }>;
  time_range_days: number;
}

// Pagination
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API Error
export interface ApiError {
  message: string;
  field?: string;
  code?: string;
}
