import { prisma } from '@/lib/prisma';

const COMPLETED = 'completed';

function isTraineeEligible(enrollment: {
  progress: number;
  status: string;
  preAssessment?: string | null;
  postAssessment?: string | null;
  courseEvaluation?: string | null;
  preAssessmentCompletedAt?: Date | string | null;
  postAssessmentCompletedAt?: Date | string | null;
  courseEvaluationCompletedAt?: Date | string | null;
  course?: { type?: string | null } | null;
}) {
  const preAssessmentCompleted =
    enrollment.preAssessment === COMPLETED ||
    Boolean(enrollment.preAssessmentCompletedAt);
  const postAssessmentCompleted =
    enrollment.postAssessment === COMPLETED ||
    Boolean(enrollment.postAssessmentCompletedAt);
  const courseEvaluationCompleted =
    enrollment.courseEvaluation === COMPLETED ||
    Boolean(enrollment.courseEvaluationCompletedAt);
  const assessmentsCompleted =
    preAssessmentCompleted &&
    postAssessmentCompleted &&
    courseEvaluationCompleted;

  const recordedProgressCompleted =
    enrollment.course?.type !== 'recorded' || enrollment.progress >= 100;

  return (
    enrollment.status !== 'cancelled' &&
    assessmentsCompleted &&
    recordedProgressCompleted
  );
}

async function nextCertificateNumber() {
  const year = String(new Date().getFullYear()).slice(-2);
  let sequence = (await prisma.certificate.count()) + 1;

  while (true) {
    const certificateNumber = `IMP-${year}-${String(sequence).padStart(3, '0')}`;
    const existing = await prisma.certificate.findUnique({
      where: { certificateNumber },
      select: { id: true },
    });

    if (!existing) return certificateNumber;
    sequence += 1;
  }
}

export async function issueCertificateForEnrollment(
  enrollmentId: string,
  adminOverride = false,
) {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: { select: { type: true, title: true } },
      certificate: true,
      schedule: true,
    },
  });

  if (!enrollment) {
    return { certificate: null, enrollment: null, eligible: false };
  }

  const eligible = adminOverride || isTraineeEligible(enrollment);

  if (!eligible) {
    return { certificate: null, enrollment, eligible: false };
  }

  if (enrollment.certificate) {
    return {
      certificate: enrollment.certificate,
      enrollment,
      eligible: true,
    };
  }

  const certificate = await prisma.certificate.create({
    data: {
      id: crypto.randomUUID(),
      traineeId: enrollment.traineeId,
      courseId: enrollment.courseId,
      enrollmentId: enrollment.id,
      courseTitle: enrollment.course.title,
      certificateNumber: await nextCertificateNumber(),
      templateId: 'certificate-template.png',
      verified: true,
    },
  });

  return { certificate, enrollment, eligible: true };
}

export { isTraineeEligible };
