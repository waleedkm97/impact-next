'use client';

import { useEffect, useState } from 'react';
import { courseRepository } from '@/lib/data/repositories/course-repository';
import { scheduleRepository } from '@/lib/data/repositories/schedule-repository';
import type { Schedule } from '@/types/schedule';
import type { Course } from '@/types/course';

interface OrderForm {
  type: 'public' | 'corporate';
  name: string;
  email: string;
  phone: string;
  company: string;
  responsibleName: string;
  responsibleEmail: string;
  responsiblePhone: string;
  courseId: string;
  scheduleId: string;
  corporateDate: string;
corporateDelivery: 'حضوري' | 'أونلاين';
corporateLocation: string;
  expectedTrainees: string;
  price: string;
  notes: string;
}

const initialForm: OrderForm = {
  type: 'public',
  name: '',
  email: '',
  phone: '',
  company: '',
  responsibleName: '',
  responsibleEmail: '',
  responsiblePhone: '',
  courseId: '',
  scheduleId: '',
  corporateDate: '',
corporateDelivery: 'حضوري',
corporateLocation: '',
  expectedTrainees: '',
  price: '',
  notes: '',
};

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [search, setSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [open, setOpen] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
const [form, setForm] = useState<OrderForm>(initialForm);

  async function load() {
    const [orderResponse, courseList, scheduleList] = await Promise.all([
      fetch('/api/orders', { cache: 'no-store' }),
      courseRepository.findAll(),
      scheduleRepository.findAll({
        filter: { published: true },
        sort: 'startDate',
        order: 'asc',
      }),
    ]);

    if (!orderResponse.ok) {
      throw new Error('تعذر تحميل الطلبات.');
    }

    const orderData = await orderResponse.json();
    const orderList = orderData.orders ?? [];
    setOrders(orderList);
    setCourses(courseList);
    setSchedules(scheduleList);
  }

  useEffect(() => {
    void load();

    const handleFocus = () => {
      void load();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  async function approve(id: string) {
    const response = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'confirmed',
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      alert(data?.error || 'تعذر اعتماد الطلب.');
      return;
    }

    await load();
  }

  async function cancel(id: string) {
    const response = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'cancelled' }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      alert(data?.error || 'تعذر إلغاء الطلب.');
      return;
    }

    await load();
  }

  async function remove(id: string) {
    if (!confirm('هل تريد حذف الطلب نهائيًا؟')) {
      return;
    }

    const response = await fetch(`/api/orders/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      alert(data?.error || 'تعذر حذف الطلب.');
      return;
    }

    await load();
  }
function startEdit(order: any) {
  const item = order.items?.[0];

  setEditingId(order.id);
  setCourseSearch(item?.title || '');

  setForm({
    type: order.type === 'corporate' ? 'corporate' : 'public',
    name: order.customer?.name || '',
    email: order.customer?.email || '',
    phone: order.customer?.phone || '',
    company: order.customer?.company || '',
    responsibleName: order.customer?.responsibleName || '',
    responsibleEmail: order.customer?.responsibleEmail || '',
    responsiblePhone: order.customer?.responsiblePhone || '',
    courseId: item?.itemId || '',
    scheduleId: order.scheduleId || '',
    corporateDate: order.metadata?.corporateDate || '',
    corporateDelivery: order.metadata?.corporateDelivery || 'حضوري',
    corporateLocation: order.metadata?.corporateLocation || '',
    expectedTrainees: order.expectedTrainees ? String(order.expectedTrainees) : '',
    price: String(order.total || item?.unitPrice || ''),
    notes: order.notes || '',
  });

  setOpen(true);
}

async function updateOrder(event: React.FormEvent) {
  event.preventDefault();

  if (!editingId) {
    return;
  }

  const order = orders.find((item) => item.id === editingId);

  if (!order) {
    alert('لم يتم العثور على الطلب.');
    return;
  }

  const course = courses.find((item) => item.id === form.courseId);

  if (!course) {
    alert('اختر الدورة.');
    return;
  }

  const amount = Number(form.price || course.price || 0);

  const response = await fetch(`/api/orders/${editingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'details',
      type: form.type,
      customer: {
        name: form.type === 'corporate' ? form.responsibleName : form.name,
        email: form.type === 'corporate' ? form.responsibleEmail : form.email,
        phone: form.type === 'corporate' ? form.responsiblePhone : form.phone,
        company: form.company.trim() || null,
        responsibleName:
          form.type === 'corporate' ? form.responsibleName.trim() || null : null,
        responsibleEmail:
          form.type === 'corporate' ? form.responsibleEmail.trim() || null : null,
        responsiblePhone:
          form.type === 'corporate' ? form.responsiblePhone.trim() || null : null,
      },
      items: [{
        id: order.items?.[0]?.id || `item-${Date.now()}`,
        type: course.type === 'training' ? 'training-program' : 'course',
        itemId: course.id,
        title: course.title,
        quantity: 1,
        unitPrice: amount,
        totalPrice: amount,
      }],
      subtotal: amount,
      total: amount,
      scheduleId: form.type === 'public' ? form.scheduleId || null : null,
      notes: form.notes.trim() || null,
      metadata: {
        corporateDate: form.type === 'corporate' ? form.corporateDate || null : null,
        corporateDelivery: form.type === 'corporate' ? form.corporateDelivery : null,
        corporateLocation: form.type === 'corporate' ? form.corporateLocation.trim() || null : null,
      },
      expectedTrainees: form.expectedTrainees
        ? Number(form.expectedTrainees)
        : null,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    alert(data?.error || 'تعذر تحديث الطلب.');
    return;
  }

  if (form.type === 'corporate' && order.customer?.groupId) {
    const groupsResponse = await fetch('/api/groups', {
      cache: 'no-store',
    });
    const groups = groupsResponse.ok
      ? await groupsResponse.json()
      : [];
    const existingGroup = Array.isArray(groups)
      ? groups.find((group: any) => group.id === order.customer.groupId)
      : null;

    if (existingGroup) {
      await fetch(
        `/api/groups/${encodeURIComponent(order.customer.groupId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
        name: form.company.trim() || `مجموعة ${course.title}`,
        courseId: course.id,
        courseTitle: course.title,
        corporateDate: form.corporateDate || undefined,
        corporateDelivery: form.corporateDelivery,
        corporateLocation: form.corporateLocation.trim() || undefined,
        companyName: form.company.trim() || undefined,
        responsibleName: form.responsibleName.trim() || undefined,
        responsibleEmail: form.responsibleEmail.trim() || undefined,
        responsiblePhone: form.responsiblePhone.trim() || undefined,
        notes: form.notes.trim() || undefined,
          }),
        },
      );
    }
  }

  setOpen(false);
  setEditingId(null);
  setCourseSearch('');
  setForm(initialForm);

  await load();
}
  function updateForm<K extends keyof OrderForm>(key: K, value: OrderForm[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();

    const course = courses.find((item) => item.id === form.courseId);

    if (!course) {
      alert('اختر الدورة.');
      return;
    }

    const amount = Number(form.price || course.price || 0);
    let groupId: string | undefined;

    if (form.type === 'corporate') {
      groupId = `group-${crypto.randomUUID()}`;
      const groupResponse = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: groupId,
          name: form.company.trim() || `مجموعة ${course.title}`,
          type: 'corporate',
          status: 'active',
          courseId: course.id,
          courseTitle: course.title,
          corporateDate: form.corporateDate || null,
          corporateDelivery: form.corporateDelivery,
          corporateLocation: form.corporateLocation.trim() || null,
          expectedTrainees: form.expectedTrainees
            ? Number(form.expectedTrainees)
            : null,
          companyName: form.company.trim() || null,
          responsibleName: form.responsibleName.trim() || null,
          responsibleEmail: form.responsibleEmail.trim() || null,
          responsiblePhone: form.responsiblePhone.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });

      if (!groupResponse.ok) {
        const data = await groupResponse.json().catch(() => null);
        throw new Error(data?.error || 'تعذر حفظ المجموعة في قاعدة البيانات.');
      }
    }

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        traineeId: null,
        type: form.type,
        customer: {
          name: form.type === 'corporate' ? form.responsibleName : form.name,
          email: form.type === 'corporate' ? form.responsibleEmail : form.email,
          phone: form.type === 'corporate' ? form.responsiblePhone : form.phone,
          company: form.company || undefined,
          responsibleName: form.type === 'corporate' ? form.responsibleName : undefined,
          responsibleEmail: form.type === 'corporate' ? form.responsibleEmail : undefined,
          responsiblePhone: form.type === 'corporate' ? form.responsiblePhone : undefined,
        },
        groupId,
        items: [
          {
            id: `item-${Date.now()}`,
            type: course.type === 'training' ? 'training-program' : 'course',
            itemId: course.id,
            title: course.title,
            quantity: 1,
            unitPrice: amount,
            totalPrice: amount,
          },
        ],
        subtotal: amount,
        discount: 0,
        tax: 0,
        total: amount,
        currency: 'SAR',
        payment: {
          method: 'bank-transfer',
          status: 'pending',
          amount,
          currency: 'SAR',
        },
        status: 'pending',
        scheduleId: form.scheduleId || undefined,
        notes:
          form.notes.trim() ||
          (form.type === 'corporate'
            ? 'طلب شركة مضاف يدويًا من لوحة التحكم.'
            : 'تمت إضافة الطلب يدويًا من لوحة التحكم.'),
        expectedTrainees: form.expectedTrainees
          ? Number(form.expectedTrainees)
          : null,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || 'تعذر حفظ الطلب.');
    }

    setOpen(false);
    setForm(initialForm);
    setCourseSearch('');
    await load();
  }

  const visible = orders.filter((order) => {
    if (!search.trim()) {
      return true;
    }

    const text = [
      order.orderNumber,
      order.customer?.name,
      order.customer?.email,
      order.customer?.company,
      order.customer?.responsibleName,
      order.items?.[0]?.title,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return text.includes(search.trim().toLowerCase());
  });

  return (
    <main className="admin-page" dir="rtl">
      <header className="admin-page-header">
        <div>
          <div className="eyebrow">Admin</div>
          <h1>الطلبات</h1>
          <p>متابعة طلبات الأفراد والشركات وحالات الدفع والتنفيذ.</p>
        </div>

        <div className="admin-actions">
          <button className="admin-btn admin-btn-primary" onClick={() => setOpen(true)}>
            + إضافة طلب
          </button>
          <button className="admin-btn admin-btn-light" onClick={() => void load()}>
            تحديث
          </button>
          <button className="admin-btn admin-btn-light" onClick={() => window.print()}>
            طباعة
          </button>
        </div>
      </header>

      <div className="admin-toolbar">
        <input
          className="admin-input"
          placeholder="البحث في الطلبات..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>النوع</th>
              <th>العميل / المسؤول</th>
              <th>الشركة</th>
              <th>الدورة</th>
              <th>السعر المباع</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((order) => (
              <tr key={order.id}>
                <td>{order.orderNumber}</td>
                <td>{order.type === 'corporate' ? 'شركة' : 'Public'}</td>
                <td>
                  <strong>
                    {order.customer?.responsibleName || order.customer?.name || '—'}
                  </strong>
                  <br />
                  <small>{order.customer?.responsibleEmail || order.customer?.email}</small>
                </td>
                <td>{order.customer?.company || '—'}</td>
                <td>{order.items?.[0]?.title || '—'}</td>
                <td>
                  <strong>
                    {Number(order.total || 0).toLocaleString('ar-SA')} ر.س
                  </strong>
                </td>
                <td>{order.status}</td>
                <td>
  <button
    type="button"
    className="admin-btn admin-btn-light"
    onClick={() => startEdit(order)}
  >
    تعديل
  </button>{' '}

  <button
    type="button"
    className="admin-btn admin-btn-light"
    onClick={() => void approve(order.id)}
  >
    اعتماد
  </button>{' '}

  <button
    type="button"
    className="admin-btn admin-btn-danger"
    onClick={() => void cancel(order.id)}
  >
    إلغاء
  </button>{' '}

  <button
    type="button"
    className="admin-btn admin-btn-danger"
    onClick={() => void remove(order.id)}
  >
    حذف
  </button>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="admin-modal-backdrop">
          <form
  className="admin-modal"
  style={{ maxWidth: 760 }}
  onSubmit={editingId ? updateOrder : add}
>
            <div className="admin-modal-header">
              <h2>{editingId ? 'تعديل الطلب' : 'إضافة طلب'}</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-field">
                <label>نوع الطلب</label>
                <select
                  className="admin-select"
                  value={form.type}
                  onChange={(event) =>
                    updateForm('type', event.target.value as OrderForm['type'])
                  }
                >
                  <option value="public">متدرب Public</option>
                  <option value="corporate">شركة / مجموعة</option>
                </select>
              </div>

              {form.type === 'corporate' ? (
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>اسم الشركة</label>
                    <input
                      className="admin-input"
                      required
                      value={form.company}
                      onChange={(event) => updateForm('company', event.target.value)}
                    />
                  </div>
                  <div className="admin-field">
                    <label>اسم المسؤول</label>
                    <input
                      className="admin-input"
                      required
                      value={form.responsibleName}
                      onChange={(event) =>
                        updateForm('responsibleName', event.target.value)
                      }
                    />
                  </div>
                  <div className="admin-field">
                    <label>بريد المسؤول</label>
                    <input
                      className="admin-input"
                      type="email"
                      required
                      value={form.responsibleEmail}
                      onChange={(event) =>
                        updateForm('responsibleEmail', event.target.value)
                      }
                    />
                  </div>
                  <div className="admin-field">
                    <label>جوال المسؤول</label>
                    <input
                      className="admin-input"
                      value={form.responsiblePhone}
                      onChange={(event) =>
                        updateForm('responsiblePhone', event.target.value)
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>اسم المتدرب</label>
                    <input
                      className="admin-input"
                      required
                      value={form.name}
                      onChange={(event) => updateForm('name', event.target.value)}
                    />
                  </div>
                  <div className="admin-field">
                    <label>البريد الإلكتروني</label>
                    <input
                      className="admin-input"
                      type="email"
                      required
                      value={form.email}
                      onChange={(event) => updateForm('email', event.target.value)}
                    />
                  </div>
                  <div className="admin-field">
                    <label>رقم الجوال</label>
                    <input
                      className="admin-input"
                      value={form.phone}
                      onChange={(event) => updateForm('phone', event.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>الدورة</label>
                  <input
                    className="admin-input"
                    required
                    list="order-course-options"
                    placeholder="ابحث باسم الدورة..."
                    value={courseSearch}
                    onChange={(event) => {
                      const value = event.target.value;
                      const course = courses.find((item) => item.title === value);
                      setCourseSearch(value);
                      setForm((current) => ({
                        ...current,
                        courseId: course?.id ?? '',
                        scheduleId: '',
                        price: course ? String(course.price ?? '') : current.price,
                      }));
                    }}
                  />
                  <datalist id="order-course-options">
                    {courses
                      .filter((course) =>
                        course.title.toLowerCase().includes(courseSearch.trim().toLowerCase()),
                      )
                      .slice(0, 50)
                      .map((course) => (
                        <option key={course.id} value={course.title} />
                      ))}
                  </datalist>
                </div>

               {form.type === 'corporate' ? (
  <>
    <div className="admin-field">
      <label>تاريخ الدورة</label>
      <input
        className="admin-input"
        type="date"
        required
        value={form.corporateDate}
        onChange={(event) =>
          updateForm('corporateDate', event.target.value)
        }
      />
    </div>

    <div className="admin-field">
      <label>طريقة التنفيذ</label>
      <select
        className="admin-select"
        value={form.corporateDelivery}
        onChange={(event) =>
          updateForm(
            'corporateDelivery',
            event.target.value as OrderForm['corporateDelivery'],
          )
        }
      >
        <option value="حضوري">حضوري</option>
        <option value="أونلاين">أونلاين</option>
      </select>
    </div>

    <div className="admin-field">
      <label>المدينة / مكان التنفيذ</label>
      <input
        className="admin-input"
        placeholder="مثال: الرياض أو مقر الشركة"
        disabled={form.corporateDelivery === 'أونلاين'}
        value={form.corporateLocation}
        onChange={(event) =>
          updateForm('corporateLocation', event.target.value)
        }
      />
    </div>
  </>
) : (
  <div className="admin-field">
    <label>الموعد</label>
    <select
      className="admin-select"
      value={form.scheduleId}
      onChange={(event) =>
        updateForm('scheduleId', event.target.value)
      }
    >
      <option value="">بدون موعد محدد</option>

      {schedules
        .filter((schedule) => schedule.courseId === form.courseId)
        .map((schedule) => (
          <option key={schedule.id} value={schedule.id}>
            {schedule.startDate.toLocaleDateString('ar-SA')} —{' '}
            {schedule.city || 'أونلاين'}
          </option>
        ))}
    </select>
  </div>
)}

                <div className="admin-field">
                  <label>السعر المباع فعليًا</label>
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    required
                    value={form.price}
                    onChange={(event) => updateForm('price', event.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <label>عدد المتدربين المتوقع (اختياري)</label>
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    value={form.expectedTrainees}
                    onChange={(event) => updateForm('expectedTrainees', event.target.value)}
                  />
                </div>
              </div>

              <div className="admin-field">
                <label>ملاحظات</label>
                <textarea
                  className="admin-input"
                  rows={4}
                  value={form.notes}
                  onChange={(event) => updateForm('notes', event.target.value)}
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-light"
                onClick={() => setOpen(false)}
              >
                إلغاء
              </button>
              <button className="admin-btn admin-btn-primary">
  {editingId ? 'حفظ التعديلات' : 'حفظ الطلب'}
</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
