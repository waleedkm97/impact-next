/**
 * Course type definitions
 * Supports both recorded courses and training programs through type and delivery fields
 */

export type CourseType = 'recorded' | 'training' | 'public';
export type CourseDelivery = 'online' | 'in-person' | 'hybrid';
export type CourseStatus = 'draft' | 'published' | 'archived';

export interface CourseLesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  type: 'video' | 'quiz' | 'text' | 'interactive';
  order: number;
  
  // Video lesson fields
  videoId?: string;
  videoDuration?: number; // in seconds
  
  // Quiz/Interactive lesson fields
  questions?: LessonQuestion[];
  
  // Lesson sequencing
  afterLessonId?: string; // ID of lesson that must be completed before this one
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonQuestion {
  id: string;
  lessonId: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'text';
  options?: string[]; // For multiple choice
  correctAnswer: string | string[]; // Single answer or array for multiple correct
  explanation?: string;
  order: number;
  points?: number;
}

export interface CourseSchedule {
  id: string;
  courseId: string;
  startDate: Date;
  endDate: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  location?: string;
  city?: string;
  onlineMeetingLink?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseAssessment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  passingScore: number; // Percentage required to pass
  timeLimit?: number; // in minutes, null for unlimited
  questions: LessonQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateSettings {
  enabled: boolean;
  templateId?: string;
  autoGenerate: boolean;
  requireCompletion: boolean;
  requireAssessmentPass: boolean;
}

export interface CourseTrainer {
  id: string;
  name: string;
  bio?: string;
  image?: string;
  specialties?: string[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  
  // Categorization
  categoryId?: string;
  type: CourseType;
  delivery: CourseDelivery;
  
  // Location
  cities?: string[];
  
  // Pricing
  price: number;
  oldPrice?: number;
  discount?: number; // Percentage
  currency?: string;
  
  // Duration
  days?: number;
  hours?: number;
  videosCount?: number;
  
  // Content
  objectives: string[];
  outcomes: string[];
  outline?: string;
  lessons?: CourseLesson[];
  schedules?: CourseSchedule[];
  assessments?: CourseAssessment[];
  
  // Target audience
  audience?: string;
  methodology?: string;
  
  // Trainer information
  trainer?: CourseTrainer;
  
  // Materials
  materialUrl?: string;
  meetingLink?: string;
  
  // Media
  image?: string;
  thumbnail?: string;
  
  // Certificate settings
  certificateSettings: CertificateSettings;
  
  materialsEnabled?: boolean;
  preAssessmentEnabled?: boolean;
  postAssessmentEnabled?: boolean;
  courseEvaluationEnabled?: boolean;
  attendanceEnabled?: boolean;
  // Status and flags
  featured: boolean;
  published: boolean;
  status: CourseStatus;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
}

// Course filter and query types
export interface CourseFilter {
  type?: CourseType;
  delivery?: CourseDelivery;
  categoryId?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  published?: boolean;
  searchQuery?: string;
}

export interface CourseQuery {
  filter?: CourseFilter;
  sort?: 'createdAt' | 'price' | 'title' | 'popularity';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
