export type GroupType = 'corporate' | 'public';
export type GroupStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface TrainingGroup {
  id: string;
  name: string;
  type: GroupType;
  status: GroupStatus;
  courseId: string;
  courseTitle: string;
  scheduleId?: string;
  corporateDate?: string;
corporateDelivery?: 'حضوري' | 'أونلاين';
corporateLocation?: string;
  companyName?: string;
  responsibleName?: string;
  responsibleEmail?: string;
  responsiblePhone?: string;
  traineeIds: string[];
  maxParticipants?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupFilter {
  type?: GroupType;
  status?: GroupStatus;
  courseId?: string;
  companyName?: string;
  searchQuery?: string;
}

export interface GroupQuery {
  filter?: GroupFilter;
  sort?: 'createdAt' | 'name';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
