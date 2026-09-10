export type GroupType = 'corporate' | 'public';

export type GroupStatus =
  | 'draft'
  | 'active'
  | 'completed'
  | 'cancelled';

export interface AssessmentOpening {
  enabled: boolean;
  openAt?: Date;
  closeAt?: Date;
}

export interface GroupAssessmentSettings {
  pre: AssessmentOpening;
  post: AssessmentOpening;
  evaluation: AssessmentOpening;
}

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

  materialUrl?: string;

  companyName?: string;
  responsibleName?: string;
  responsibleEmail?: string;
  responsiblePhone?: string;

  /*
   * الموظفون المسؤولون عن متابعة المجموعة.
   *
   * trainerId:
   * المدرب المسؤول عن تنفيذ التدريب.
   *
   * coordinatorId:
   * المنسق المسؤول عن متابعة المدرب والمجموعة
   * والمتدربين.
   */
  trainerId?: string;
  coordinatorId?: string;

  traineeIds: string[];

  maxParticipants?: number;

  notes?: string;

  /**
   * التحكم في فتح التقييمات لهذه المجموعة.
   * التقييم نفسه والأسئلة محفوظة على مستوى الدورة،
   * بينما وقت فتح التقييم يحدد على مستوى المجموعة.
   */
  assessmentSettings?: GroupAssessmentSettings;

  createdAt: Date;
  updatedAt: Date;
}

export interface GroupFilter {
  type?: GroupType;
  status?: GroupStatus;
  courseId?: string;
  companyName?: string;
  trainerId?: string;
  coordinatorId?: string;
  searchQuery?: string;
}

export interface GroupQuery {
  filter?: GroupFilter;

  sort?: 'createdAt' | 'name';

  order?: 'asc' | 'desc';

  limit?: number;

  offset?: number;
}