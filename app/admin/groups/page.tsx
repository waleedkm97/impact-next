'use client';

import { useEffect, useMemo, useState } from 'react';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { groupRepository } from '@/lib/data/repositories/group-repository';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';

import type { Course } from '@/types/course';
import type { TrainingGroup } from '@/types/group';
import type { Trainee } from '@/types/trainee';
import type { Schedule } from '@/types/schedule';

type AssessmentKey = 'pre' | 'post' | 'evaluation';

const DEFAULT_ASSESSMENT_SETTINGS: NonNullable<
  TrainingGroup['assessmentSettings']
> = {
  pre: {
    enabled: true,
  },
  post: {
    enabled: false,
  },
  evaluation: {
    enabled: false,
  },
};

function getAssessmentLabel(type: AssessmentKey) {
  if (type === 'pre') return 'Pre Assessment';
  if (type === 'post') return 'Post Assessment';
  return 'Course Evaluation';
}

function formatDate(value?: Date | string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('ar-SA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateLong(value?: Date | string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('ar-SA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getTraineeName(trainee: Trainee) {
  return `${trainee.profile?.firstName ?? ''} ${
    trainee.profile?.lastName ?? ''
  }`.trim();
}

function getEnglishName(trainee: Trainee) {
  return `${trainee.profile?.firstNameEnglish ?? ''} ${
    trainee.profile?.lastNameEnglish ?? ''
  }`.trim();
}

function getEnrollment(
  trainee: Trainee,
  group: TrainingGroup,
) {
  return trainee.enrollments?.find(
    (enrollment) =>
      enrollment.groupId === group.id ||
      (
        enrollment.courseId === group.courseId &&
        (!group.scheduleId ||
          enrollment.scheduleId === group.scheduleId)
      ),
  );
}

function assessmentStateLabel(
  state: string | undefined,
  score?: number,
) {
  if (state === 'completed') {
    return {
      label:
        typeof score === 'number'
          ? `${score}/100`
          : 'مكتمل',
      className: 'admin-status admin-status-ok',
    };
  }

  if (state === 'available') {
    return {
      label: 'متاح',
      className: 'admin-status',
    };
  }

  return {
    label: 'مغلق',
    className: 'admin-status',
  };
}

function attendanceLabel(status?: string) {
  if (status === 'present') return 'حاضر';
  if (status === 'absent') return 'غائب';
  return 'لم يسجل';
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const [memberId, setMemberId] = useState('');

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [savingAssessment, setSavingAssessment] =
    useState<AssessmentKey | null>(null);

  const [reportOpen, setReportOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    courseId: '',
    companyName: '',
    responsibleName: '',
    responsibleEmail: '',
    responsiblePhone: '',
    scheduleId: '',
    notes: '',
  });

  async function load() {
    await traineeRepository.refresh();

    const [
      groupList,
      courseList,
      traineeList,
      scheduleList,
    ] = await Promise.all([
      groupRepository.findAll(),
      courseRepository.findAll(),
      traineeRepository.findAll(),
      scheduleRepository.findAll({
        sort: 'startDate',
        order: 'asc',
      }),
    ]);

    setGroups(groupList);

    setCourses(
      courseList.filter(
        (course) => course.type === 'training',
      ),
    );

    setTrainees(traineeList);
    setSchedules(scheduleList);

    if (
      selectedCompany &&
      !groupList.some(
        (group) =>
          (group.companyName || group.name) ===
          selectedCompany,
      )
    ) {
      setSelectedCompany('');
      setSelectedGroupId('');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  /*
   * =========================
   * COMPANIES
   * =========================
   */

  const companies = useMemo(() => {
    const map = new Map<
      string,
      TrainingGroup[]
    >();

    groups.forEach((group) => {
      const company =
        group.companyName?.trim() ||
        group.name?.trim() ||
        'شركة بدون اسم';

      const existing = map.get(company) ?? [];

      existing.push(group);

      map.set(company, existing);
    });

    return Array.from(map.entries()).map(
      ([name, companyGroups]) => ({
        name,
        groups: companyGroups,
      }),
    );
  }, [groups]);

  const companyGroups = useMemo(() => {
    if (!selectedCompany) return [];

    return groups.filter(
      (group) =>
        (group.companyName || group.name) ===
        selectedCompany,
    );
  }, [groups, selectedCompany]);

  const selectedGroup =
    groups.find(
      (group) => group.id === selectedGroupId,
    ) ?? null;

  const selectedSchedule = selectedGroup
    ? schedules.find(
        (schedule) =>
          schedule.id === selectedGroup.scheduleId,
      )
    : undefined;

  const members = selectedGroup
    ? trainees.filter((trainee) =>
        selectedGroup.traineeIds.includes(
          trainee.id,
        ),
      )
    : [];

  const availableTrainees = selectedGroup
    ? trainees.filter(
        (trainee) =>
          !selectedGroup.traineeIds.includes(
            trainee.id,
          ),
      )
    : [];

  /*
   * =========================
   * FORM
   * =========================
   */

  function resetForm() {
    setForm({
      name: '',
      courseId: '',
      companyName: selectedCompany || '',
      responsibleName: '',
      responsibleEmail: '',
      responsiblePhone: '',
      scheduleId: '',
      notes: '',
    });
  }

  function startCreate() {
    setEditingId(null);

    setForm({
      name: '',
      courseId: '',
      companyName: selectedCompany || '',
      responsibleName: '',
      responsibleEmail: '',
      responsiblePhone: '',
      scheduleId: '',
      notes: '',
    });

    setOpen(true);
  }

  function startEdit() {
    if (!selectedGroup) return;

    setEditingId(selectedGroup.id);

    setForm({
      name: selectedGroup.name || '',
      courseId: selectedGroup.courseId || '',
      companyName:
        selectedGroup.companyName || '',
      responsibleName:
        selectedGroup.responsibleName || '',
      responsibleEmail:
        selectedGroup.responsibleEmail || '',
      responsiblePhone:
        selectedGroup.responsiblePhone || '',
      scheduleId:
        selectedGroup.scheduleId || '',
      notes: selectedGroup.notes || '',
    });

    setOpen(true);
  }

  async function createGroup(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    const course = courses.find(
      (item) => item.id === form.courseId,
    );

    if (!course) {
      alert('اختر الدورة.');
      return;
    }

    const companyName =
      form.companyName.trim();

    const group = await groupRepository.create({
      name:
        form.name.trim() ||
        companyName ||
        `مجموعة ${course.title}`,

      type: 'corporate',

      status: 'active',

      courseId: course.id,

      courseTitle: course.title,

      scheduleId:
        form.scheduleId || undefined,

      companyName:
        companyName || undefined,

      responsibleName:
        form.responsibleName.trim() ||
        undefined,

      responsibleEmail:
        form.responsibleEmail.trim() ||
        undefined,

      responsiblePhone:
        form.responsiblePhone.trim() ||
        undefined,

      traineeIds: [],

      notes:
        form.notes.trim() || undefined,

      assessmentSettings: {
        pre: {
          enabled: true,
        },
        post: {
          enabled: false,
        },
        evaluation: {
          enabled: false,
        },
      },
    });

    setSelectedCompany(
      companyName ||
        group.name ||
        'شركة بدون اسم',
    );

    setSelectedGroupId(group.id);

    setOpen(false);
    resetForm();

    await load();
  }

  async function updateGroup(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!editingId) return;

    const course = courses.find(
      (item) => item.id === form.courseId,
    );

    if (!course) {
      alert('اختر الدورة.');
      return;
    }

    await groupRepository.update(
      editingId,
      {
        name:
          form.name.trim() ||
          form.companyName.trim() ||
          `مجموعة ${course.title}`,

        courseId: course.id,

        courseTitle: course.title,

        scheduleId:
          form.scheduleId || undefined,

        companyName:
          form.companyName.trim() ||
          undefined,

        responsibleName:
          form.responsibleName.trim() ||
          undefined,

        responsibleEmail:
          form.responsibleEmail.trim() ||
          undefined,

        responsiblePhone:
          form.responsiblePhone.trim() ||
          undefined,

        notes:
          form.notes.trim() || undefined,
      },
    );

    setOpen(false);
    setEditingId(null);

    const newCompany =
      form.companyName.trim();

    setSelectedCompany(
      newCompany || selectedCompany,
    );

    resetForm();

    await load();
  }

  async function deleteSelected() {
    if (!selectedGroup) return;

    const company =
      selectedGroup.companyName ||
      selectedGroup.name;

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف مجموعة "${company}"؟`,
    );

    if (!confirmed) return;

    await groupRepository.delete(
      selectedGroup.id,
    );

    setSelectedGroupId('');

    await load();
  }

  /*
   * =========================
   * MEMBERS
   * =========================
   */

  async function addMember() {
    if (!selectedGroupId || !memberId) {
      return;
    }

    try {
      await groupRepository.addTrainee(
        selectedGroupId,
        memberId,
      );

      setMemberId('');

      await load();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'تعذر إضافة المتدرب.',
      );
    }
  }

  async function removeMember(
    traineeId: string,
  ) {
    if (!selectedGroupId) return;

    await groupRepository.removeTrainee(
      selectedGroupId,
      traineeId,
    );

    await load();
  }

  /*
   * =========================
   * ASSESSMENTS
   * =========================
   */

  function getSettings() {
    return (
      selectedGroup?.assessmentSettings ??
      DEFAULT_ASSESSMENT_SETTINGS
    );
  }

  async function toggleAssessment(
    type: AssessmentKey,
  ) {
    if (!selectedGroup) return;

    setSavingAssessment(type);

    try {
      const current = getSettings();

      const next = {
        pre: {
          ...current.pre,
        },

        post: {
          ...current.post,
        },

        evaluation: {
          ...current.evaluation,
        },
      };

      if (type === 'pre') {
        next.pre = {
          ...next.pre,
          enabled: true,
        };
      } else {
        next[type] = {
          ...next[type],
          enabled:
            !next[type].enabled,
        };
      }

      await groupRepository.updateAssessmentSettings(
        selectedGroup.id,
        next,
      );

      await load();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'تعذر تحديث إعدادات التقييم.',
      );
    } finally {
      setSavingAssessment(null);
    }
  }

  /*
   * =========================
   * ATTENDANCE
   * =========================
   */

  async function markAttendance(
    trainee: Trainee,
    dayIndex: number,
    status: 'present' | 'absent',
  ) {
    if (!selectedGroup) return;

    const enrollment =
      getEnrollment(
        trainee,
        selectedGroup,
      );

    if (!enrollment) {
      alert(
        'لا يوجد تسجيل لهذه الدورة لدى المتدرب.',
      );
      return;
    }

    await traineeRepository.ensureAttendanceDays(
      trainee.id,
      enrollment.id ??
        enrollment.courseId,
    );

    await traineeRepository.updateAttendanceDay(
      trainee.id,
      enrollment.id ??
        enrollment.courseId,
      dayIndex,
      status,
    );

    await load();
  }

  /*
   * =========================
   * REPORT
   * =========================
   */

  async function openReport() {
    await traineeRepository.refresh();
    await load();
    setReportOpen(true);
  }

  function escapeReportHtml(value: unknown) {
    return String(value ?? '—')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function printProfessionalReport() {
    if (!selectedGroup) return;

    const printFrame = document.createElement('iframe');
    printFrame.setAttribute('aria-hidden', 'true');
    printFrame.style.position = 'fixed';
    printFrame.style.left = '-10000px';
    printFrame.style.top = '0';
    printFrame.style.width = '1px';
    printFrame.style.height = '1px';
    printFrame.style.border = '0';
    printFrame.style.opacity = '0';
    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentDocument;
    const printWindow = printFrame.contentWindow;

    if (!printDocument || !printWindow) {
      printFrame.remove();
      alert('تعذر تجهيز التقرير للطباعة. حاول مرة أخرى.');
      return;
    }

    const course = courses.find((item) => item.id === selectedGroup.courseId);
    const companyName =
      selectedGroup.companyName?.trim() ||
      selectedCompany ||
      selectedGroup.name ||
      '—';
    const courseTitle = selectedGroup.courseTitle || course?.title || '—';
    const location =
      selectedSchedule?.city ||
      selectedSchedule?.location ||
      '—';
    const startDate = formatDateLong(selectedSchedule?.startDate);
    const endDate = selectedSchedule?.endDate
      ? formatDateLong(selectedSchedule.endDate)
      : '—';
    const responsible = selectedGroup.responsibleName || '—';
    const generatedAt = new Date().toLocaleDateString('ar-SA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const safe = (value: unknown) => escapeReportHtml(value);
    const average = (values: number[]) =>
      values.length
        ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
        : 0;

    const enrollments = members.map((trainee) => ({
      trainee,
      enrollment: getEnrollment(trainee, selectedGroup),
    }));

    const preScores = enrollments
      .map(({ enrollment }) => enrollment?.preAssessmentScore)
      .filter((value): value is number => typeof value === 'number');
    const postScores = enrollments
      .map(({ enrollment }) => enrollment?.postAssessmentScore)
      .filter((value): value is number => typeof value === 'number');
    const evaluationScores = enrollments
      .map(({ enrollment }) => enrollment?.courseEvaluationScore)
      .filter((value): value is number => typeof value === 'number');

    const preAverage = average(preScores);
    const postAverage = average(postScores);
    const evaluationAverage = average(evaluationScores);
    const improvement = preScores.length && postScores.length
      ? postAverage - preAverage
      : 0;

    const completedEnrollments = enrollments.filter(
      ({ enrollment }) => enrollment?.status === 'completed',
    ).length;
    const preCompleted = enrollments.filter(
      ({ enrollment }) => enrollment?.preAssessment === 'completed',
    ).length;
    const postCompleted = enrollments.filter(
      ({ enrollment }) => enrollment?.postAssessment === 'completed',
    ).length;
    const evaluationCompleted = enrollments.filter(
      ({ enrollment }) => enrollment?.courseEvaluation === 'completed',
    ).length;

    const attendanceMarks = enrollments.reduce((total, { enrollment }) => {
      const days = enrollment?.attendanceDays ?? [];
      return total + days.filter(
        (day) => day.status === 'present' || day.status === 'absent',
      ).length;
    }, 0);
    const attendancePresent = enrollments.reduce((total, { enrollment }) => {
      const days = enrollment?.attendanceDays ?? [];
      return total + days.filter((day) => day.status === 'present').length;
    }, 0);
    const attendanceRate = attendanceMarks
      ? Math.round((attendancePresent / attendanceMarks) * 100)
      : 0;

    const dayRates = [0, 1, 2].map((dayIndex) => {
      let marked = 0;
      let present = 0;
      enrollments.forEach(({ enrollment }) => {
        const status = enrollment?.attendanceDays?.[dayIndex]?.status;
        if (status === 'present' || status === 'absent') {
          marked += 1;
          if (status === 'present') present += 1;
        }
      });
      return marked ? Math.round((present / marked) * 100) : 0;
    });

    const progressValues = enrollments
      .map(({ enrollment }) => enrollment?.progress ?? 0)
      .filter((value) => typeof value === 'number');
    const progressAverage = average(progressValues);

    const objectives = Array.isArray(course?.objectives)
      ? course.objectives.filter(Boolean)
      : [];
    const outcomes = Array.isArray(course?.outcomes)
      ? course.outcomes.filter(Boolean)
      : [];
    const outlineItems = course?.outline
      ? course.outline
          .split(/\r?\n|•|\u2022/)
          .map((item) => item.trim())
          .filter(Boolean)
      : (course?.lessons ?? [])
          .map((lesson) => lesson.title?.trim())
          .filter((item): item is string => Boolean(item));

    const listHtml = (items: string[], emptyText: string) =>
      items.length
        ? `<ul>${items.map((item) => `<li>${safe(item)}</li>`).join('')}</ul>`
        : `<p class="empty">${safe(emptyText)}</p>`;

    const assessmentRows = [
      { label: 'التقييم القبلي', value: preAverage, count: preScores.length },
      { label: 'التقييم البعدي', value: postAverage, count: postScores.length },
      { label: 'تقييم البرنامج', value: evaluationAverage, count: evaluationScores.length },
    ];

    const assessmentChart = assessmentRows
      .map((item) => `
        <div class="chart-row">
          <div class="chart-label">${safe(item.label)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${item.value}%"></div></div>
          <strong>${item.count ? `${item.value}%` : '—'}</strong>
        </div>`)
      .join('');

    const attendanceChart = dayRates
      .map((rate, index) => `
        <div class="chart-row">
          <div class="chart-label">اليوم ${index + 1}</div>
          <div class="bar-track"><div class="bar-fill attendance" style="width:${rate}%"></div></div>
          <strong>${rate}%</strong>
        </div>`)
      .join('');

    const rows = enrollments
      .map(({ trainee, enrollment }, index) => {
        const days = enrollment?.attendanceDays ?? [];
        const attendanceValues = [0, 1, 2].map((dayIndex) => {
          const status = days[dayIndex]?.status;
          return status === 'present'
            ? '<span class="ok">حاضر</span>'
            : status === 'absent'
              ? '<span class="bad">غائب</span>'
              : '<span class="muted">لم يسجل</span>';
        });

        const assessmentValue = (
          score: number | undefined,
          state: string | undefined,
        ) =>
          typeof score === 'number'
            ? `${safe(score)}/100`
            : state === 'completed'
              ? 'مكتمل'
              : '—';

        return `
          <tr>
            <td class="number">${index + 1}</td>
            <td class="trainee">
              <strong>${safe(getTraineeName(trainee) || '—')}</strong>
              ${getEnglishName(trainee) ? `<small>${safe(getEnglishName(trainee))}</small>` : ''}
            </td>
            <td>${attendanceValues[0]}</td>
            <td>${attendanceValues[1]}</td>
            <td>${attendanceValues[2]}</td>
            <td>${assessmentValue(enrollment?.preAssessmentScore, enrollment?.preAssessment)}</td>
            <td>${assessmentValue(enrollment?.postAssessmentScore, enrollment?.postAssessment)}</td>
            <td>${assessmentValue(enrollment?.courseEvaluationScore, enrollment?.courseEvaluation)}</td>
            <td class="progress">${safe(enrollment?.progress ?? 0)}%</td>
          </tr>`;
      })
      .join('');

    const pageBreak = '<div class="page-break"></div>';

    printDocument.open();
    printDocument.write(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>التقرير النهائي - ${safe(companyName)} - ${safe(courseTitle)}</title>
<style>
  @page { size: A4 landscape; margin: 11mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Arial, Tahoma, sans-serif;
    color: #172033;
    background: #fff;
    font-size: 12px;
    line-height: 1.65;
  }
  .page { width: 100%; }
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 30px;
    border-bottom: 3px solid #172033;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }
  .brand { text-align: right; }
  .brand-name { font-size: 25px; font-weight: 900; letter-spacing: .4px; }
  .brand-sub { color: #6b7280; font-size: 10px; }
  .report-title { text-align: left; }
  .report-title h1 { margin: 0; font-size: 24px; font-weight: 900; }
  .report-title p { margin: 2px 0 0; color: #6b7280; font-size: 10px; }
  .section { margin-top: 18px; }
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 900;
    margin: 0 0 8px;
  }
  .section-title:before {
    content: '';
    width: 5px;
    height: 19px;
    background: #172033;
    display: inline-block;
    border-radius: 3px;
  }
  .intro {
    border: 1px solid #dfe3e8;
    border-radius: 9px;
    padding: 12px 14px;
    background: #fafbfc;
    font-size: 12px;
  }
  .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .info-card { border: 1px solid #dfe3e8; border-radius: 8px; padding: 8px 10px; min-height: 55px; }
  .label { color: #6b7280; font-size: 9px; margin-bottom: 1px; }
  .value { font-size: 11px; font-weight: 800; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .content-card { border: 1px solid #dfe3e8; border-radius: 9px; padding: 11px 14px; }
  ul { margin: 4px 0 0; padding-right: 18px; }
  li { margin: 4px 0; }
  .empty { color: #9ca3af; margin: 0; }
  .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .stat { border: 1px solid #dfe3e8; border-radius: 8px; padding: 9px; text-align: center; }
  .stat strong { display: block; font-size: 19px; margin-bottom: 1px; }
  .stat span { color: #6b7280; font-size: 9px; }
  .chart-card { border: 1px solid #dfe3e8; border-radius: 9px; padding: 12px 14px; }
  .chart-row { display: grid; grid-template-columns: 120px 1fr 48px; gap: 9px; align-items: center; margin: 9px 0; }
  .chart-label { font-size: 10px; font-weight: 700; }
  .bar-track { height: 15px; background: #edf0f3; border-radius: 10px; overflow: hidden; direction: ltr; }
  .bar-fill { height: 100%; background: #172033; border-radius: 10px; min-width: 0; }
  .bar-fill.attendance { background: #334155; }
  .chart-row strong { font-size: 11px; text-align: left; direction: ltr; }
  .comparison {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin-top: 10px;
  }
  .metric { border: 1px solid #dfe3e8; border-radius: 8px; padding: 10px; text-align: center; }
  .metric strong { display: block; font-size: 21px; }
  .metric span { color: #6b7280; font-size: 9px; }
  .metric.improvement strong { font-size: 24px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 8px; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th { background: #172033; color: #fff; font-weight: 700; padding: 7px 5px; border: 1px solid #172033; font-size: 9px; }
  td { padding: 6px 5px; border: 1px solid #dfe3e8; text-align: center; vertical-align: middle; font-size: 9px; }
  tbody tr:nth-child(even) td { background: #f7f8fa; }
  .number { width: 30px; }
  .trainee { width: 21%; text-align: right; }
  .trainee small { display: block; color: #6b7280; font-size: 8px; direction: ltr; text-align: right; }
  .ok { font-weight: 800; }
  .bad { font-weight: 800; }
  .muted { color: #9ca3af; }
  .progress { font-weight: 800; }
  .page-break { page-break-before: always; }
  .footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #dfe3e8; display: flex; justify-content: space-between; color: #6b7280; font-size: 8px; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 70px; margin-top: 28px; page-break-inside: avoid; }
  .signature { padding-top: 26px; border-top: 1px solid #9ca3af; text-align: center; color: #4b5563; }
  .summary-box { border: 1px solid #dfe3e8; border-radius: 9px; padding: 12px 14px; background: #fafbfc; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>
<div class="page">
  <header class="header">
    <div class="brand">
      <div class="brand-name">IMPACT TRAINING</div>
      <div class="brand-sub">Training &amp; Development</div>
    </div>
    <div class="report-title">
      <h1>التقرير النهائي للبرنامج التدريبي</h1>
      <p>تقرير تنفيذ البرنامج ونتائج المتدربين وقياس الأثر التدريبي</p>
    </div>
  </header>

  <section class="info-grid">
    <div class="info-card"><div class="label">الشركة</div><div class="value">${safe(companyName)}</div></div>
    <div class="info-card"><div class="label">الدورة التدريبية</div><div class="value">${safe(courseTitle)}</div></div>
    <div class="info-card"><div class="label">الفترة التدريبية</div><div class="value">${safe(startDate)}${endDate !== '—' ? ` — ${safe(endDate)}` : ''}</div></div>
    <div class="info-card"><div class="label">الموقع</div><div class="value">${safe(location)}</div></div>
    <div class="info-card"><div class="label">المسؤول</div><div class="value">${safe(responsible)}</div></div>
    <div class="info-card"><div class="label">عدد المتدربين</div><div class="value">${members.length}</div></div>
    <div class="info-card"><div class="label">متوسط التقدم</div><div class="value">${progressAverage}%</div></div>
    <div class="info-card"><div class="label">تاريخ إصدار التقرير</div><div class="value">${safe(generatedAt)}</div></div>
  </section>

  <section class="section">
    <h2 class="section-title">نبذة عن البرنامج</h2>
    <div class="intro">${safe(course?.description || course?.shortDescription || 'لا توجد نبذة تعريفية مضافة للبرنامج حتى الآن.')}</div>
  </section>

  <section class="section two-col">
    <div class="content-card">
      <h2 class="section-title">أهداف البرنامج</h2>
      ${listHtml(objectives, 'لم تتم إضافة أهداف البرنامج بعد.')}
    </div>
    <div class="content-card">
      <h2 class="section-title">محاور البرنامج</h2>
      ${listHtml(outlineItems, 'لم تتم إضافة محاور البرنامج بعد.')}
    </div>
  </section>

  <section class="section">
    <h2 class="section-title">ماذا تعلم المتدربون؟</h2>
    <div class="content-card">
      ${listHtml(outcomes, 'لم تتم إضافة مخرجات التعلم للبرنامج بعد.')}
    </div>
  </section>

  ${pageBreak}

  <section class="section">
    <h2 class="section-title">ملخص الأداء والنتائج</h2>
    <div class="stats">
      <div class="stat"><strong>${members.length}</strong><span>إجمالي المتدربين</span></div>
      <div class="stat"><strong>${attendanceRate}%</strong><span>نسبة الحضور</span></div>
      <div class="stat"><strong>${completedEnrollments}</strong><span>مكتمل التدريب</span></div>
      <div class="stat"><strong>${progressAverage}%</strong><span>متوسط التقدم</span></div>
      <div class="stat"><strong>${evaluationAverage || '—'}${evaluationScores.length ? '%' : ''}</strong><span>متوسط تقييم البرنامج</span></div>
    </div>
  </section>

  <section class="section two-col">
    <div class="chart-card">
      <h2 class="section-title">مقارنة التقييمات</h2>
      ${assessmentChart}
      <div class="comparison">
        <div class="metric"><strong>${preAverage || '—'}${preScores.length ? '%' : ''}</strong><span>متوسط Pre Assessment</span></div>
        <div class="metric"><strong>${postAverage || '—'}${postScores.length ? '%' : ''}</strong><span>متوسط Post Assessment</span></div>
        <div class="metric improvement"><strong>${improvement > 0 ? '+' : ''}${preScores.length && postScores.length ? `${improvement}%` : '—'}</strong><span>نسبة التحسن</span></div>
      </div>
    </div>
    <div class="chart-card">
      <h2 class="section-title">الحضور حسب أيام البرنامج</h2>
      ${attendanceChart}
      <div class="comparison">
        <div class="metric"><strong>${preCompleted}</strong><span>Pre مكتمل</span></div>
        <div class="metric"><strong>${postCompleted}</strong><span>Post مكتمل</span></div>
        <div class="metric"><strong>${evaluationCompleted}</strong><span>Evaluation مكتمل</span></div>
      </div>
    </div>
  </section>

  <section class="section">
    <h2 class="section-title">الاستنتاج العام</h2>
    <div class="summary-box">
      تم تنفيذ برنامج <strong>${safe(courseTitle)}</strong> لصالح <strong>${safe(companyName)}</strong> بعدد <strong>${members.length}</strong> متدرب. بلغت نسبة الحضور المسجلة <strong>${attendanceRate}%</strong>، وبلغ متوسط التقدم <strong>${progressAverage}%</strong>.
      ${preScores.length && postScores.length
        ? ` وأظهرت نتائج التقييم القبلي والبعدي ${improvement > 0 ? `تحسنًا قدره <strong>${improvement} نقطة مئوية</strong>` : 'عدم وجود تحسن إيجابي مسجل'}.`
        : ' ولم تتوفر بيانات كافية للمقارنة بين التقييم القبلي والبعدي.'}
    </div>
  </section>

  ${pageBreak}

  <section class="section">
    <h2 class="section-title">النتائج التفصيلية للمتدربين</h2>
    <table>
      <thead>
        <tr>
          <th class="number">#</th>
          <th class="trainee">المتدرب</th>
          <th>اليوم 1</th>
          <th>اليوم 2</th>
          <th>اليوم 3</th>
          <th>Pre Assessment</th>
          <th>Post Assessment</th>
          <th>Course Evaluation</th>
          <th>التقدم</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="9">لا يوجد متدربون في هذه المجموعة.</td></tr>'}</tbody>
    </table>
  </section>

  <div class="signatures">
    <div class="signature">اعتماد مركز التدريب</div>
    <div class="signature">اعتماد ممثل الشركة</div>
  </div>

  <footer class="footer">
    <span>IMPACT TRAINING — التقرير النهائي للبرنامج التدريبي</span>
    <span>تم إنشاء التقرير بتاريخ ${safe(generatedAt)}</span>
  </footer>
</div>
</body>
</html>`);

    printDocument.close();
    printWindow.focus();
    printWindow.onafterprint = () => printFrame.remove();

    setTimeout(() => {
      printWindow.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) printFrame.remove();
      }, 1500);
    }, 400);
  }

  /*
   * =========================
   * UI DATA
   * =========================
   */

  const assessmentSettings =
    selectedGroup?.assessmentSettings ??
    DEFAULT_ASSESSMENT_SETTINGS;

  return (
    <main
      className="admin-page"
      dir="rtl"
    >
      {/* =========================
          HEADER
         ========================= */}

      <header className="admin-page-header">
        <div>
          <div className="eyebrow">
            Admin
          </div>

          <h1>
            المجموعات والشركات
          </h1>

          <p>
            إدارة الشركات والدورات والمتدربين
            والحضور والتقييمات والتقارير من
            مكان واحد.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={startCreate}
        >
          + إضافة مجموعة شركة
        </button>
      </header>

      {/* =========================
          COMPANY LIST
         ========================= */}

      {!selectedCompany && (
        <section
          className="admin-card"
          style={{
            padding: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                الشركات
              </h2>

              <p
                style={{
                  margin:
                    '6px 0 0',
                  color: '#6b7280',
                }}
              >
                اختر الشركة لعرض الدورات
                التابعة لها.
              </p>
            </div>

            <span className="admin-tag">
              {companies.length} شركة
            </span>
          </div>

          {companies.length === 0 ? (
            <div className="admin-empty">
              لا توجد شركات حتى الآن.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 14,
              }}
            >
              {companies.map(
                (company) => (
                  <button
                    key={company.name}
                    type="button"
                    onClick={() => {
                      setSelectedCompany(
                        company.name,
                      );

                      setSelectedGroupId(
                        company.groups[0]?.id ??
                          '',
                      );
                    }}
                    style={{
                      textAlign: 'right',
                      padding: 20,
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 14,
                      background:
                        '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      {company.name}
                    </div>

                    <div
                      style={{
                        color: '#6b7280',
                        fontSize: 14,
                      }}
                    >
                      {company.groups.length}{' '}
                      دورة
                    </div>

                    <div
                      style={{
                        color: '#6b7280',
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      {company.groups.reduce(
                        (
                          total,
                          group,
                        ) =>
                          total +
                          group
                            .traineeIds
                            .length,
                        0,
                      )}{' '}
                      متدرب
                    </div>
                  </button>
                ),
              )}
            </div>
          )}
        </section>
      )}

      {/* =========================
          COMPANY VIEW
         ========================= */}

      {selectedCompany && (
        <>
          <div
            style={{
              marginBottom: 18,
            }}
          >
            <button
              type="button"
              className="admin-btn admin-btn-light"
              onClick={() => {
                setSelectedCompany('');
                setSelectedGroupId('');
              }}
            >
              ← العودة للشركات
            </button>
          </div>

          {/* COMPANY HEADER */}

          <section
            className="admin-card"
            style={{
              padding: 22,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <div>
                <div className="eyebrow">
                  COMPANY
                </div>

                <h2
                  style={{
                    margin:
                      '4px 0',
                    fontSize: 28,
                  }}
                >
                  {selectedCompany}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: '#6b7280',
                  }}
                >
                  {companyGroups.length}{' '}
                  دورة مرتبطة بالشركة
                </p>
              </div>

              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={startCreate}
              >
                + إضافة دورة للشركة
              </button>
            </div>
          </section>

          {/* =========================
              COURSES
             ========================= */}

          <section
            className="admin-card"
            style={{
              padding: 22,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  margin: 0,
                }}
              >
                دورات الشركة
              </h2>

              <p
                style={{
                  margin:
                    '6px 0 0',
                  color: '#6b7280',
                }}
              >
                اختر الدورة لعرض المتدربين
                والحضور والتقييمات.
              </p>
            </div>

            {companyGroups.length === 0 ? (
              <div className="admin-empty">
                لا توجد دورات لهذه الشركة.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 12,
                }}
              >
                {companyGroups.map(
                  (group) => {
                    const schedule =
                      schedules.find(
                        (item) =>
                          item.id ===
                          group.scheduleId,
                      );

                    const isSelected =
                      group.id ===
                      selectedGroupId;

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() =>
                          setSelectedGroupId(
                            group.id,
                          )
                        }
                        style={{
                          textAlign:
                            'right',
                          padding: 18,
                          border: isSelected
                            ? '2px solid var(--admin-gold)'
                            : '1px solid #e5e7eb',
                          borderRadius: 14,
                          background:
                            isSelected
                              ? '#fffdf5'
                              : '#ffffff',
                          cursor:
                            'pointer',
                        }}
                      >
                        <strong
                          style={{
                            display:
                              'block',
                            fontSize: 17,
                            marginBottom: 10,
                          }}
                        >
                          {group.courseTitle}
                        </strong>

                        <div
                          style={{
                            display:
                              'grid',
                            gap: 6,
                            color:
                              '#6b7280',
                            fontSize: 13,
                          }}
                        >
                          <span>
                            📅{' '}
                            {formatDate(
                              schedule?.startDate,
                            )}
                            {schedule?.endDate
                              ? ` — ${formatDate(
                                  schedule.endDate,
                                )}`
                              : ''}
                          </span>

                          <span>
                            📍{' '}
                            {schedule?.city ||
                              schedule?.location ||
                              '—'}
                          </span>

                          <span>
                            👥{' '}
                            {group.traineeIds
                              .length}{' '}
                            متدرب
                          </span>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </section>

          {/* =========================
              SELECTED COURSE
             ========================= */}

          {selectedGroup && (
            <section
              className="admin-card"
              style={{
                padding: 22,
              }}
            >
              {/* COURSE HEADER */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'flex-start',
                  gap: 20,
                  paddingBottom: 18,
                  borderBottom:
                    '1px solid #e5e7eb',
                  marginBottom: 18,
                }}
              >
                <div>
                  <div className="eyebrow">
                    COURSE
                  </div>

                  <h2
                    style={{
                      margin:
                        '4px 0 12px',
                      fontSize: 25,
                    }}
                  >
                    {selectedGroup.courseTitle}
                  </h2>

                  <div
                    style={{
                      display:
                        'flex',
                      flexWrap:
                        'wrap',
                      gap: 8,
                    }}
                  >
                    <span className="admin-tag">
                      📅{' '}
                      {formatDate(
                        selectedSchedule?.startDate,
                      )}
                      {selectedSchedule?.endDate
                        ? ` — ${formatDate(
                            selectedSchedule.endDate,
                          )}`
                        : ''}
                    </span>

                    <span className="admin-tag">
                      📍{' '}
                      {selectedSchedule?.city ||
                        selectedSchedule?.location ||
                        '—'}
                    </span>

                    <span className="admin-tag">
                      👥{' '}
                      {members.length}{' '}
                      متدرب
                    </span>

                    <span className="admin-tag">
                      المسؤول:{' '}
                      {selectedGroup.responsibleName ||
                        '—'}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display:
                      'flex',
                    gap: 8,
                    flexWrap:
                      'wrap',
                    justifyContent:
                      'flex-end',
                  }}
                >
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() =>
                      void openReport()
                    }
                  >
                    التقرير والنتائج
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-light"
                    onClick={startEdit}
                  >
                    تعديل
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-danger"
                    onClick={() =>
                      void deleteSelected()
                    }
                  >
                    حذف
                  </button>
                </div>
              </div>

              {/* =========================
                  ASSESSMENT SETTINGS
                 ========================= */}

              <div
                style={{
                  border:
                    '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 17,
                      }}
                    >
                      التقييمات
                    </h3>

                    <p
                      style={{
                        margin:
                          '4px 0 0',
                        color:
                          '#6b7280',
                        fontSize: 13,
                      }}
                    >
                      التحكم في فتح وإغلاق
                      التقييمات لهذه الدورة.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      'repeat(3, minmax(0, 1fr))',
                    gap: 10,
                  }}
                >
                  {/* PRE */}

                  <div
                    style={{
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Pre Assessment
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color:
                            '#6b7280',
                        }}
                      >
                        مفتوح دائمًا
                      </span>

                      <span className="admin-status admin-status-ok">
                        مفتوح
                      </span>
                    </div>
                  </div>

                  {/* POST */}

                  <div
                    style={{
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Post Assessment
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color:
                            '#6b7280',
                        }}
                      >
                        بعد انتهاء الدورة
                      </span>

                      <button
                        type="button"
                        className={
                          assessmentSettings
                            .post
                            .enabled
                            ? 'admin-btn admin-btn-primary'
                            : 'admin-btn admin-btn-light'
                        }
                        disabled={
                          savingAssessment ===
                          'post'
                        }
                        onClick={() =>
                          void toggleAssessment(
                            'post',
                          )
                        }
                      >
                        {savingAssessment ===
                        'post'
                          ? 'حفظ...'
                          : assessmentSettings
                                .post
                                .enabled
                            ? 'مفتوح'
                            : 'مغلق'}
                      </button>
                    </div>
                  </div>

                  {/* EVALUATION */}

                  <div
                    style={{
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Course Evaluation
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color:
                            '#6b7280',
                        }}
                      >
                        تقييم الدورة والمدرب
                      </span>

                      <button
                        type="button"
                        className={
                          assessmentSettings
                            .evaluation
                            .enabled
                            ? 'admin-btn admin-btn-primary'
                            : 'admin-btn admin-btn-light'
                        }
                        disabled={
                          savingAssessment ===
                          'evaluation'
                        }
                        onClick={() =>
                          void toggleAssessment(
                            'evaluation',
                          )
                        }
                      >
                        {savingAssessment ===
                        'evaluation'
                          ? 'حفظ...'
                          : assessmentSettings
                                .evaluation
                                .enabled
                            ? 'مفتوح'
                            : 'مغلق'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* =========================
                  ADD TRAINEE
                 ========================= */}

              <div
                style={{
                  border:
                    '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <h3
                  style={{
                    margin:
                      '0 0 12px',
                    fontSize: 17,
                  }}
                >
                  إضافة متدرب للدورة
                </h3>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr auto',
                    gap: 10,
                  }}
                >
                  <select
                    className="admin-select"
                    value={memberId}
                    onChange={(event) =>
                      setMemberId(
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      اختر متدربًا
                    </option>

                    {availableTrainees.map(
                      (trainee) => (
                        <option
                          key={trainee.id}
                          value={trainee.id}
                        >
                          {getTraineeName(
                            trainee,
                          )}{' '}
                          — {trainee.email}
                        </option>
                      ),
                    )}
                  </select>

                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() =>
                      void addMember()
                    }
                  >
                    إضافة للدورة
                  </button>
                </div>
              </div>

              {/* =========================
                  TRAINEES TABLE
                 ========================= */}

              <div>
                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 18,
                      }}
                    >
                      المتدربون
                    </h3>

                    <p
                      style={{
                        margin:
                          '4px 0 0',
                        color:
                          '#6b7280',
                        fontSize: 13,
                      }}
                    >
                      الحضور والتقييمات الخاصة
                      بكل متدرب.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() =>
                      void openReport()
                    }
                  >
                    عرض التقرير الكامل
                  </button>
                </div>

                {members.length === 0 ? (
                  <div className="admin-empty">
                    لم تتم إضافة متدربين لهذه
                    الدورة.
                  </div>
                ) : (
                  <div
                    className="admin-table-card"
                    style={{
                      overflowX:
                        'auto',
                    }}
                  >
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>
                            المتدرب
                          </th>

                          <th>
                            البريد
                          </th>

                          <th>
                            اليوم 1
                          </th>

                          <th>
                            اليوم 2
                          </th>

                          <th>
                            اليوم 3
                          </th>

                          <th>
                            Pre
                          </th>

                          <th>
                            Post
                          </th>

                          <th>
                            Evaluation
                          </th>

                          <th>
                            إزالة
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {members.map(
                          (trainee) => {
                            const enrollment =
                              getEnrollment(
                                trainee,
                                selectedGroup,
                              );

                            const days =
                              enrollment
                                ?.attendanceDays ??
                              [];

                            const pre =
                              assessmentStateLabel(
                                enrollment
                                  ?.preAssessment,
                                enrollment
                                  ?.preAssessmentScore,
                              );

                            const post =
                              assessmentStateLabel(
                                enrollment
                                  ?.postAssessment,
                                enrollment
                                  ?.postAssessmentScore,
                              );

                            const evaluation =
                              assessmentStateLabel(
                                enrollment
                                  ?.courseEvaluation,
                                enrollment
                                  ?.courseEvaluationScore,
                              );

                            return (
                              <tr
                                key={
                                  trainee.id
                                }
                              >
                                <td>
                                  <strong>
                                    {getTraineeName(
                                      trainee,
                                    )}
                                  </strong>

                                  {getEnglishName(
                                    trainee,
                                  ) && (
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color:
                                          '#6b7280',
                                        marginTop: 3,
                                      }}
                                    >
                                      {
                                        getEnglishName(
                                          trainee,
                                        )
                                      }
                                    </div>
                                  )}
                                </td>

                                <td>
                                  {trainee.email}
                                </td>

                                {/* DAY 1 */}

                                <td>
                                  <div
                                    style={{
                                      display:
                                        'flex',
                                      gap: 4,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className={
                                        days[0]
                                          ?.status ===
                                        'present'
                                          ? 'admin-btn admin-btn-primary'
                                          : 'admin-btn admin-btn-light'
                                      }
                                      style={{
                                        padding:
                                          '5px 8px',
                                        fontSize:
                                          12,
                                      }}
                                      onClick={() =>
                                        void markAttendance(
                                          trainee,
                                          0,
                                          'present',
                                        )
                                      }
                                    >
                                      حاضر
                                    </button>

                                    <button
                                      type="button"
                                      className={
                                        days[0]
                                          ?.status ===
                                        'absent'
                                          ? 'admin-btn admin-btn-danger'
                                          : 'admin-btn admin-btn-light'
                                      }
                                      style={{
                                        padding:
                                          '5px 8px',
                                        fontSize:
                                          12,
                                      }}
                                      onClick={() =>
                                        void markAttendance(
                                          trainee,
                                          0,
                                          'absent',
                                        )
                                      }
                                    >
                                      غائب
                                    </button>
                                  </div>
                                </td>

                                {/* DAY 2 */}

                                <td>
                                  <div
                                    style={{
                                      display:
                                        'flex',
                                      gap: 4,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className={
                                        days[1]
                                          ?.status ===
                                        'present'
                                          ? 'admin-btn admin-btn-primary'
                                          : 'admin-btn admin-btn-light'
                                      }
                                      style={{
                                        padding:
                                          '5px 8px',
                                        fontSize:
                                          12,
                                      }}
                                      onClick={() =>
                                        void markAttendance(
                                          trainee,
                                          1,
                                          'present',
                                        )
                                      }
                                    >
                                      حاضر
                                    </button>

                                    <button
                                      type="button"
                                      className={
                                        days[1]
                                          ?.status ===
                                        'absent'
                                          ? 'admin-btn admin-btn-danger'
                                          : 'admin-btn admin-btn-light'
                                      }
                                      style={{
                                        padding:
                                          '5px 8px',
                                        fontSize:
                                          12,
                                      }}
                                      onClick={() =>
                                        void markAttendance(
                                          trainee,
                                          1,
                                          'absent',
                                        )
                                      }
                                    >
                                      غائب
                                    </button>
                                  </div>
                                </td>

                                {/* DAY 3 */}

                                <td>
                                  <div
                                    style={{
                                      display:
                                        'flex',
                                      gap: 4,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className={
                                        days[2]
                                          ?.status ===
                                        'present'
                                          ? 'admin-btn admin-btn-primary'
                                          : 'admin-btn admin-btn-light'
                                      }
                                      style={{
                                        padding:
                                          '5px 8px',
                                        fontSize:
                                          12,
                                      }}
                                      onClick={() =>
                                        void markAttendance(
                                          trainee,
                                          2,
                                          'present',
                                        )
                                      }
                                    >
                                      حاضر
                                    </button>

                                    <button
                                      type="button"
                                      className={
                                        days[2]
                                          ?.status ===
                                        'absent'
                                          ? 'admin-btn admin-btn-danger'
                                          : 'admin-btn admin-btn-light'
                                      }
                                      style={{
                                        padding:
                                          '5px 8px',
                                        fontSize:
                                          12,
                                      }}
                                      onClick={() =>
                                        void markAttendance(
                                          trainee,
                                          2,
                                          'absent',
                                        )
                                      }
                                    >
                                      غائب
                                    </button>
                                  </div>
                                </td>

                                {/* PRE */}

                                <td>
                                  <span
                                    className={
                                      pre.className
                                    }
                                  >
                                    {pre.label}
                                  </span>
                                </td>

                                {/* POST */}

                                <td>
                                  <span
                                    className={
                                      post.className
                                    }
                                  >
                                    {post.label}
                                  </span>
                                </td>

                                {/* EVALUATION */}

                                <td>
                                  <span
                                    className={
                                      evaluation.className
                                    }
                                  >
                                    {
                                      evaluation.label
                                    }
                                  </span>
                                </td>

                                {/* REMOVE */}

                                <td>
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn-danger"
                                    style={{
                                      padding:
                                        '6px 10px',
                                    }}
                                    onClick={() =>
                                      void removeMember(
                                        trainee.id,
                                      )
                                    }
                                  >
                                    إزالة
                                  </button>
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* =========================
          REPORT MODAL
         ========================= */}

      {reportOpen &&
        selectedGroup && (
          <div className="admin-modal-backdrop">
            <div
              className="admin-modal"
              style={{
                maxWidth: 1200,
              }}
            >
              <div
                className="admin-modal-header"
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                    }}
                  >
                    تقرير المجموعة
                  </h2>

                  <p
                    style={{
                      margin:
                        '6px 0 0',
                      color:
                        '#6b7280',
                    }}
                  >
                    {selectedCompany}
                    {' — '}
                    {
                      selectedGroup.courseTitle
                    }
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() =>
                    setReportOpen(false)
                  }
                >
                  ×
                </button>
              </div>

              <div
                className="admin-modal-body"
              >
                {/* COURSE INFORMATION */}

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      'repeat(4, minmax(0, 1fr))',
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      padding: 14,
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        color:
                          '#6b7280',
                        fontSize: 12,
                      }}
                    >
                      الدورة
                    </div>

                    <strong>
                      {
                        selectedGroup.courseTitle
                      }
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        color:
                          '#6b7280',
                        fontSize: 12,
                      }}
                    >
                      التاريخ
                    </div>

                    <strong>
                      {formatDateLong(
                        selectedSchedule?.startDate,
                      )}

                      {selectedSchedule?.endDate &&
                        ` — ${formatDateLong(
                          selectedSchedule.endDate,
                        )}`}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        color:
                          '#6b7280',
                        fontSize: 12,
                      }}
                    >
                      المكان
                    </div>

                    <strong>
                      {selectedSchedule?.city ||
                        selectedSchedule?.location ||
                        '—'}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: 14,
                      border:
                        '1px solid #e5e7eb',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        color:
                          '#6b7280',
                        fontSize: 12,
                      }}
                    >
                      عدد المتدربين
                    </div>

                    <strong>
                      {members.length}
                    </strong>
                  </div>
                </div>

                {/* REPORT TABLE */}

                <div
                  className="admin-table-card"
                  style={{
                    overflowX:
                      'auto',
                  }}
                >
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>
                          #
                        </th>

                        <th>
                          المتدرب
                        </th>

                        <th>
                          اليوم 1
                        </th>

                        <th>
                          اليوم 2
                        </th>

                        <th>
                          اليوم 3
                        </th>

                        <th>
                          Pre
                        </th>

                        <th>
                          Post
                        </th>

                        <th>
                          Evaluation
                        </th>

                        <th>
                          التقدم
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {members.map(
                        (
                          trainee,
                          index,
                        ) => {
                          const enrollment =
                            getEnrollment(
                              trainee,
                              selectedGroup,
                            );

                          const days =
                            enrollment
                              ?.attendanceDays ??
                            [];

                          return (
                            <tr
                              key={
                                trainee.id
                              }
                            >
                              <td>
                                {index + 1}
                              </td>

                              <td>
                                <strong>
                                  {getTraineeName(
                                    trainee,
                                  )}
                                </strong>

                                {getEnglishName(
                                  trainee,
                                ) && (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color:
                                        '#6b7280',
                                      marginTop: 3,
                                    }}
                                  >
                                    {
                                      getEnglishName(
                                        trainee,
                                      )
                                    }
                                  </div>
                                )}
                              </td>

                              <td>
                                {attendanceLabel(
                                  days[0]
                                    ?.status,
                                )}
                              </td>

                              <td>
                                {attendanceLabel(
                                  days[1]
                                    ?.status,
                                )}
                              </td>

                              <td>
                                {attendanceLabel(
                                  days[2]
                                    ?.status,
                                )}
                              </td>

                              <td>
                                {typeof enrollment
                                  ?.preAssessmentScore ===
                                'number'
                                  ? `${enrollment.preAssessmentScore}/100`
                                  : enrollment?.preAssessment ===
                                      'completed'
                                    ? 'مكتمل'
                                    : '—'}
                              </td>

                              <td>
                                {typeof enrollment
                                  ?.postAssessmentScore ===
                                'number'
                                  ? `${enrollment.postAssessmentScore}/100`
                                  : enrollment?.postAssessment ===
                                      'completed'
                                    ? 'مكتمل'
                                    : '—'}
                              </td>

                              <td>
                                {typeof enrollment
                                  ?.courseEvaluationScore ===
                                'number'
                                  ? `${enrollment.courseEvaluationScore}/100`
                                  : enrollment?.courseEvaluation ===
                                      'completed'
                                    ? 'مكتمل'
                                    : '—'}
                              </td>

                              <td>
                                {enrollment?.progress ??
                                  0}
                                %
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                className="admin-modal-footer"
              >
                <button
                  type="button"
                  className="admin-btn admin-btn-light"
                  onClick={() =>
                    setReportOpen(false)
                  }
                >
                  إغلاق
                </button>

                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={printProfessionalReport}
                >
                  طباعة التقرير
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =========================
          CREATE / EDIT GROUP
         ========================= */}

      {open && (
        <div className="admin-modal-backdrop">
          <form
            className="admin-modal"
            style={{
              maxWidth: 760,
            }}
            onSubmit={
              editingId
                ? updateGroup
                : createGroup
            }
          >
            <div
              className="admin-modal-header"
            >
              <h2>
                {editingId
                  ? 'تعديل مجموعة شركة'
                  : 'إضافة مجموعة شركة'}
              </h2>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() => {
                  setOpen(false);
                  setEditingId(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <div
              className="admin-modal-body"
            >
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>
                    اسم المجموعة
                  </label>

                  <input
                    className="admin-input"
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name:
                          event.target
                            .value,
                      })
                    }
                    placeholder="اختياري"
                  />
                </div>

                <div className="admin-field">
                  <label>
                    اسم الشركة
                  </label>

                  <input
                    className="admin-input"
                    required
                    value={
                      form.companyName
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        companyName:
                          event.target
                            .value,
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>
                    الدورة
                  </label>

                  <select
                    className="admin-select"
                    required
                    value={
                      form.courseId
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        courseId:
                          event.target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      اختر الدورة
                    </option>

                    {courses.map(
                      (course) => (
                        <option
                          key={
                            course.id
                          }
                          value={
                            course.id
                          }
                        >
                          {
                            course.title
                          }
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="admin-field">
                  <label>
                    الموعد
                  </label>

                  <select
                    className="admin-select"
                    value={
                      form.scheduleId
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        scheduleId:
                          event.target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      بدون موعد محدد
                    </option>

                    {schedules
                      .filter(
                        (schedule) =>
                          schedule.courseId ===
                          form.courseId,
                      )
                      .map(
                        (
                          schedule,
                        ) => (
                          <option
                            key={
                              schedule.id
                            }
                            value={
                              schedule.id
                            }
                          >
                            {formatDate(
                              schedule.startDate,
                            )}
                            {' — '}
                            {schedule.city ||
                              schedule.location ||
                              'Online'}
                          </option>
                        ),
                      )}
                  </select>
                </div>

                <div className="admin-field">
                  <label>
                    اسم المسؤول
                  </label>

                  <input
                    className="admin-input"
                    value={
                      form.responsibleName
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        responsibleName:
                          event.target
                            .value,
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>
                    بريد المسؤول
                  </label>

                  <input
                    className="admin-input"
                    type="email"
                    value={
                      form.responsibleEmail
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        responsibleEmail:
                          event.target
                            .value,
                      })
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>
                    جوال المسؤول
                  </label>

                  <input
                    className="admin-input"
                    value={
                      form.responsiblePhone
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        responsiblePhone:
                          event.target
                            .value,
                      })
                    }
                  />
                </div>
              </div>

              <div
                className="admin-field"
                style={{
                  marginTop: 14,
                }}
              >
                <label>
                  ملاحظات
                </label>

                <textarea
                  className="admin-textarea"
                  rows={4}
                  value={
                    form.notes
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      notes:
                        event.target
                          .value,
                    })
                  }
                />
              </div>
            </div>

            <div
              className="admin-modal-footer"
            >
              <button
                type="button"
                className="admin-btn admin-btn-light"
                onClick={() => {
                  setOpen(false);
                  setEditingId(null);
                  resetForm();
                }}
              >
                إلغاء
              </button>

              <button className="admin-btn admin-btn-primary">
                {editingId
                  ? 'حفظ التعديلات'
                  : 'حفظ المجموعة'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}