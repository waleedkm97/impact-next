import { prisma } from '@/lib/prisma';
import type { StaffPermission } from '@/types/staff';

const legacyPermissionMap: Record<string, StaffPermission[]> = {
  courses: ['viewCourses', 'editCourses'],
  orders: ['viewOrders', 'editOrders'],
  trainees: [
    'viewTrainees',
    'createTrainee',
    'editTrainee',
    'deleteTrainee',
    'viewTraineeProgress',
    'manageAttendance',
    'viewTrainingMaterials',
    'viewAssessmentResults',
    'viewCertificates',
  ],
  groups: ['viewGroups', 'createGroup', 'editGroup', 'deleteGroup', 'viewReports'],
  assessments: ['viewAssessments', 'editAssessments'],
  certificates: ['viewCertificates'],
  users: ['viewUsers', 'editUsers'],
  settings: ['viewSettings', 'editSettings'],
  contactRequests: ['viewContactRequests'],
};

function permissionMatches(value: unknown, required: StaffPermission) {
  if (value === required) return true;
  return legacyPermissionMap[String(value)]?.includes(required) ?? false;
}

export async function hasStaffPermission(
  request: Request,
  permission: StaffPermission,
) {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith('impact_staff='));
  const staffId = match
    ? decodeURIComponent(match.split('=').slice(1).join('='))
    : '';

  if (!staffId) return false;

  const staff = await prisma.staffUser.findUnique({
    where: { id: staffId },
    select: { role: true, status: true, permissions: true },
  });

  if (!staff || staff.status !== 'active') return false;
  if (staff.role === 'admin') return true;

  if (staff.role === 'coordinator' || staff.role === 'trainer') {
    if (staff.permissions === null) return true;
    return Array.isArray(staff.permissions) && staff.permissions.some((value) => permissionMatches(value, permission));
  }

  if (staff.role !== 'employee') return false;

  return Array.isArray(staff.permissions) && staff.permissions.some((value) => permissionMatches(value, permission));
}

export function staffIdFromRequest(request: Request) {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith('impact_staff='));

  return match
    ? decodeURIComponent(match.split('=').slice(1).join('='))
    : '';
}
