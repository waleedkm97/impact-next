export type StaffRole = 'admin' | 'coordinator' | 'trainer';

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