/**
 * Trainee type definitions
 * Represents users/students in the training system
 */

export type TraineeStatus = 'active' | 'inactive' | 'suspended';
export type Gender = 'male' | 'female' | 'other';

export interface TraineeProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: Gender;
  nationality?: string;
  avatar?: string;
  bio?: string;
}

export interface TraineeContact {
  email: string;
  phone?: string;
  alternatePhone?: string;
  address?: {
    street: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
}

export interface TraineeCompany {
  companyName?: string;
  jobTitle?: string;
  department?: string;
  industry?: string;
  companySize?: string;
  workEmail?: string;
  workPhone?: string;
}

export interface CourseEnrollment {
  courseId: string;
  courseTitle: string;
  enrolledAt: Date;
  completedAt?: Date;
  status: 'active' | 'completed' | 'dropped' | 'expired';
  progress: number; // 0-100 percentage
  lastAccessedAt?: Date;
  certificateId?: string;
}

export interface CourseProgress {
  courseId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
  timeSpent?: number; // in seconds
  score?: number; // For quiz lessons
  attempts?: number;
}

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  issuedAt: Date;
  certificateNumber: string;
  templateId?: string;
  downloadUrl?: string;
  verified: boolean;
}

export interface Trainee {
  id: string;
  profile: TraineeProfile;
  contact: TraineeContact;
  company?: TraineeCompany;
  
  // Authentication (password should be hashed, never stored plain text)
  email: string; // Duplicate for convenience, references contact.email
  passwordHash: string; // Hashed password only
  
  // Enrollment and progress
  enrollments: CourseEnrollment[];
  progress: CourseProgress[];
  certificates: Certificate[];
  
  // Account status
  status: TraineeStatus;
  emailVerified: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  
  // Preferences
  preferences?: {
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      promotions: boolean;
    };
  };
}

// Trainee filter and query types
export interface TraineeFilter {
  status?: TraineeStatus;
  emailVerified?: boolean;
  enrolledInCourseId?: string;
  searchQuery?: string;
}

export interface TraineeQuery {
  filter?: TraineeFilter;
  sort?: 'createdAt' | 'name' | 'lastLoginAt';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
