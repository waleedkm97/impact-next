'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Course } from '@/types/course';

export default function CourseLearningPage() {
  const id = useSearchParams().get('id') || '';
  const [course, setCourse] = useState<Course | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [savedProgress, setSavedProgress] = useState(0);

  useEffect(() => { let active = true; async function load() { const [currentCourse,user] = await Promise.all([courseRepository.findById(id),traineeRepository.getCurrentUser()]); if(!active)return; const enrollment=user?.enrollments.find(e=>currentCourse&&e.courseId===currentCourse.id); setCourse(currentCourse); setAllowed(Boolean(enrollment)); setSavedProgress(Number(enrollment?.progress??0)); if(currentCourse&&enrollment){const progress=await traineeRepository.getProgress(user!.id,currentCourse.id);const completed=progress.filter(x=>x.completed).length;setCurrentLesson(Math.min(Math.max(completed,0),Math.max((currentCourse.lessons?.length??1)-1,0)));} setLoading(false); } void load(); return()=>{active=false}; },[id]);
  const lessons=useMemo(()=>course?.lessons??[],[course]);
  const progress=lessons.length?Math.max(savedProgress,Math.round(((Math.min(currentLesson+1,lessons.length))/lessons.length)*100)):savedProgress;
  async function markComplete(nextIndex:number){ if(!course)return; const user=await traineeRepository.getCurrentUser(); if(!user)return; const lesson=lessons[currentLesson]; if(lesson){await traineeRepository.updateProgress(user.id,{courseId:course.id,lessonId:lesson.id,completed:true,completedAt:new Date()},lessons.length);} if(nextIndex>=lessons.length){const enrollment=user.enrollments.find(e=>e.courseId===course.id);if(enrollment)await traineeRepository.completeEnrollment(user.id,enrollment.id??course.id);} setCurrentLesson(Math.min(nextIndex,Math.max(lessons.length-1,0))); const updated=await traineeRepository.findById(user.id);setSavedProgress(Number(updated?.enrollments.find(e=>e.courseId===course.id)?.progress??progress));}
  if(loading)return <main dir="rtl" className="container mx-auto px-6 py-12">جاري التحقق من التسجيل...</main>;
  if(!course)return <main dir="rtl" className="container mx-auto px-6 py-12"><h1>الدورة غير موجودة</h1></main>;
  if(!allowed)return <main dir="rtl" className="container mx-auto max-w-3xl px-6 py-12"><div className="account-empty-state"><h1>الدورة غير متاحة للتعلم بعد</h1><p>يجب شراء الدورة وتفعيل التسجيل قبل الوصول إلى المحتوى.</p><Link href={`/course-details?id=${encodeURIComponent(course.id)}`} className="btn-primary">العودة إلى تفاصيل الدورة</Link></div></main>;
  if(!lessons.length)return <main dir="rtl" className="container mx-auto px-6 py-12"><h1>{course.title}</h1><p>لم تتم إضافة محتوى الدورة بعد.</p></main>;
  const lesson=lessons[currentLesson];
  return <main dir="rtl" className="container mx-auto px-6 py-8"><div className="mb-8"><Link href="/account" className="text-sm text-muted-foreground">العودة إلى حسابي</Link><h1 className="mt-3 text-3xl font-bold">{course.title}</h1></div><div className="mb-8"><Progress value={progress}/><p className="mt-2 text-sm text-muted-foreground">{Math.round(progress)}% مكتمل</p></div><div className="grid gap-8 lg:grid-cols-[1fr_320px]"><section><div className="mb-6 aspect-video rounded-xl bg-black"/><Card><CardHeader><CardTitle>{lesson.title}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{lesson.description||'محتوى الدرس التدريبي سيظهر هنا.'}</p><div className="mt-6 flex justify-between"><Button variant="outline" disabled={currentLesson===0} onClick={()=>setCurrentLesson(v=>Math.max(0,v-1))}>السابق</Button><Button onClick={()=>void markComplete(currentLesson+1)}>{currentLesson===lessons.length-1?'إكمال الدورة':'إكمال الدرس والتالي'}</Button></div></CardContent></Card></section><aside><Card><CardHeader><CardTitle>المحتوى التدريبي</CardTitle></CardHeader><CardContent className="space-y-2">{lessons.map((item,index)=><button type="button" key={item.id} onClick={()=>setCurrentLesson(index)} className={`w-full rounded-lg p-3 text-right text-sm ${index===currentLesson?'bg-primary text-primary-foreground':'bg-muted'}`}>{index+1}. {item.title}</button>)}</CardContent></Card></aside></div></main>;
}
