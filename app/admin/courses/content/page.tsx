'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import type { Course, CourseLesson } from '@/types/course';

const emptyForm = { type: 'video' as 'video' | 'quiz', title: '', description: '', videoId: '', question: '', options: ['', '', '', ''], correctAnswer: '' };

export default function RecordedCourseContentPage() {
  const params = useSearchParams();
  const courseId = params.get('id');
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!courseId) return;
    const found = await courseRepository.findById(courseId);
    setCourse(found);
    setLessons(found?.lessons ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [courseId]);

  async function addLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courseId || !form.title.trim()) return;

    const lesson: Omit<CourseLesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt'> = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      order: lessons.length,
      videoId: form.type === 'video' ? form.videoId.trim() : undefined,
      questions: form.type === 'quiz' ? [{ id: `question-${Date.now()}`, lessonId: '', question: form.question.trim(), type: 'multiple-choice', options: form.options.filter(Boolean), correctAnswer: form.correctAnswer, order: 0 }] : undefined,
    };

    await courseRepository.createLesson(courseId, lesson);
    setForm(emptyForm);
    await load();
  }

  async function removeLesson(id: string) {
    if (!confirm('هل تريد حذف هذا المحتوى؟')) return;
    await courseRepository.deleteLesson(id);
    await load();
  }

  if (loading) return <main dir="rtl" style={{ padding: 32 }}>جاري التحميل...</main>;
  if (!course) return <main dir="rtl" style={{ padding: 32 }}>الدورة غير موجودة.</main>;

  return (
    <main dir="rtl" style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>إدارة المحتوى والأسئلة</h1>
      <p style={{ color: '#6b7280', marginBottom: 28 }}>{course.title}</p>

      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>إضافة محتوى</h2>
        <form onSubmit={addLesson} style={{ display: 'grid', gap: 14 }}>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'video' | 'quiz' })}>
            <option value="video">فيديو</option><option value="quiz">اختبار تفاعلي</option>
          </select>
          <input placeholder="عنوان المحتوى" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea placeholder="الوصف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {form.type === 'video' ? <input placeholder="رابط/معرّف الفيديو" value={form.videoId} onChange={(e) => setForm({ ...form, videoId: e.target.value })} required /> : (
            <>
              <textarea placeholder="السؤال" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
              {form.options.map((option, index) => <input key={index} placeholder={`الخيار ${index + 1}`} value={option} onChange={(e) => { const options = [...form.options]; options[index] = e.target.value; setForm({ ...form, options }); }} />)}
              <input placeholder="الإجابة الصحيحة (اكتب نص الخيار)" value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} required />
            </>
          )}
          <button type="submit" style={{ background: '#16233d', color: '#fff', border: 0, borderRadius: 10, padding: '12px 18px', cursor: 'pointer' }}>إضافة المحتوى</button>
        </form>
      </section>

      <section style={{ display: 'grid', gap: 12 }}>
        {lessons.length === 0 ? <p>لا يوجد محتوى حتى الآن.</p> : lessons.map((lesson, index) => (
          <article key={lesson.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 18, display: 'flex', justifyContent: 'space-between', gap: 20 }}>
            <div><strong>{index + 1}. {lesson.title}</strong><div style={{ color: '#6b7280', marginTop: 6 }}>{lesson.type === 'video' ? 'فيديو' : 'اختبار تفاعلي'}</div></div>
            <button onClick={() => removeLesson(lesson.id)} style={{ color: '#b91c1c', border: '1px solid #fecaca', background: '#fff', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>حذف</button>
          </article>
        ))}
      </section>
    </main>
  );
}
