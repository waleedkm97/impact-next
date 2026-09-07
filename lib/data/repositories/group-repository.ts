import type { GroupQuery, TrainingGroup } from '@/types/group';
import { browserDbGet, browserDbSet } from '@/lib/data/browser-db';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';

let groups: TrainingGroup[] = [];
let hydrated = false;
let hydration: Promise<void> | null = null;

function date(value: unknown, fallback = new Date()) {
  const result = value instanceof Date ? value : new Date(String(value ?? ''));
  return Number.isNaN(result.getTime()) ? fallback : result;
}

function normalize(group: TrainingGroup): TrainingGroup {
  return {
    ...group,
    traineeIds: [...(group.traineeIds ?? [])],
    createdAt: date(group.createdAt),
    updatedAt: date(group.updatedAt),
    assessmentSettings: group.assessmentSettings
      ? {
          pre: {
            ...group.assessmentSettings.pre,
            openAt: group.assessmentSettings.pre.openAt
              ? date(group.assessmentSettings.pre.openAt)
              : undefined,
            closeAt: group.assessmentSettings.pre.closeAt
              ? date(group.assessmentSettings.pre.closeAt)
              : undefined,
          },
          post: {
            ...group.assessmentSettings.post,
            openAt: group.assessmentSettings.post.openAt
              ? date(group.assessmentSettings.post.openAt)
              : undefined,
            closeAt: group.assessmentSettings.post.closeAt
              ? date(group.assessmentSettings.post.closeAt)
              : undefined,
          },
          evaluation: {
            ...group.assessmentSettings.evaluation,
            openAt: group.assessmentSettings.evaluation.openAt
              ? date(group.assessmentSettings.evaluation.openAt)
              : undefined,
            closeAt: group.assessmentSettings.evaluation.closeAt
              ? date(group.assessmentSettings.evaluation.closeAt)
              : undefined,
          },
        }
      : undefined,
  };
}

async function ensureHydrated() {
  if (hydrated) {
    return;
  }

  if (!hydration) {
    hydration = (async () => {
      const saved = await browserDbGet<TrainingGroup[]>('groups');

      if (saved !== null) {
        groups = saved.map(normalize);
      }

      hydrated = true;
    })().catch(() => {
      hydrated = true;
    });
  }

  await hydration;
}

async function persist() {
  await browserDbSet('groups', groups);
}

function matches(group: TrainingGroup, query?: GroupQuery) {
  const filter = query?.filter;

  if (!filter) {
    return true;
  }

  if (filter.type && group.type !== filter.type) {
    return false;
  }

  if (filter.status && group.status !== filter.status) {
    return false;
  }

  if (filter.courseId && group.courseId !== filter.courseId) {
    return false;
  }

  if (
    filter.companyName &&
    !(group.companyName ?? '')
      .toLowerCase()
      .includes(filter.companyName.toLowerCase())
  ) {
    return false;
  }

  if (filter.searchQuery) {
    const text = [
      group.name,
      group.courseTitle,
      group.companyName,
      group.responsibleName,
      group.responsibleEmail,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!text.includes(filter.searchQuery.trim().toLowerCase())) {
      return false;
    }
  }

  return true;
}

function clone(group: TrainingGroup): TrainingGroup {
  return {
    ...group,
    traineeIds: [...group.traineeIds],
    assessmentSettings: group.assessmentSettings
      ? {
          pre: { ...group.assessmentSettings.pre },
          post: { ...group.assessmentSettings.post },
          evaluation: { ...group.assessmentSettings.evaluation },
        }
      : undefined,
  };
}

export class GroupRepository {
  async findById(id: string) {
    await ensureHydrated();

    const group = groups.find((item) => item.id === id);

    return group ? clone(group) : null;
  }

  async findAll(query?: GroupQuery) {
    await ensureHydrated();

    const result = groups.filter((group) => matches(group, query));
    const order = query?.order ?? 'desc';

    result.sort((a, b) => {
      const value =
        query?.sort === 'name'
          ? a.name.localeCompare(b.name, 'ar')
          : a.createdAt.getTime() - b.createdAt.getTime();

      return order === 'asc' ? value : -value;
    });

    const offset = query?.offset ?? 0;
    const end =
      typeof query?.limit === 'number'
        ? offset + query.limit
        : undefined;

    return result.slice(offset, end).map(clone);
  }

  async create(
    input: Omit<TrainingGroup, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    await ensureHydrated();

    const now = new Date();

    const group: TrainingGroup = {
      ...input,
      id: `group-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      traineeIds: [...(input.traineeIds ?? [])],
      createdAt: now,
      updatedAt: now,
    };

    groups.push(group);

    await persist();

    return clone(group);
  }

  async update(id: string, input: Partial<TrainingGroup>) {
    await ensureHydrated();

    const index = groups.findIndex((group) => group.id === id);

    if (index < 0) {
      throw new Error('Group not found');
    }

    groups[index] = {
      ...groups[index],
      ...input,
      traineeIds: input.traineeIds ?? groups[index].traineeIds,
      updatedAt: new Date(),
    };

    await persist();

    return clone(groups[index]);
  }

  async updateAssessmentSettings(
    groupId: string,
    settings: TrainingGroup['assessmentSettings'],
  ) {
    await ensureHydrated();

    const index = groups.findIndex(
      (group) => group.id === groupId,
    );

    if (index < 0) {
      throw new Error('Group not found');
    }

    groups[index] = {
      ...groups[index],
      assessmentSettings: settings,
      updatedAt: new Date(),
    };

    await persist();

    return clone(groups[index]);
  }

  /*
   * فتح أو إغلاق تقييم لجميع متدربي المجموعة.
   *
   * هذا هو التحكم الحقيقي:
   * الإدارة تضغط الزر مرة واحدة،
   * ويتم تحديث Enrollment لكل متدربي المجموعة.
   */
  async setAssessmentForGroup(
    groupId: string,
    type:
      | 'preAssessment'
      | 'postAssessment'
      | 'courseEvaluation',
    state: 'locked' | 'available',
  ) {
    await ensureHydrated();

    const group = groups.find(
      (item) => item.id === groupId,
    );

    if (!group) {
      throw new Error('Group not found');
    }

    let updatedCount = 0;

    for (const traineeId of group.traineeIds) {
      const trainee =
        await traineeRepository.findById(traineeId);

      if (!trainee) {
        continue;
      }

      const enrollment = trainee.enrollments.find(
        (item) =>
          item.groupId === group.id &&
          item.courseId === group.courseId,
      );

      if (!enrollment) {
        continue;
      }

      /*
       * لا نعيد تقييمًا مكتملًا إلى locked.
       */
      if (
        enrollment[type] === 'completed' &&
        state === 'locked'
      ) {
        continue;
      }

      await traineeRepository.updateEnrollment(
        trainee.id,
        enrollment.id ?? enrollment.courseId,
        {
          [type]: state,
        },
      );

      updatedCount += 1;
    }

    const currentSettings =
      group.assessmentSettings ?? {
        pre: { enabled: true },
        post: { enabled: false },
        evaluation: { enabled: false },
      };

    const settings = {
      pre: { ...currentSettings.pre },
      post: { ...currentSettings.post },
      evaluation: { ...currentSettings.evaluation },
    };

    if (type === 'preAssessment') {
      settings.pre = {
        ...settings.pre,
        enabled: true,
      };
    }

    if (type === 'postAssessment') {
      settings.post = {
        ...settings.post,
        enabled: state === 'available',
      };
    }

    if (type === 'courseEvaluation') {
      settings.evaluation = {
        ...settings.evaluation,
        enabled: state === 'available',
      };
    }

    group.assessmentSettings = settings;
    group.updatedAt = new Date();

    await persist();

    return {
      group: clone(group),
      updatedCount,
    };
  }

  async getAssessmentSettings(groupId: string) {
    await ensureHydrated();

    const group = groups.find(
      (item) => item.id === groupId,
    );

    if (!group) {
      throw new Error('Group not found');
    }

    return group.assessmentSettings;
  }

  async delete(id: string) {
    await ensureHydrated();

    groups = groups.filter(
      (group) => group.id !== id,
    );

    await persist();
  }

  async addTrainee(
    groupId: string,
    traineeId: string,
  ) {
    await ensureHydrated();

    const group = groups.find(
      (item) => item.id === groupId,
    );

    if (!group) {
      throw new Error('Group not found');
    }

    if (
      group.maxParticipants &&
      group.traineeIds.length >= group.maxParticipants
    ) {
      throw new Error('Group is full');
    }

    if (!group.traineeIds.includes(traineeId)) {
      group.traineeIds.push(traineeId);
      group.updatedAt = new Date();

      await traineeRepository.enrollInCourse(
        traineeId,
        group.courseId,
        group.courseTitle,
        {
          scheduleId: group.scheduleId,
          groupId: group.id,
        },
      );

      await persist();
    }

    return clone(group);
  }

  async removeTrainee(
    groupId: string,
    traineeId: string,
  ) {
    await ensureHydrated();

    const group = groups.find(
      (item) => item.id === groupId,
    );

    if (!group) {
      throw new Error('Group not found');
    }

    group.traineeIds = group.traineeIds.filter(
      (id) => id !== traineeId,
    );

    const trainee =
      await traineeRepository.findById(traineeId);

    if (trainee) {
      const enrollment = trainee.enrollments.find(
        (item) => item.groupId === group.id,
      );

      if (enrollment) {
        await traineeRepository.updateEnrollment(
          trainee.id,
          enrollment.id ?? enrollment.courseId,
          {
            groupId: undefined,
          },
        );
      }
    }

    group.updatedAt = new Date();

    await persist();

    return clone(group);
  }

  async findByTraineeId(traineeId: string) {
    await ensureHydrated();

    return groups
      .filter((group) =>
        group.traineeIds.includes(traineeId),
      )
      .map(clone);
  }

  async findByCompany(companyName: string) {
    return this.findAll({
      filter: {
        type: 'corporate',
        companyName,
      },
    });
  }
}

export const groupRepository = new GroupRepository();