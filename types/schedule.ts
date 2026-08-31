/**
 * Schedule type definitions
 * Used for training program scheduling and availability management
 */

export type ScheduleStatus = 'available' | 'full' | 'ongoing' | 'completed' | 'cancelled';
export type ScheduleRecurrence = 'once' | 'daily' | 'weekly' | 'monthly';

export interface ScheduleSession {
  id: string;
  scheduleId: string;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  location?: string;
  onlineMeetingLink?: string;
  instructorId?: string;
  notes?: string;
}

export interface Schedule {
  id: string;
  courseId: string;
  courseTitle: string;
  
  // Basic scheduling
  title: string;
  description?: string;
  
  // Date and time
  startDate: Date;
  endDate: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  
  // Recurrence for recurring sessions
  recurrence?: ScheduleRecurrence;
  sessions?: ScheduleSession[];
  
  // Location
  location?: string;
  city?: string;
  onlineMeetingLink?: string;
  
  // Capacity
  maxParticipants: number;
  currentParticipants: number;
  waitlistMax?: number;
  currentWaitlist?: number;
  
  // Pricing (can override course price)
  price?: number;
  currency?: string;
  
  // Instructor
  instructorId?: string;
  instructorName?: string;
  
  // Status
  status: ScheduleStatus;
  
  // Visibility
  published: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Additional configuration
  allowWaitlist: boolean;
  requireConfirmation: boolean;
  confirmationDeadline?: Date;
  cancellationDeadline?: Date;
  cancellationPolicy?: string;
}

// Schedule filter and query types
export interface ScheduleFilter {
  courseId?: string;
  status?: ScheduleStatus;
  city?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  available?: boolean; // Filter for schedules with available spots
  published?: boolean;
  searchQuery?: string;
}

export interface ScheduleQuery {
  filter?: ScheduleFilter;
  sort?: 'startDate' | 'createdAt' | 'price';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
