export type StaffRole = 'admin' | 'coordinator' | 'trainer' | 'employee';

export type StaffPermission =
  | 'viewTrainees'
  | 'createTrainee'
  | 'editTrainee'
  | 'deleteTrainee'
  | 'viewTraineeProgress'
  | 'manageAttendance'
  | 'viewTrainingMaterials'
  | 'viewAssessmentResults'
  | 'viewCertificates'
  | 'viewGroups'
  | 'createGroup'
  | 'editGroup'
  | 'deleteGroup'
  | 'viewReports'
  | 'viewCourses'
  | 'editCourses'
  | 'viewOrders'
  | 'editOrders'
  | 'viewAssessments'
  | 'editAssessments'
  | 'viewUsers'
  | 'editUsers'
  | 'viewSettings'
  | 'editSettings'
  | 'viewContactRequests'
  | 'courses'
  | 'orders'
  | 'trainees'
  | 'groups'
  | 'assessments'
  | 'certificates'
  | 'trainers'
  | 'coordinators'
  | 'users'
  | 'settings'
  | 'contactRequests';

export type StaffStatus = 'active' | 'inactive' | 'suspended';

export interface StaffUser {
  id: string;

  name: string;

  email: string;

  phone?: string;

  passwordHash: string;

  role: StaffRole;

  status: StaffStatus;

  assignedGroupIds: string[];

  permissions?: StaffPermission[];

  createdAt: Date;

  updatedAt: Date;

  lastLoginAt?: Date;
}

export interface StaffFilter {
  role?: StaffRole;

  status?: StaffStatus;

  searchQuery?: string;
}

export interface StaffQuery {
  filter?: StaffFilter;

  sort?: 'createdAt' | 'name' | 'lastLoginAt';

  order?: 'asc' | 'desc';

  limit?: number;

  offset?: number;
}