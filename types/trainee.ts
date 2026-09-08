/**
 * Trainee type definitions
 * Represents users/students in the training system
 */

export type TraineeStatus = 'active' | 'inactive' | 'suspended';
export type Gender = 'male' | 'female' | 'other';

export interface TraineeProfile {
  firstName: string;
  lastName: string;
  firstNameEnglish?: string;
  lastNameEnglish?: string;
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

export type AssessmentState = 'locked' | 'available' | 'completed';

export type AttendanceStatus = 'not-marked' | 'present' | 'absent';

export interface AttendanceDay {
  date: Date;
  status: AttendanceStatus;
  markedAt?: Date;
}

export interface CourseEnrollment {
  id?: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: Date;
  scheduleId?: string;
  groupId?: string;
  completedAt?: Date;
  status: 'active' | 'completed' | 'dropped' | 'expired';
  progress: number;
  lastAccessedAt?: Date;
  certificateId?: string;

  preAssessment?: AssessmentState;
  postAssessment?: AssessmentState;
  courseEvaluation?: AssessmentState;

  preAssessmentScore?: number;
  postAssessmentScore?: number;
  courseEvaluationScore?: number;

  preAssessmentAnswers?: Record<string, string>;
  postAssessmentAnswers?: Record<string, string>;
  courseEvaluationAnswers?: Record<string, string>;

  preAssessmentCompletedAt?: Date;
  postAssessmentCompletedAt?: Date;
  courseEvaluationCompletedAt?: Date;

  attendance?: AttendanceStatus;
  attendanceDays?: AttendanceDay[];
  attendanceMode?: 'in-person' | 'online';
}

export interface CourseProgress {
  courseId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
  timeSpent?: number;
  score?: number;
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

  email: string;
  passwordHash: string;

  enrollments: CourseEnrollment[];

  progress: CourseProgress[];

  certificates: Certificate[];

  status: TraineeStatus;

  emailVerified: boolean;

  createdAt: Date;
  updatedAt: Date;

  lastLoginAt?: Date;

  preferences?: {
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      promotions: boolean;
    };
  };
}

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