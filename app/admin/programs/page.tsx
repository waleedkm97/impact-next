'use client';
import { useEffect, useMemo, useState } from 'react';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { categoryRepository } from '@/lib/data/repositories/category-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';
import type { Course } from '@/types/course';
import type { Schedule } from '@/types/schedule';
const cities = ['الرياض', 'جدة', 'الدمام', 'دبي', 'القاهرة', 'البحرين', 'قطر', 'لندن', 'برشلونة', 'ميلان', 'Online'];
const empty = { title: '', categoryId: '', trainer: '', days: '3', price: '', description: '', objectives: '', audience: '', materials: true, pre: true, post: true, evaluation: true, attendance: true, published: true, featured: false };
type Form = typeof empty;
type ScheduleForm = {
    delivery: 'in-person' | 'online';
    startDate: string;
    endDate: string;
    city: string;
    location: string;
    meeting: string;
    max: string;
    price: string;
};
const emptySchedule: ScheduleForm = { delivery: 'in-person', startDate: '', endDate: '', city: 'الرياض', location: '', meeting: '', max: '20', price: '' };
function priceFor(city: string, base: number) { if (city === 'Online' || city === 'أونلاين')
    return 3000; if (city === 'القاهرة')
    return 8500; if (['دبي', 'البحرين', 'قطر'].includes(city))
    return 16000; if (['لندن', 'برشلونة', 'ميلان'].includes(city))
    return 21000; return base || 5000; }
function sundays(year: number) { const d = new Date(year, 0, 1); while (d.getDay() !== 0)
    d.setDate(d.getDate() + 1); const out: string[] = []; while (d.getFullYear() === year) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    d.setDate(d.getDate() + 7);
} return out; }
function asDate(s: string) { return new Date(`${s}T00:00:00`); }
function addDays(value: Date, days: number) { const d = new Date(value); d.setDate(d.getDate() + days); return d; }
function isPublicTraining(course: Course) { return course.type === 'training' && course.trainingKind !== 'corporate' && course.published; }
function cityForIndex(index: number) { return cities[index % cities.length]; }
function formatDate(value: Date) { const d = new Date(value); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; }
export default function ProgramsAdmin() {
    const [programs, setPrograms] = useState<Course[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [form, setForm] = useState<Form>(empty);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [programForSchedule, setProgramForSchedule] = useState<Course | null>(null);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [sf, setSf] = useState<ScheduleForm>(emptySchedule);
    const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
    async function load() { const [p, c] = await Promise.all([courseRepository.findByType('training'), categoryRepository.findAll({ sort: 'name', order: 'asc' })]); setPrograms(p); setCategories(c); }
    useEffect(() => { void load(); }, []);
    const visible = useMemo(() => programs.filter(p => { const q = search.trim().toLowerCase(); return (!q || p.title.toLowerCase().includes(q) || (p.trainer?.name ?? '').toLowerCase().includes(q)) && (status === 'all' || (status === 'published' ? p.published : !p.published)); }), [programs, search, status]);
    function set<K extends keyof Form>(k: K, v: Form[K]) { setForm(x => ({ ...x, [k]: v })); }
    function add() { setEditing(null); setForm(empty); setOpen(true); }
    function edit(p: Course) { setEditing(p.id); setForm({ title: p.title, categoryId: p.categoryId ?? '', trainer: p.trainer?.name ?? '', days: '3', price: String(p.price ?? ''), description: p.description ?? '', objectives: (p.objectives ?? []).join('\n'), audience: p.audience ?? '', materials: p.materialsEnabled !== false, pre: p.preAssessmentEnabled !== false, post: p.postAssessmentEnabled !== false, evaluation: p.courseEvaluationEnabled !== false, attendance: p.attendanceEnabled !== false, published: p.published, featured: p.featured }); setOpen(true); }
    async function save(e: React.FormEvent) { e.preventDefault(); if (!form.title.trim())
        return alert('أدخل اسم البرنامج.'); const category = categories.find(c => c.id === form.categoryId); const payload: any = { title: form.title.trim(), slug: form.title.trim().toLowerCase().replace(/\s+/g, '-'), description: form.description.trim(), shortDescription: form.description.trim().slice(0, 180), categoryId: form.categoryId || undefined, type: 'training', delivery: 'in-person', price: Number(form.price) || 5000, days: 3, hours: 0, objectives: form.objectives.split('\n').map(x => x.trim()).filter(Boolean), outcomes: [], outline: '', lessons: [], schedules: editing ? programs.find(p => p.id === editing)?.schedules ?? [] : [], assessments: [], audience: form.audience, trainer: { id: editing ? programs.find(p => p.id === editing)?.trainer?.id ?? `trainer-${Date.now()}` : `trainer-${Date.now()}`, name: form.trainer }, featured: form.featured, published: form.published, status: form.published ? 'published' : 'draft', certificateSettings: { enabled: true, autoGenerate: false, requireCompletion: true, requireAssessmentPass: false }, materialsEnabled: form.materials, preAssessmentEnabled: form.pre, postAssessmentEnabled: form.post, courseEvaluationEnabled: form.evaluation, attendanceEnabled: form.attendance, createdAt: editing ? programs.find(p => p.id === editing)?.createdAt ?? new Date() : new Date(), updatedAt: new Date() }; if (editing)
        await courseRepository.update(editing, payload);
    else
        await courseRepository.create(payload); setOpen(false); await load(); }
    async function remove() { if (deleteId) {
        await courseRepository.delete(deleteId);
        setDeleteId(null);
        await load();
    } }
    async function toggle(p: Course) { await courseRepository.update(p.id, { published: !p.published, status: !p.published ? 'published' : 'draft' }); await load(); }
    async function openSchedules(p: Course) { setProgramForSchedule(p); setEditingSchedule(null); setSf(emptySchedule); setSchedules(await scheduleRepository.findByCourseId(p.id)); setScheduleOpen(true); }
    function closeSchedules() { setScheduleOpen(false); setProgramForSchedule(null); setSchedules([]); setEditingSchedule(null); }
    function editSchedule(s: Schedule) { setEditingSchedule(s.id); setSf({ delivery: s.city === 'Online' || s.city === 'أونلاين' ? 'online' : 'in-person', startDate: s.startDate.toISOString().slice(0, 10), endDate: s.endDate.toISOString().slice(0, 10), city: s.city ?? 'الرياض', location: s.location ?? '', meeting: s.onlineMeetingLink ?? '', max: String(s.maxParticipants), price: String(s.price ?? '') }); }
    async function saveSchedule(e: React.FormEvent) { e.preventDefault(); if (!programForSchedule || !sf.startDate)
        return; const online = sf.delivery === 'online'; const startDate = asDate(sf.startDate); const city = online ? 'Online' : sf.city; const data: any = { courseId: programForSchedule.id, courseTitle: programForSchedule.title, title: programForSchedule.title, description: programForSchedule.description, startDate, endDate: addDays(startDate, 2), startTime: '', endTime: '', city, location: online ? undefined : sf.location || undefined, onlineMeetingLink: online ? sf.meeting || undefined : undefined, maxParticipants: Number(sf.max) || 20, currentParticipants: 0, price: Number(sf.price) || priceFor(city, Number(programForSchedule.price)), currency: 'SAR', instructorName: programForSchedule.trainer?.name, status: 'available', published: programForSchedule.published, allowWaitlist: true, requireConfirmation: false, recurrence: 'once' }; if (editingSchedule)
        await scheduleRepository.update(editingSchedule, data);
    else
        await scheduleRepository.create(data); setEditingSchedule(null); setSf(emptySchedule); setSchedules(await scheduleRepository.findByCourseId(programForSchedule.id)); }
    async function deleteSchedule(id: string) { if (confirm('حذف هذا الموعد؟')) {
        await scheduleRepository.delete(id);
        if (programForSchedule)
            setSchedules(await scheduleRepository.findByCourseId(programForSchedule.id));
    } }
    async function deleteAllSchedulesForProgram() {
        if (!programForSchedule || schedules.length === 0) return;
        if (!confirm(`هل أنت متأكد من حذف جميع مواعيد ${programForSchedule.title}؟`)) return;
        for (const schedule of schedules) await scheduleRepository.delete(schedule.id);
        setSchedules([]); setEditingSchedule(null); setSf(emptySchedule);
    }
    async function deleteAllPublicSchedules() {
        const all = await scheduleRepository.findAll();
        const publicCourseIds = new Set(programs.filter(isPublicTraining).map(p => p.id));
        const publicSchedules = all.filter(s => publicCourseIds.has(s.courseId));
        if (!publicSchedules.length) return alert('لا توجد جدولة عامة لحذفها.');
        if (!confirm('سيتم حذف جميع مواعيد Public المجدولة. هل تريد المتابعة؟')) return;
        for (const schedule of publicSchedules) await scheduleRepository.delete(schedule.id);
        if (programForSchedule) setSchedules([]);
        alert(`تم حذف ${publicSchedules.length} موعدًا.`);
    }
    async function generate(year: number) {
        if (!programForSchedule || !isPublicTraining(programForSchedule)) return alert('يمكن جدولة Public Courses فقط.');
        if (!confirm(`سيتم جدولة ${programForSchedule.title} بحيث تظهر كل المدن مرة واحدة على الأقل في كل شهر، وفي أيام الأحد فقط. هل تريد المتابعة؟`)) return;
        const created = await scheduleRepository.generateSchedules({
            startDate: `${year}-01-01`,
            endDate: `${year}-12-31`,
            cities,
            courseIds: [programForSchedule.id],
        });
        setSchedules(await scheduleRepository.findByCourseId(programForSchedule.id));
        alert(created.length ? `تم إنشاء ${created.length} موعدًا لعام ${year} — كل مدينة مرة واحدة على الأقل في كل شهر.` : 'لا توجد مواعيد جديدة لهذا العام.');
    }
    async function generateAll(year: number) {
        const publicPrograms = programs.filter(isPublicTraining);
        if (!publicPrograms.length) return alert('لا توجد برامج Public منشورة للجدولة.');
        if (!confirm(`سيتم جدولة جميع برامج Public بحيث تظهر كل المدن مرة واحدة على الأقل في كل شهر، وفي أيام الأحد فقط لعام ${year}. هل تريد المتابعة؟`)) return;
        const created = await scheduleRepository.generateSchedules({
            startDate: `${year}-01-01`,
            endDate: `${year}-12-31`,
            cities,
            courseIds: publicPrograms.map(p => p.id),
        });
        if (programForSchedule) setSchedules(await scheduleRepository.findByCourseId(programForSchedule.id));
        alert(created.length ? `تم إنشاء ${created.length} موعدًا لعام ${year}.` : 'لا توجد مواعيد جديدة لهذا العام.');
    }
    return <main className="admin-page" dir="rtl"><header className="admin-page-header"><div><div className="eyebrow">Admin</div><h1>إدارة البرامج التدريبية</h1><p>إنشاء البرامج وجدولة المواعيد الحضورية والأونلاين.</p></div><div className="admin-actions"><button className="admin-btn admin-btn-primary" onClick={add}>+ إضافة برنامج تدريبي</button></div></header>
 <div className="admin-toolbar"><input className="admin-input" placeholder="البحث في البرامج التدريبية..." value={search} onChange={e => setSearch(e.target.value)}/><select className="admin-select" style={{ width: 150 }} value={status} onChange={e => setStatus(e.target.value as any)}><option value="all">كل الحالات</option><option value="published">منشورة</option><option value="draft">مسودة</option></select><button className="admin-btn admin-btn-gold" onClick={() => void generateAll(2026)}>جدولة 2026</button><button className="admin-btn admin-btn-gold" onClick={() => void generateAll(2027)}>جدولة 2027</button><button className="admin-btn admin-btn-danger" onClick={() => void deleteAllPublicSchedules()}>إلغاء جميع الجدولة</button></div>
 <section className="admin-stats"><div className="admin-stat"><div className="admin-stat-label">إجمالي البرامج</div><div className="admin-stat-value">{programs.length}</div></div><div className="admin-stat"><div className="admin-stat-label">حضورية / أساسية</div><div className="admin-stat-value">{programs.length}</div></div><div className="admin-stat"><div className="admin-stat-label">المنشورة</div><div className="admin-stat-value">{programs.filter(p => p.published).length}</div></div><div className="admin-stat"><div className="admin-stat-label">المسودات</div><div className="admin-stat-value">{programs.filter(p => !p.published).length}</div></div></section>
 <section className="admin-card-grid">{visible.length === 0 ? <div className="admin-card admin-empty" style={{ gridColumn: '1/-1' }}><strong>لا توجد برامج</strong><span>البرامج التدريبية الموجودة في الكتالوج ستظهر هنا.</span></div> : visible.map(p => <article className="admin-course-card" key={p.id}><div className="admin-course-body"><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><h3 className="admin-course-title">{p.title}</h3><span className={`admin-status ${p.published ? 'admin-status-ok' : 'admin-status-draft'}`}>{p.published ? 'منشور' : 'مسودة'}</span></div><p className="admin-course-desc">{p.shortDescription || p.description}</p><div className="admin-meta"><span className="admin-tag">{categories.find(c => c.id === p.categoryId)?.name || 'بدون تصنيف'}</span><span>{p.days || 0} أيام</span><span>{p.trainer?.name || 'بدون مدرب'}</span><span>{p.price.toLocaleString('ar-SA')} SAR أساس</span></div><div className="admin-card-actions"><button className="admin-btn admin-btn-gold" onClick={() => void openSchedules(p)}>إدارة المواعيد</button><button className="admin-btn admin-btn-light" onClick={() => edit(p)}>تعديل</button><button className="admin-btn admin-btn-light" onClick={() => void toggle(p)}>{p.published ? 'إلغاء النشر' : 'نشر'}</button><button className="admin-btn admin-btn-danger" onClick={() => setDeleteId(p.id)}>حذف</button></div></div></article>)}</section>
 {open && <div className="admin-modal-backdrop"><form className="admin-modal" onSubmit={save}><div className="admin-modal-header"><h2>{editing ? 'تعديل برنامج تدريبي' : 'إضافة برنامج تدريبي'}</h2><button type="button" className="admin-modal-close" onClick={() => setOpen(false)}>×</button></div><div className="admin-modal-body"><div className="admin-form-grid"><Field label="اسم البرنامج"><input className="admin-input" required value={form.title} onChange={e => set('title', e.target.value)}/></Field><Field label="التصنيف"><select className="admin-select" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}><option value="">اختر التصنيف</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="المدرب"><input className="admin-input" value={form.trainer} onChange={e => set('trainer', e.target.value)}/></Field><Field label="عدد الأيام"><input className="admin-input" type="number" value="3" readOnly/></Field><Field label="السعر الأساسي"><input className="admin-input" type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)}/></Field><Field label="الفئة المستهدفة"><input className="admin-input" value={form.audience} onChange={e => set('audience', e.target.value)}/></Field><Field label="الوصف" full><textarea className="admin-textarea" rows={4} value={form.description} onChange={e => set('description', e.target.value)}/></Field><Field label="الأهداف — هدف في كل سطر" full><textarea className="admin-textarea" rows={5} value={form.objectives} onChange={e => set('objectives', e.target.value)}/></Field></div><div className="admin-checkboxes" style={{ marginTop: 16 }}>{[['materials', 'مواد تدريبية'], ['pre', 'تقييم قبلي'], ['post', 'تقييم بعدي'], ['evaluation', 'تقييم الدورة'], ['attendance', 'الحضور'], ['published', 'منشور'], ['featured', 'مميز']].map(([k, l]) => <label className="admin-checkbox" key={k}><input type="checkbox" checked={(form as any)[k]} onChange={e => set(k as any, e.target.checked)}/>{l}</label>)}</div></div><div className="admin-modal-footer"><button type="button" className="admin-btn admin-btn-light" onClick={() => setOpen(false)}>إلغاء</button><button className="admin-btn admin-btn-primary">حفظ البرنامج</button></div></form></div>}
 {deleteId && <div className="admin-modal-backdrop"><div className="admin-modal" style={{ width: 420 }}><div className="admin-modal-body"><h2>حذف البرنامج؟</h2><p>سيتم حذف البرنامج من بيانات الإدارة الحالية.</p></div><div className="admin-modal-footer"><button className="admin-btn admin-btn-light" onClick={() => setDeleteId(null)}>إلغاء</button><button className="admin-btn admin-btn-danger" onClick={() => void remove()}>حذف</button></div></div></div>}
 {scheduleOpen && programForSchedule && <div className="admin-modal-backdrop"><div className="admin-modal" style={{ maxWidth: 1050 }}><div className="admin-modal-header"><div><h2>إدارة المواعيد — {programForSchedule.title}</h2><p style={{ margin: 4, color: '#6b7890', fontSize: 12 }}>الحضور والموقع أو رابط Zoom يضاف للمشارك بعد التسجيل.</p></div><button className="admin-modal-close" onClick={closeSchedules}>×</button></div><div className="admin-modal-body"><div className="admin-actions" style={{ marginBottom: 15 }}><button className="admin-btn admin-btn-gold" onClick={() => void generate(2026)}>جدولة هذا البرنامج 2026</button><button className="admin-btn admin-btn-gold" onClick={() => void generate(2027)}>جدولة هذا البرنامج 2027</button><button className="admin-btn admin-btn-light" onClick={() => { setEditingSchedule(null); setSf(emptySchedule); }}>+ إضافة موعد يدوي</button><button className="admin-btn admin-btn-danger" onClick={() => void deleteAllSchedulesForProgram()}>إلغاء جدولة البرنامج بالكامل</button></div><form onSubmit={saveSchedule} className="admin-card" style={{ padding: 15, marginBottom: 15 }}><div className="admin-form-grid"><Field label="نوع التنفيذ"><select className="admin-select" value={sf.delivery} onChange={e => setSf({ ...sf, delivery: e.target.value as any, city: e.target.value === 'online' ? 'Online' : 'الرياض' })}><option value="in-person">حضوري</option><option value="online">أونلاين</option></select></Field><Field label="تاريخ البداية"><input className="admin-input" type="date" required value={sf.startDate} onChange={e => setSf({ ...sf, startDate: e.target.value })}/></Field><Field label="المدينة"><select className="admin-select" disabled={sf.delivery === 'online'} value={sf.delivery === 'online' ? 'Online' : sf.city} onChange={e => setSf({ ...sf, city: e.target.value })}><option value="الرياض">الرياض</option>{cities.slice(1, 10).map(c => <option key={c} value={c}>{c}</option>)}</select></Field><Field label="السعر"><input className="admin-input" value={`${priceFor(sf.delivery === 'online' ? 'Online' : sf.city, 0).toLocaleString('ar-SA')} SAR`} readOnly/></Field><Field label="الحد الأقصى"><input className="admin-input" type="number" min="1" value={sf.max} onChange={e => setSf({ ...sf, max: e.target.value })}/></Field>{sf.delivery === 'in-person' ? <Field label="الموقع"><input className="admin-input" placeholder="يظهر للمشارك بعد التسجيل" value={sf.location} onChange={e => setSf({ ...sf, location: e.target.value })}/></Field> : <Field label="رابط Zoom"><input className="admin-input" placeholder="يظهر للمشارك بعد التسجيل" value={sf.meeting} onChange={e => setSf({ ...sf, meeting: e.target.value })}/></Field>}</div><div className="admin-modal-footer" style={{ padding: '14px 0 0', border: 0 }}><button className="admin-btn admin-btn-primary">{editingSchedule ? 'حفظ تعديل الموعد' : 'إضافة الموعد'}</button>{editingSchedule && <button type="button" className="admin-btn admin-btn-light" onClick={() => { setEditingSchedule(null); setSf(emptySchedule); }}>إلغاء التعديل</button>}</div></form><div className="admin-table-card"><table className="admin-table"><thead><tr><th>التاريخ</th><th>التنفيذ</th><th>المدينة</th><th>السعر</th><th>الإجراءات</th></tr></thead><tbody>{schedules.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()).map(s => <tr key={s.id}><td>{formatDate(s.startDate)}</td><td>{s.city === 'Online' ? 'Online' : 'حضوري'}</td><td>{s.city || '—'}</td><td>{Number(s.price || 0).toLocaleString('ar-SA')} SAR</td><td><button className="admin-btn admin-btn-light" onClick={() => editSchedule(s)}>تعديل</button> <button className="admin-btn admin-btn-danger" onClick={() => void deleteSchedule(s.id)}>حذف</button></td></tr>)}{schedules.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 25, color: '#6b7890' }}>لا توجد مواعيد حتى الآن.</td></tr>}</tbody></table></div></div><div className="admin-modal-footer"><button className="admin-btn admin-btn-light" onClick={closeSchedules}>إغلاق</button></div></div></div>}
 </main>;
}
function Field({ label, children, full = false }: {
    label: string;
    children: React.ReactNode;
    full?: boolean;
}) { return <div className={full ? 'admin-field admin-field-full' : 'admin-field'}><label>{label}</label>{children}</div>; }

