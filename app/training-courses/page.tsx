'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {courseRepository} from '@/lib/data/repositories/course-repository';
import {scheduleRepository} from '@/lib/data/repositories/schedule-repository';
import {categoryRepository} from '@/lib/data/repositories/category-repository';
import type {Course} from '@/types/course';
import type {Schedule} from '@/types/schedule';

const cities=['الرياض','جدة','الدمام','دبي','القاهرة','البحرين','قطر','لندن','برشلونة','ميلان'];
const months=Array.from({length:12},(_,i)=>({value:String(i+1),label:new Date(2026,i,1).toLocaleDateString('ar-SA',{month:'long'})}));

export default function TrainingCourses(){
 const[programs,setPrograms]=useState<Course[]>([]);const[schedules,setSchedules]=useState<Schedule[]>([]);const[categories,setCategories]=useState<any[]>([]);
 const[search,setSearch]=useState('');const[category,setCategory]=useState('');const[city,setCity]=useState('');const[month,setMonth]=useState('');
 useEffect(()=>{Promise.all([courseRepository.findPublished({filter:{type:'training'}}),scheduleRepository.findUpcomingSchedules({filter:{published:true}}),categoryRepository.findAll({sort:'name',order:'asc'})]).then(([p,s,c])=>{setPrograms(p);setSchedules(s);setCategories(c)})},[]);
 const visible=useMemo(()=>programs.filter(p=>{
   const q=search.trim().toLowerCase();
   const matchesSearch=!q||[p.title,p.description,p.shortDescription,p.audience].filter(Boolean).join(' ').toLowerCase().includes(q);
   const matchesCategory=!category||p.categoryId===category;
   const ps=schedules.filter(s=>s.courseId===p.id);
   const matchesCity=!city||ps.some(s=>s.city===city);
   const matchesMonth=!month||ps.some(s=>s.startDate.getMonth()+1===Number(month));
   return matchesSearch&&matchesCategory&&matchesCity&&matchesMonth;
 }),[programs,schedules,search,category,city,month]);
 return <main dir="rtl">
  <section className="training-catalog-hero"><div className="section-inner"><div className="catalog-top-links"><span>دورة تدريبية معتمدة</span><span>مدرب معتمد</span><span>مدن تدريب حول المملكة والخليج</span></div>
   <div className="training-filter-box">
    <div className="filter-field filter-search"><label>ابحث عن دورة</label><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="اسم الدورة أو الكلمة المفتاحية"/></div>
    <div className="filter-field"><label>التصنيف</label><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">كل التصنيفات</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    <div className="filter-field"><label>المدينة</label><select value={city} onChange={e=>setCity(e.target.value)}><option value="">كل المدن</option>{cities.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
    <div className="filter-field"><label>الشهر</label><select value={month} onChange={e=>setMonth(e.target.value)}><option value="">كل الأشهر</option>{months.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
    <button className="catalog-search-btn" onClick={()=>{}} type="button">بحث</button>
   </div>
  </div></section>
  <section className="section training-catalog-section"><div className="section-inner"><div className="catalog-category-pills"><button className={!category?'active':''} onClick={()=>setCategory('')}>كل الدورات</button>{categories.slice(0,7).map(c=><button key={c.id} className={category===c.id?'active':''} onClick={()=>setCategory(c.id)}>{c.name}</button>)}</div>
   <div className="catalog-heading"><h1>أحدث الدورات المتاحة</h1><span>عرض {visible.length} من أصل {programs.length} دورة</span></div>
   <div className="cards training-catalog-grid">{visible.map(p=>{const ps=schedules.filter(s=>s.courseId===p.id);return <article key={p.id} className="training-catalog-card"><div className="training-card-image"><span>{categories.find(c=>c.id===p.categoryId)?.name||'برنامج تدريبي'}</span><div>▣</div></div><div className="training-card-body"><h3>{p.title}</h3><p>{p.shortDescription||p.description}</p><div className="training-card-meta"><span>◷ {p.days||0} أيام</span><span>📍 {ps[0]?.city||'أونلاين'}</span><span>▣ {ps.length} موعد</span></div><div className="training-card-price"><small>يبدأ من</small><strong>{Number(ps[0]?.price??p.price??0).toLocaleString('ar-SA')} ر.س</strong><Link href={`/training-program?id=${p.id}`}>التفاصيل ←</Link></div></div></article>})}</div>
   {!visible.length&&<div className="catalog-empty">لا توجد دورات مطابقة لخيارات البحث الحالية.</div>}
  </div></section>
 </main>
}
