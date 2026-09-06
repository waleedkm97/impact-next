'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { traineeRepository } from '@/lib/data/repositories/trainee-repository';

function formatDate(value: Date){return `${String(value.getDate()).padStart(2,'0')}/${String(value.getMonth()+1).padStart(2,'0')}/${value.getFullYear()}`;}
export default function CertificatePage(){
 const courseId=useSearchParams().get('courseId')||''; const [certificate,setCertificate]=useState<any>(null); const [user,setUser]=useState<any>(null); const [loading,setLoading]=useState(true); const [language,setLanguage]=useState<'ar'|'en'>('ar');
 useEffect(()=>{void (async()=>{const u=await traineeRepository.getCurrentUser();if(!u){setLoading(false);return;}setUser(u);const c=(u.certificates??[]).find((x:any)=>x.courseId===courseId);setCertificate(c);setLoading(false)})()},[courseId]);
 if(loading)return <main dir="rtl" className="container mx-auto px-6 py-12">جاري تحميل الشهادة...</main>;
 if(!user||!certificate)return <main dir="rtl" className="container mx-auto px-6 py-12"><h1>الشهادة غير متاحة</h1><p>تظهر الشهادة بعد إكمال الدورة.</p></main>;
 const arabicName=`${user.profile.firstName} ${user.profile.lastName}`.trim(); const englishName=`${user.profile.firstNameEnglish??''} ${user.profile.lastNameEnglish??''}`.trim()||arabicName; const name=language==='ar'?arabicName:englishName;
 return <main dir={language==='ar'?'rtl':'ltr'} className="container mx-auto px-6 py-12"><div className="mb-5 flex justify-between gap-3"><div><h1 className="text-2xl font-bold">الشهادة</h1><p>رقم الشهادة: {certificate.certificateNumber}</p></div><div style={{display:'flex',gap:8}}><button className="admin-btn admin-btn-light" onClick={()=>setLanguage(language==='ar'?'en':'ar')}>{language==='ar'?'English':'العربية'}</button><button className="admin-btn admin-btn-primary" onClick={()=>window.print()}>طباعة الشهادة</button></div></div><section className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border bg-white p-12 text-center shadow-sm" style={{minHeight:650,backgroundImage:"url('/assets/certificate-template.png')",backgroundSize:'cover',backgroundPosition:'center'}}><div style={{position:'relative',zIndex:1,paddingTop:110}}><p className="text-lg">{language==='ar'?'شهادة إتمام':'Certificate of Completion'}</p><h2 className="mt-8 text-4xl font-bold">{name}</h2><p className="mt-8 text-lg">{language==='ar'?'قد أتم بنجاح البرنامج التدريبي':'has successfully completed the training program'}</p><h3 className="mt-6 text-3xl font-semibold">{certificate.courseTitle}</h3><div className="mt-16 flex justify-between text-sm"><span>{language==='ar'?'تاريخ الإصدار':'Issue Date'}: {formatDate(new Date(certificate.issuedAt))}</span><span>{language==='ar'?'رقم الشهادة':'Certificate No.'}: {certificate.certificateNumber}</span></div></div></section></main>;
}
