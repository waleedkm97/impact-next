import { prisma } from '@/lib/prisma';
import { staffIdFromRequest } from '@/lib/staff-authorization';

export type ScopedStaff = {
  id: string;
  role: 'admin' | 'coordinator' | 'trainer' | 'employee';
  global: boolean;
};

export async function getScopedStaff(request: Request): Promise<ScopedStaff | null> {
  const id = staffIdFromRequest(request);
  if (!id) return null;

  const staff = await prisma.staffUser.findUnique({
    where: { id },
    select: { id: true, role: true, status: true },
  });

  if (!staff || staff.status !== 'active') return null;

  return {
    id: staff.id,
    role: staff.role,
    global: staff.role === 'admin' || staff.role === 'employee',
  };
}

export async function canAccessGroup(request: Request, groupId: string) {
  const staff = await getScopedStaff(request);
  if (!staff) return false;
  if (staff.global) return true;

  const group = await prisma.trainingGroup.findUnique({
    where: { id: groupId },
    select: { trainerId: true, coordinatorId: true },
  });

  return Boolean(
    group &&
      ((staff.role === 'trainer' && group.trainerId === staff.id) ||
        (staff.role === 'coordinator' && group.coordinatorId === staff.id)),
  );
}

export async function canAccessCourse(request: Request, courseId: string) {
  const staff = await getScopedStaff(request);
  if (!staff) return false;
  if (staff.global) return true;

  const [course, groups, schedules] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      select: {
        trainerAssignments: { where: { staffId: staff.id }, select: { staffId: true } },
        coordinatorAssignments: { where: { staffId: staff.id }, select: { staffId: true } },
      },
    }),
    prisma.trainingGroup.findFirst({
      where: {
        courseId,
        ...(staff.role === 'trainer' ? { trainerId: staff.id } : { coordinatorId: staff.id }),
      },
      select: { id: true },
    }),
    prisma.schedule.findFirst({
      where: {
        courseId,
        ...(staff.role === 'trainer' ? { trainerId: staff.id } : { coordinatorId: staff.id }),
      },
      select: { id: true },
    }),
  ]);

  return Boolean(
    (staff.role === 'trainer' && course?.trainerAssignments.length) ||
      (staff.role === 'coordinator' && course?.coordinatorAssignments.length) ||
      groups ||
      schedules,
  );
}

export async function scopedGroupWhere(request: Request) {
  const staff = await getScopedStaff(request);
  if (!staff || staff.global) return {};
  return staff.role === 'trainer'
    ? { trainerId: staff.id }
    : { coordinatorId: staff.id };
}

export async function scopedCourseWhere(request: Request) {
  const staff = await getScopedStaff(request);
  if (!staff || staff.global) return {};

  const [assignments, groups, schedules] = await Promise.all([
    staff.role === 'trainer'
      ? prisma.courseStaffTrainer.findMany({ where: { staffId: staff.id }, select: { courseId: true } })
      : prisma.courseStaffCoordinator.findMany({ where: { staffId: staff.id }, select: { courseId: true } }),
    prisma.trainingGroup.findMany({
      where: staff.role === 'trainer' ? { trainerId: staff.id } : { coordinatorId: staff.id },
      select: { courseId: true },
    }),
    prisma.schedule.findMany({
      where: staff.role === 'trainer' ? { trainerId: staff.id } : { coordinatorId: staff.id },
      select: { courseId: true },
    }),
  ]);

  const ids = Array.from(new Set([...assignments, ...groups, ...schedules].map((item) => item.courseId)));
  return { id: { in: ids } };
}

export async function scopedScheduleWhere(request: Request) {
  const staff = await getScopedStaff(request);
  if (!staff || staff.global) return {};
  return staff.role === 'trainer'
    ? { trainerId: staff.id }
    : { coordinatorId: staff.id };
}
