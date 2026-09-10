import type {
  StaffFilter,
  StaffQuery,
  StaffRole,
  StaffStatus,
  StaffUser,
} from '@/types/staff';

import { browserDbGet, browserDbSet } from '@/lib/data/browser-db';

function now() {
  return new Date();
}

function normalizeDate(value: unknown, fallback = new Date()) {
  const result =
    value instanceof Date
      ? value
      : new Date(String(value ?? ''));

  return Number.isNaN(result.getTime()) ? fallback : result;
}

function createStaffId() {
  return `staff-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
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

function cloneStaff(user: StaffUser): StaffUser {
  return {
    ...normalizeStaff(user),
    assignedGroupIds: [...user.assignedGroupIds],
  };
}

let staffUsers: StaffUser[] = [];

let hydrated = false;

let hydration: Promise<void> | null = null;

async function persist() {
  await browserDbSet('staffUsers', staffUsers);
}

async function ensureHydrated() {
  if (hydrated) {
    return;
  }

  if (!hydration) {
    hydration = (async () => {
      const saved =
        await browserDbGet<StaffUser[]>('staffUsers');

      if (saved !== null) {
        staffUsers = saved.map(normalizeStaff);
      } else {
        /*
         * حساب المدير الافتراضي.
         *
         * يمكنك تغيير البريد وكلمة المرور لاحقًا
         * من صفحة إدارة المستخدمين.
         */
        staffUsers = [
          {
            id: 'staff-admin-1',
            name: 'مدير النظام',
            email: 'admin@impact.sa',
            phone: '',
            passwordHash: 'admin123',
            role: 'admin',
            status: 'active',
            assignedGroupIds: [],
            createdAt: now(),
            updatedAt: now(),
          },
        ];

        await persist();
      }

      hydrated = true;
    })().catch(() => {
      hydrated = true;
    });
  }

  await hydration;
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

export class StaffRepository {
  async refresh() {
    hydrated = false;
    hydration = null;

    await ensureHydrated();
  }

  async findById(id: string) {
    await ensureHydrated();

    const user = staffUsers.find(
      (item) => item.id === id,
    );

    return user ? cloneStaff(user) : null;
  }

  async findByEmail(email: string) {
    await ensureHydrated();

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = staffUsers.find(
      (item) =>
        item.email.trim().toLowerCase() ===
        normalizedEmail,
    );

    return user ? cloneStaff(user) : null;
  }

  async findAll(query?: StaffQuery) {
    await ensureHydrated();

    let result = staffUsers.filter((user) =>
      matches(user, query),
    );

    const order = query?.order ?? 'desc';

    result.sort((a, b) => {
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

    return result
      .slice(offset, end)
      .map(cloneStaff);
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
    await ensureHydrated();

    const email =
      input.email.trim().toLowerCase();

    const existing = staffUsers.find(
      (user) =>
        user.email.trim().toLowerCase() ===
        email,
    );

    if (existing) {
      throw new Error(
        'يوجد مستخدم بهذا البريد الإلكتروني.',
      );
    }

    if (!input.name.trim()) {
      throw new Error(
        'اسم المستخدم مطلوب.',
      );
    }

    if (!email) {
      throw new Error(
        'البريد الإلكتروني مطلوب.',
      );
    }

    if (!input.password) {
      throw new Error(
        'كلمة المرور مطلوبة.',
      );
    }

    const timestamp = now();

    const user: StaffUser = {
      id: createStaffId(),

      name: input.name.trim(),

      email,

      phone: input.phone?.trim() || undefined,

      passwordHash: input.password,

      role: input.role,

      status: input.status ?? 'active',

      assignedGroupIds:
        input.assignedGroupIds ?? [],

      createdAt: timestamp,

      updatedAt: timestamp,
    };

    staffUsers.push(user);

    await persist();

    return cloneStaff(user);
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
    await ensureHydrated();

    const index = staffUsers.findIndex(
      (user) => user.id === id,
    );

    if (index < 0) {
      throw new Error(
        'المستخدم غير موجود.',
      );
    }

    if (input.email) {
      const email =
        input.email.trim().toLowerCase();

      const duplicate = staffUsers.find(
        (user) =>
          user.id !== id &&
          user.email
            .trim()
            .toLowerCase() === email,
      );

      if (duplicate) {
        throw new Error(
          'يوجد مستخدم آخر بهذا البريد الإلكتروني.',
        );
      }

      input.email = email;
    }

    staffUsers[index] = {
      ...staffUsers[index],
      ...input,
      updatedAt: now(),
    };

    await persist();

    return cloneStaff(
      staffUsers[index],
    );
  }

  async delete(id: string) {
    await ensureHydrated();

    const user =
      staffUsers.find(
        (item) => item.id === id,
      );

    if (!user) {
      throw new Error(
        'المستخدم غير موجود.',
      );
    }

    /*
     * لا نسمح بحذف آخر مدير.
     */
    if (user.role === 'admin') {
      const adminCount =
        staffUsers.filter(
          (item) =>
            item.role === 'admin' &&
            item.status !== 'inactive',
        ).length;

      if (adminCount <= 1) {
        throw new Error(
          'لا يمكن حذف آخر مدير في النظام.',
        );
      }
    }

    staffUsers =
      staffUsers.filter(
        (item) => item.id !== id,
      );

    await persist();
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

    await this.update(id, {
      passwordHash: password,
    });
  }

  async verifyPassword(
    email: string,
    password: string,
  ) {
    const user =
      await this.findByEmail(email);

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
    await ensureHydrated();

    const normalizedEmail =
      email.trim().toLowerCase();

    const index =
      staffUsers.findIndex(
        (user) =>
          user.email
            .trim()
            .toLowerCase() ===
            normalizedEmail &&
          user.passwordHash === password &&
          user.status === 'active',
      );

    if (index < 0) {
      return null;
    }

    staffUsers[index].lastLoginAt = now();

    staffUsers[index].updatedAt = now();

    await persist();

    return cloneStaff(
      staffUsers[index],
    );
  }

  async assignGroups(
    id: string,
    groupIds: string[],
  ) {
    await ensureHydrated();

    const index =
      staffUsers.findIndex(
        (user) => user.id === id,
      );

    if (index < 0) {
      throw new Error(
        'المستخدم غير موجود.',
      );
    }

    staffUsers[index].assignedGroupIds =
      Array.from(
        new Set(groupIds),
      );

    staffUsers[index].updatedAt = now();

    await persist();

    return cloneStaff(
      staffUsers[index],
    );
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
    const user =
      await this.findById(id);

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