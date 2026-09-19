'use client';
import { useEffect, useMemo, useState } from 'react';
import { courseRepository } from '@/lib/data/repositories/course-repository';
type Category = {
    id: string;
    name: string;
    description?: string;
    published?: boolean;
};
export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [published, setPublished] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    async function load() {
        const [categoryResponse, courseResponse] = await Promise.all([
            fetch('/api/categories', { cache: 'no-store' }),
            fetch('/api/courses', { cache: 'no-store' }),
        ]);
        const data = await categoryResponse.json();
        const courseData = await courseResponse.json();
        if (!categoryResponse.ok || !data.success) {
            throw new Error(data.error || 'تعذر تحميل الفئات.');
        }
        setCategories(data.categories);
        setCourses(courseData.courses ?? []);
    }
    useEffect(() => { void load(); }, []);
    const visible = useMemo(() => categories.filter(c => !search.trim() || `${c.name} ${c.description ?? ''}`.toLowerCase().includes(search.trim().toLowerCase())), [categories, search]);
    function add() { setEditing(null); setName(''); setDescription(''); setPublished(true); setOpen(true); }
    function edit(c: Category) { setEditing(c.id); setName(c.name); setDescription(c.description ?? ''); setPublished(c.published !== false); setOpen(true); }
    async function save(e: React.FormEvent) { e.preventDefault(); if (!name.trim())
        return; const data = { name: name.trim(), description: description.trim(), published }; if (editing)
        await fetch(`/api/categories/${encodeURIComponent(editing)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    else {
        await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }
    setOpen(false); await load(); }
    async function remove() { if (!deleteId)
        return; const used = courses.filter(c => c.categoryId === deleteId).length; if (used) {
        alert('لا يمكن حذف فئة مرتبطة بدورات أو برامج.');
        setDeleteId(null);
        return;
    }

    const response = await fetch(
        `/api/categories/${encodeURIComponent(deleteId)}`,
        { method: 'DELETE' },
    );
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
        alert(result?.error || 'تعذر حذف الفئة.');
        return;
    }

    setDeleteId(null);
    await load();
    }
    async function toggle(c: Category) { await fetch(`/api/categories/${encodeURIComponent(c.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ published: c.published === false }) }); await load(); }
    return <main className="admin-page"><header className="admin-page-header"><div><div className="eyebrow">Admin</div><h1>الفئات والتصنيفات</h1><p>الفئات المستخدمة في الدورات والبرامج التدريبية.</p></div><button className="admin-btn admin-btn-primary" onClick={add}>+ إضافة فئة</button></header><div className="admin-toolbar"><input className="admin-input" placeholder="بحث في الفئات..." value={search} onChange={e => setSearch(e.target.value)}/></div><div className="admin-table-card"><table className="admin-table"><thead><tr><th>الفئة</th><th>الوصف</th><th>الدورات والبرامج</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>{visible.map(c => { const count = courses.filter(x => x.categoryId === c.id).length; return <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.description || '—'}</td><td>{count}</td><td><span className={`admin-status ${c.published === false ? 'admin-status-draft' : 'admin-status-ok'}`}>{c.published === false ? 'مسودة' : 'منشورة'}</span></td><td><button className="admin-btn admin-btn-light" onClick={() => edit(c)}>تعديل</button>{' '}<button className="admin-btn admin-btn-light" onClick={() => void toggle(c)}>{c.published === false ? 'نشر' : 'إلغاء النشر'}</button>{' '}<button className="admin-btn admin-btn-danger" onClick={() => setDeleteId(c.id)}>حذف</button></td></tr>; })}</tbody></table>{visible.length === 0 && <div className="admin-empty"><strong>لا توجد فئات</strong><span>أضف أول فئة من زر الإضافة.</span></div>}</div>
 {open && <div className="admin-modal-backdrop"><form className="admin-modal" style={{ maxWidth: 620 }} onSubmit={save}><div className="admin-modal-header"><h2>{editing ? 'تعديل فئة' : 'إضافة فئة'}</h2><button type="button" className="admin-modal-close" onClick={() => setOpen(false)}>×</button></div><div className="admin-modal-body"><div className="admin-field"><label>اسم الفئة</label><input className="admin-input" required value={name} onChange={e => setName(e.target.value)}/></div><div className="admin-field" style={{ marginTop: 14 }}><label>الوصف</label><textarea className="admin-textarea" rows={4} value={description} onChange={e => setDescription(e.target.value)}/></div><label className="admin-checkbox" style={{ marginTop: 14 }}><input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}/> منشورة</label></div><div className="admin-modal-footer"><button type="button" className="admin-btn admin-btn-light" onClick={() => setOpen(false)}>إلغاء</button><button className="admin-btn admin-btn-primary">حفظ</button></div></form></div>}
 {deleteId && <div className="admin-modal-backdrop"><div className="admin-modal" style={{ maxWidth: 420 }}><div className="admin-modal-body"><h2>حذف الفئة؟</h2><p>سيتم حذفها إذا لم تكن مرتبطة بأي دورة أو برنامج.</p></div><div className="admin-modal-footer"><button className="admin-btn admin-btn-light" onClick={() => setDeleteId(null)}>إلغاء</button><button className="admin-btn admin-btn-danger" onClick={() => void remove()}>حذف</button></div></div></div>}
 </main>;
}

