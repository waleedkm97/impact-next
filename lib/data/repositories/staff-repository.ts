import type {
  StaffFilter,
  StaffQuery,
  StaffRole,
  StaffStatus,
  StaffUser,
} from '@/types/staff';

function normalizeDate(value: unknown, fallback = new Date()) {
  const result =
    value instanceof Date
      ? value
      : new Date(String(value ?? ''));

  return Number.isNaN(result.getTime()) ? fallback : result;
}

function normalizeStaff(user: StaffUser): StaffUser {
  return {
    ...user,

    passwordHash: String(user.passwordHash ?? ''),

    role:
      user.role === 'admin' ||
      user.role === 'coordinator' ||
      user.role === 'trainer'
        ? user.role
        : 'trainer',

    status:
      user.status === 'inactive' ||
      user.status === 'suspended'
        ? user.status
        : 'active',

    assignedGroupIds: Array.isArray(user.assignedGroupIds)
      ? [...user.assignedGroupIds]
      : [],

    createdAt: normalizeDate(user.createdAt),

    updatedAt: normalizeDate(user.updatedAt),

    lastLoginAt: user.lastLoginAt
      ? normalizeDate(user.lastLoginAt)
      : undefined,
  };
}

function matches(
  user: StaffUser,
  query?: StaffQuery,
) {
  const filter: StaffFilter | undefined =
    query?.filter;

  if (!filter) {
    return true;
  }

  if (filter.role && user.role !== filter.role) {
    return false;
  }

  if (filter.status && user.status !== filter.status) {
    return false;
  }

  if (filter.searchQuery) {
    const text = [
      user.name,
      user.email,
      user.phone,
      user.role,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (
      !text.includes(
        filter.searchQuery.trim().toLowerCase(),
      )
    ) {
      return false;
    }
  }

  return true;
}

async function parseResponse<T>(
  response: Response,
): Promise<T> {
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.error || 'حدث خطأ في الاتصال بقاعدة البيانات.',
    );
  }

  return result;
}

export class StaffRepository {
  async refresh() {
    // PostgreSQL is the source of truth.
    // No local hydration is required.
  }

  async findById(id: string) {
    const response = await fetch(
      `/api/staff/${encodeURIComponent(id)}`,
      {
        method: 'GET',
        cache: 'no-store',
      },
    );

    if (response.status === 404) {
      return null;
    }

    const result = await parseResponse<{
      success: true;
      user: StaffUser;
    }>(response);

    return normalizeStaff(result.user);
  }

  async findByEmail(email: string) {
    const normalizedEmail =
      email.trim().toLowerCase();

    const response = await fetch(
      `/api/staff?email=${encodeURIComponent(normalizedEmail)}`,
      {
        method: 'GET',
        cache: 'no-store',
      },
    );

    const result = await parseResponse<{
      success: true;
      users: StaffUser[];
      count: number;
    }>(response);

    const user = result.users[0];

    return user ? normalizeStaff(user) : null;
  }

  async findAll(query?: StaffQuery) {
    const params = new URLSearchParams();

    const filter = query?.filter;

    if (filter?.role) {
      params.set('role', filter.role);
    }

    if (filter?.status) {
      params.set('status', filter.status);
    }

    if (filter?.searchQuery) {
      params.set(
        'search',
        filter.searchQuery.trim(),
      );
    }

    const response = await fetch(
      `/api/staff?${params.toString()}`,
      {
        method: 'GET',
        cache: 'no-store',
      },
    );

    const result = await parseResponse<{
      success: true;
      users: StaffUser[];
      count: number;
    }>(response);

    let users = result.users.map(normalizeStaff);

    const order = query?.order ?? 'desc';

    users.sort((a, b) => {
      let value =
        a.createdAt.getTime() -
        b.createdAt.getTime();

      if (query?.sort === 'name') {
        value = a.name.localeCompare(
          b.name,
          'ar',
        );
      }

      if (query?.sort === 'lastLoginAt') {
        value =
          (a.lastLoginAt?.getTime() ?? 0) -
          (b.lastLoginAt?.getTime() ?? 0);
      }

      return order === 'asc'
        ? value
        : -value;
    });

    const offset = query?.offset ?? 0;

    const end =
      typeof query?.limit === 'number'
        ? offset + query.limit
        : undefined;

    return users
      .filter((user) => matches(user, query))
      .slice(offset, end);
  }

  async create(input: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: StaffRole;
    status?: StaffStatus;
    assignedGroupIds?: string[];
  }) {
    if (!input.name.trim()) {
      throw new Error('اسم المستخدم مطلوب.');
    }

    if (!input.email.trim()) {
      throw new Error(
        'البريد الإلكتروني مطلوب.',
      );
    }

    if (!input.password) {
      throw new Error(
        'كلمة المرور مطلوبة.',
      );
    }

    const response = await fetch('/api/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || undefined,
        password: input.password,
        role: input.role,
        status: input.status ?? 'active',
      }),
    });

    const result = await parseResponse<{
      success: true;
      user: StaffUser;
    }>(response);

    let user = normalizeStaff(result.user);

    if (
      input.assignedGroupIds &&
      input.assignedGroupIds.length > 0
    ) {
      user = await this.assignGroups(
        user.id,
        input.assignedGroupIds,
      );
    }

    return user;
  }

  async update(
    id: string,
    input: Partial<
      Omit<
        StaffUser,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
      >
    >,
  ) {
    const response = await fetch(
      `/api/staff/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      },
    );

    const result = await parseResponse<{
      success: true;
      user: StaffUser;
    }>(response);

    return normalizeStaff(result.user);
  }

  async delete(id: string) {
    const response = await fetch(
      `/api/staff/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
    );

    await parseResponse<{
      success: true;
    }>(response);
  }

  async updatePassword(
    id: string,
    password: string,
  ) {
    if (!password) {
      throw new Error(
        'كلمة المرور مطلوبة.',
      );
    }

    return this.update(id, {
      passwordHash: password,
    });
  }

  async verifyPassword(
    email: string,
    password: string,
  ) {
    const user = await this.findByEmail(email);

    if (!user) {
      return false;
    }

    if (user.status !== 'active') {
      return false;
    }

    return user.passwordHash === password;
  }

  async login(
    email: string,
    password: string,
  ) {
    const user = await this.findByEmail(email);

    if (!user) {
      return null;
    }

    if (user.status !== 'active') {
      return null;
    }

    if (user.passwordHash !== password) {
      return null;
    }

    return user;
  }

  async assignGroups(
    id: string,
    groupIds: string[],
  ) {
    return this.update(id, {
      assignedGroupIds: Array.from(
        new Set(groupIds),
      ),
    });
  }

  async getByRole(role: StaffRole) {
    return this.findAll({
      filter: {
        role,
        status: 'active',
      },
      sort: 'name',
      order: 'asc',
    });
  }

  async getGroupIds(id: string) {
    const user = await this.findById(id);

    return user?.assignedGroupIds ?? [];
  }

  async getCount(
    query?: StaffQuery,
  ) {
    return (
      await this.findAll(query)
    ).length;
  }
}

export const staffRepository =
  new StaffRepository();