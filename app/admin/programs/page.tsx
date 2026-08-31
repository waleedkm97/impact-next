'use client';

import { useMemo, useState } from 'react';

type DeliveryType = 'in-person' | 'online';

type TrainingProgram = {
  id: string;
  title: string;
  category: string;
  trainer: string;
  delivery: DeliveryType;
  durationDays: number;
  trainingHours: number;
  price: number;
  oldPrice?: number;
  description: string;
  objectives: string[];
  audience: string;
  materials: boolean;
  preAssessment: boolean;
  postAssessment: boolean;
  courseEvaluation: boolean;
  attendance: boolean;
  location?: string;
  zoomLink?: string;
  published: boolean;
  featured: boolean;
  createdAt: string;
};

type ProgramForm = {
  title: string;
  category: string;
  trainer: string;
  delivery: DeliveryType;
  durationDays: string;
  trainingHours: string;
  price: string;
  oldPrice: string;
  description: string;
  objectives: string;
  audience: string;
  materials: boolean;
  preAssessment: boolean;
  postAssessment: boolean;
  courseEvaluation: boolean;
  attendance: boolean;
  location: string;
  zoomLink: string;
  published: boolean;
  featured: boolean;
};

const emptyForm: ProgramForm = {
  title: '',
  category: '',
  trainer: '',
  delivery: 'in-person',
  durationDays: '',
  trainingHours: '',
  price: '',
  oldPrice: '',
  description: '',
  objectives: '',
  audience: '',
  materials: true,
  preAssessment: true,
  postAssessment: true,
  courseEvaluation: true,
  attendance: true,
  location: '',
  zoomLink: '',
  published: true,
  featured: false,
};

const initialPrograms: TrainingProgram[] = [];

function createId() {
  return `program-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('ar-SA').format(value);
}

export default function TrainingProgramsPage() {
  const [programs, setPrograms] =
    useState<TrainingProgram[]>(initialPrograms);

  const [search, setSearch] = useState('');

  const [deliveryFilter, setDeliveryFilter] =
    useState<'all' | DeliveryType>('all');

  const [statusFilter, setStatusFilter] =
    useState<'all' | 'published' | 'draft'>('all');

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingProgramId, setEditingProgramId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<ProgramForm>(emptyForm);

  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false);

  const [programToDelete, setProgramToDelete] =
    useState<TrainingProgram | null>(null);

  const filteredPrograms = useMemo(() => {
    const query = search.trim().toLowerCase();

    return programs.filter((program) => {
      const matchesSearch =
        !query ||
        program.title.toLowerCase().includes(query) ||
        program.category.toLowerCase().includes(query) ||
        program.trainer.toLowerCase().includes(query);

      const matchesDelivery =
        deliveryFilter === 'all' ||
        program.delivery === deliveryFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' &&
          program.published) ||
        (statusFilter === 'draft' &&
          !program.published);

      return (
        matchesSearch &&
        matchesDelivery &&
        matchesStatus
      );
    });
  }, [
    programs,
    search,
    deliveryFilter,
    statusFilter,
  ]);

  const publishedCount = programs.filter(
    (program) => program.published
  ).length;

  const draftCount = programs.filter(
    (program) => !program.published
  ).length;

  const inPersonCount = programs.filter(
    (program) => program.delivery === 'in-person'
  ).length;

  const onlineCount = programs.filter(
    (program) => program.delivery === 'online'
  ).length;

  function openAddModal() {
    setEditingProgramId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(
    program: TrainingProgram
  ) {
    setEditingProgramId(program.id);

    setForm({
      title: program.title,
      category: program.category,
      trainer: program.trainer,
      delivery: program.delivery,
      durationDays: String(program.durationDays),
      trainingHours: String(program.trainingHours),
      price: String(program.price),
      oldPrice: program.oldPrice
        ? String(program.oldPrice)
        : '',
      description: program.description,
      objectives: program.objectives.join('\n'),
      audience: program.audience,
      materials: program.materials,
      preAssessment: program.preAssessment,
      postAssessment: program.postAssessment,
      courseEvaluation:
        program.courseEvaluation,
      attendance: program.attendance,
      location: program.location || '',
      zoomLink: program.zoomLink || '',
      published: program.published,
      featured: program.featured,
    });

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProgramId(null);
    setForm(emptyForm);
  }

  function updateField<K extends keyof ProgramForm>(
    field: K,
    value: ProgramForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleDeliveryChange(
    delivery: DeliveryType
  ) {
    setForm((current) => ({
      ...current,
      delivery,
      location:
        delivery === 'online'
          ? ''
          : current.location,
      zoomLink:
        delivery === 'in-person'
          ? ''
          : current.zoomLink,
    }));
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.title.trim()) {
      alert(
        'يرجى إدخال اسم البرنامج التدريبي.'
      );
      return;
    }

    if (!form.category.trim()) {
      alert('يرجى إدخال التصنيف.');
      return;
    }

    const durationDays =
      Number(form.durationDays) || 0;

    const trainingHours =
      Number(form.trainingHours) || 0;

    const price =
      Number(form.price) || 0;

    const oldPrice =
      Number(form.oldPrice) || undefined;

    const program: TrainingProgram = {
      id:
        editingProgramId ||
        createId(),

      title:
        form.title.trim(),

      category:
        form.category.trim(),

      trainer:
        form.trainer.trim(),

      delivery:
        form.delivery,

      durationDays,

      trainingHours,

      price,

      oldPrice,

      description:
        form.description.trim(),

      objectives:
        form.objectives
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),

      audience:
        form.audience.trim(),

      materials:
        form.materials,

      preAssessment:
        form.preAssessment,

      postAssessment:
        form.postAssessment,

      courseEvaluation:
        form.courseEvaluation,

      attendance:
        form.attendance,

      location:
        form.delivery === 'in-person'
          ? form.location.trim()
          : undefined,

      zoomLink:
        form.delivery === 'online'
          ? form.zoomLink.trim()
          : undefined,

      published:
        form.published,

      featured:
        form.featured,

      createdAt:
        editingProgramId
          ? programs.find(
              (item) =>
                item.id === editingProgramId
            )?.createdAt ||
            new Date().toISOString()
          : new Date().toISOString(),
    };

    if (editingProgramId) {
      setPrograms((current) =>
        current.map((item) =>
          item.id === editingProgramId
            ? program
            : item
        )
      );
    } else {
      setPrograms((current) => [
        program,
        ...current,
      ]);
    }

    closeModal();
  }

  function askDelete(
    program: TrainingProgram
  ) {
    setProgramToDelete(program);
    setDeleteModalOpen(true);
  }

  function confirmDelete() {
    if (!programToDelete) {
      return;
    }

    setPrograms((current) =>
      current.filter(
        (program) =>
          program.id !==
          programToDelete.id
      )
    );

    setProgramToDelete(null);
    setDeleteModalOpen(false);
  }

  function togglePublished(
    program: TrainingProgram
  ) {
    setPrograms((current) =>
      current.map((item) =>
        item.id === program.id
          ? {
              ...item,
              published:
                !item.published,
            }
          : item
      )
    );
  }

  function handleSchedule(
    program: TrainingProgram
  ) {
    alert(
      `سيتم فتح جدولة البرنامج:\n${program.title}\n\nهذه الوظيفة سنربطها لاحقًا بصفحة الجداول.`
    );
  }

  return (
    <main
      className="training-programs-page"
      dir="rtl"
    >
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>
            إدارة البرامج التدريبية
          </h1>

          <p>
            إدارة البرامج التدريبية الحضورية
            والأونلاين وجدولتها للمتدربين.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openAddModal}
        >
          <span>＋</span>
          إضافة برنامج تدريبي
        </button>
      </div>

      {/* Statistics */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            إجمالي البرامج
          </div>

          <div className="stat-number">
            {programs.length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            برامج حضورية
          </div>

          <div className="stat-number">
            {inPersonCount}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            برامج أونلاين
          </div>

          <div className="stat-number">
            {onlineCount}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            البرامج المنشورة
          </div>

          <div className="stat-number">
            {publishedCount}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="filters-card">
        <div className="search-wrapper">
          <span className="search-icon">
            ⌕
          </span>

          <input
            type="text"
            placeholder="البحث في البرامج التدريبية..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <select
          value={deliveryFilter}
          onChange={(event) =>
            setDeliveryFilter(
              event.target.value as
                | 'all'
                | DeliveryType
            )
          }
        >
          <option value="all">
            كل طرق التدريب
          </option>

          <option value="in-person">
            حضوري
          </option>

          <option value="online">
            أونلاين
          </option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as
                | 'all'
                | 'published'
                | 'draft'
            )
          }
        >
          <option value="all">
            كل الحالات
          </option>

          <option value="published">
            منشور
          </option>

          <option value="draft">
            مسودة
          </option>
        </select>
      </section>

      {/* Programs Table */}
      <section className="programs-card">
        {filteredPrograms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              🎓
            </div>

            <h2>
              {programs.length === 0
                ? 'لا توجد برامج تدريبية'
                : 'لا توجد نتائج مطابقة'}
            </h2>

            <p>
              {programs.length === 0
                ? 'ابدأ بإضافة أول برنامج تدريبي.'
                : 'جرّب تغيير كلمة البحث أو الفلاتر.'}
            </p>

            {programs.length === 0 && (
              <button
                className="secondary-button"
                onClick={openAddModal}
              >
                ＋ إضافة أول برنامج
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>
                    البرنامج
                  </th>

                  <th>
                    التصنيف
                  </th>

                  <th>
                    المدرب
                  </th>

                  <th>
                    طريقة التدريب
                  </th>

                  <th>
                    المدة
                  </th>

                  <th>
                    السعر
                  </th>

                  <th>
                    الحالة
                  </th>

                  <th>
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPrograms.map(
                  (program) => (
                    <tr
                      key={program.id}
                    >
                      <td>
                        <div className="program-cell">
                          <div className="program-icon">
                            🎓
                          </div>

                          <div className="program-info">
                            <strong>
                              {program.title}
                            </strong>

                            {program.featured && (
                              <small>
                                ★ برنامج مميز
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        {program.category}
                      </td>

                      <td>
                        {program.trainer ||
                          '—'}
                      </td>

                      <td>
                        <span
                          className={`delivery-badge ${
                            program.delivery ===
                            'in-person'
                              ? 'in-person'
                              : 'online'
                          }`}
                        >
                          {program.delivery ===
                          'in-person'
                            ? 'حضوري'
                            : 'أونلاين'}
                        </span>
                      </td>

                      <td>
                        <div className="duration-cell">
                          <strong>
                            {
                              program.durationDays
                            }
                          </strong>

                          <span>
                            يوم
                          </span>

                          <small>
                            {
                              program.trainingHours
                            }{' '}
                            ساعة
                          </small>
                        </div>
                      </td>

                      <td>
                        <div className="price-cell">
                          <strong>
                            {formatPrice(
                              program.price
                            )}{' '}
                            ر.س
                          </strong>

                          {program.oldPrice && (
                            <del>
                              {formatPrice(
                                program.oldPrice
                              )}{' '}
                              ر.س
                            </del>
                          )}
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`status-badge ${
                            program.published
                              ? 'published'
                              : 'draft'
                          }`}
                          onClick={() =>
                            togglePublished(
                              program
                            )
                          }
                        >
                          {program.published
                            ? 'منشور'
                            : 'مسودة'}
                        </button>
                      </td>

                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            className="action-button schedule"
                            onClick={() =>
                              handleSchedule(
                                program
                              )
                            }
                          >
                            جدولة
                          </button>

                          <button
                            type="button"
                            className="action-button"
                            onClick={() =>
                              openEditModal(
                                program
                              )
                            }
                          >
                            تعديل
                          </button>

                          <button
                            type="button"
                            className="action-button danger"
                            onClick={() =>
                              askDelete(
                                program
                              )
                            }
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingProgramId
                    ? 'تعديل البرنامج التدريبي'
                    : 'إضافة برنامج تدريبي'}
                </h2>

                <p>
                  البرنامج التدريبي يدعم
                  التدريب الحضوري والأونلاين.
                </p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
            >
              {/* Basic Information */}
              <div className="form-section">
                <h3>
                  المعلومات الأساسية
                </h3>

                <div className="form-grid">
                  <div className="field field-full">
                    <label>
                      اسم البرنامج *
                    </label>

                    <input
                      type="text"
                      value={form.title}
                      onChange={(event) =>
                        updateField(
                          'title',
                          event.target.value
                        )
                      }
                      placeholder="مثال: برنامج القيادة والإدارة"
                      required
                    />
                  </div>

                  <div className="field">
                    <label>
                      التصنيف *
                    </label>

                    <input
                      type="text"
                      value={form.category}
                      onChange={(event) =>
                        updateField(
                          'category',
                          event.target.value
                        )
                      }
                      placeholder="مثال: القيادة والإدارة"
                      required
                    />
                  </div>

                  <div className="field">
                    <label>
                      المدرب
                    </label>

                    <input
                      type="text"
                      value={form.trainer}
                      onChange={(event) =>
                        updateField(
                          'trainer',
                          event.target.value
                        )
                      }
                      placeholder="اسم المدرب"
                    />
                  </div>

                  <div className="field">
                    <label>
                      عدد الأيام
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        form.durationDays
                      }
                      onChange={(event) =>
                        updateField(
                          'durationDays',
                          event.target.value
                        )
                      }
                      placeholder="مثال: 3"
                    />
                  </div>

                  <div className="field">
                    <label>
                      عدد الساعات
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        form.trainingHours
                      }
                      onChange={(event) =>
                        updateField(
                          'trainingHours',
                          event.target.value
                        )
                      }
                      placeholder="مثال: 15"
                    />
                  </div>

                  <div className="field">
                    <label>
                      السعر
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(event) =>
                        updateField(
                          'price',
                          event.target.value
                        )
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="field">
                    <label>
                      السعر السابق
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.oldPrice
                      }
                      onChange={(event) =>
                        updateField(
                          'oldPrice',
                          event.target.value
                        )
                      }
                      placeholder="اختياري"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="form-section">
                <h3>
                  طريقة التدريب
                </h3>

                <div className="delivery-options">
                  <button
                    type="button"
                    className={`delivery-option ${
                      form.delivery ===
                      'in-person'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      handleDeliveryChange(
                        'in-person'
                      )
                    }
                  >
                    <span className="delivery-option-icon">
                      🏢
                    </span>

                    <span>
                      <strong>
                        حضوري
                      </strong>

                      <small>
                        حضور المتدربين في
                        موقع التدريب.
                      </small>
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`delivery-option ${
                      form.delivery ===
                      'online'
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      handleDeliveryChange(
                        'online'
                      )
                    }
                  >
                    <span className="delivery-option-icon">
                      💻
                    </span>

                    <span>
                      <strong>
                        أونلاين
                      </strong>

                      <small>
                        حضور المتدربين عن
                        طريق Zoom.
                      </small>
                    </span>
                  </button>
                </div>

                {form.delivery ===
                  'in-person' && (
                  <div className="conditional-box">
                    <div className="field">
                      <label>
                        موقع التدريب
                      </label>

                      <input
                        type="text"
                        value={
                          form.location
                        }
                        onChange={(event) =>
                          updateField(
                            'location',
                            event.target.value
                          )
                        }
                        placeholder="مثال: الرياض - فندق..."
                      />
                    </div>
                  </div>
                )}

                {form.delivery ===
                  'online' && (
                  <div className="conditional-box">
                    <div className="field">
                      <label>
                        رابط Zoom
                      </label>

                      <input
                        type="url"
                        value={
                          form.zoomLink
                        }
                        onChange={(event) =>
                          updateField(
                            'zoomLink',
                            event.target.value
                          )
                        }
                        placeholder="https://zoom.us/..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="form-section">
                <h3>
                  وصف البرنامج
                </h3>

                <div className="form-grid">
                  <div className="field field-full">
                    <label>
                      الوصف
                    </label>

                    <textarea
                      rows={5}
                      value={
                        form.description
                      }
                      onChange={(event) =>
                        updateField(
                          'description',
                          event.target.value
                        )
                      }
                      placeholder="اكتب وصف البرنامج التدريبي..."
                    />
                  </div>

                  <div className="field field-full">
                    <label>
                      الأهداف
                    </label>

                    <textarea
                      rows={5}
                      value={
                        form.objectives
                      }
                      onChange={(event) =>
                        updateField(
                          'objectives',
                          event.target.value
                        )
                      }
                      placeholder={
                        'اكتب كل هدف في سطر مستقل\nفهم المفاهيم الأساسية\nتطوير المهارات العملية\nتحسين الأداء'
                      }
                    />

                    <small>
                      كل هدف في سطر مستقل.
                    </small>
                  </div>

                  <div className="field field-full">
                    <label>
                      الفئة المستهدفة
                    </label>

                    <input
                      type="text"
                      value={
                        form.audience
                      }
                      onChange={(event) =>
                        updateField(
                          'audience',
                          event.target.value
                        )
                      }
                      placeholder="مثال: المدراء والموظفون"
                    />
                  </div>
                </div>
              </div>

              {/* Program Components */}
              <div className="form-section">
                <h3>
                  مكونات البرنامج
                </h3>

                <div className="options-grid">
                  <label className="option-card">
                    <input
                      type="checkbox"
                      checked={
                        form.preAssessment
                      }
                      onChange={(event) =>
                        updateField(
                          'preAssessment',
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        التقييم القبلي
                      </strong>

                      <small>
                        يظهر قبل بدء البرنامج.
                      </small>
                    </span>
                  </label>

                  <label className="option-card">
                    <input
                      type="checkbox"
                      checked={
                        form.postAssessment
                      }
                      onChange={(event) =>
                        updateField(
                          'postAssessment',
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        التقييم البعدي
                      </strong>

                      <small>
                        يظهر بعد إكمال البرنامج.
                      </small>
                    </span>
                  </label>

                  <label className="option-card">
                    <input
                      type="checkbox"
                      checked={
                        form.courseEvaluation
                      }
                      onChange={(event) =>
                        updateField(
                          'courseEvaluation',
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        تقييم الدورة
                      </strong>

                      <small>
                        تقييم تجربة المتدرب.
                      </small>
                    </span>
                  </label>

                  <label className="option-card">
                    <input
                      type="checkbox"
                      checked={
                        form.materials
                      }
                      onChange={(event) =>
                        updateField(
                          'materials',
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        المادة التدريبية
                      </strong>

                      <small>
                        إتاحة المادة للمتدرب.
                      </small>
                    </span>
                  </label>

                  <label className="option-card">
                    <input
                      type="checkbox"
                      checked={
                        form.attendance
                      }
                      onChange={(event) =>
                        updateField(
                          'attendance',
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        الحضور والغياب
                      </strong>

                      <small>
                        تسجيل حضور المتدربين
                        للجلسات.
                      </small>
                    </span>
                  </label>
                </div>
              </div>

              {/* Publishing */}
              <div className="form-section">
                <h3>
                  إعدادات النشر
                </h3>

                <div className="options-grid two">
                  <label className="option-card">
                    <input
                      type="checkbox"
                      checked={
                        form.published
                      }
                      onChange={(event) =>
                        updateField(
                          'published',
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        نشر البرنامج
                      </strong>

                      <small>
                        إظهار البرنامج للزوار.
                      </small>
                    </span>
                  </label>

                  <label className="option-card">
                    <input
                      type="checkbox"
                      checked={
                        form.featured
                      }
                      onChange={(event) =>
                        updateField(
                          'featured',
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        برنامج مميز
                      </strong>

                      <small>
                        إظهار البرنامج ضمن
                        البرامج المميزة.
                      </small>
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingProgramId
                    ? 'حفظ التعديلات'
                    : 'إضافة البرنامج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen &&
        programToDelete && (
          <div className="modal-overlay">
            <div className="delete-modal">
              <div className="delete-icon">
                !
              </div>

              <h2>
                حذف البرنامج؟
              </h2>

              <p>
                هل أنت متأكد من حذف:
                <strong>
                  {' '}
                  {programToDelete.title}
                </strong>
                ؟
              </p>

              <div className="delete-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setDeleteModalOpen(
                      false
                    );
                    setProgramToDelete(
                      null
                    );
                  }}
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  className="delete-confirm-button"
                  onClick={
                    confirmDelete
                  }
                >
                  نعم، حذف
                </button>
              </div>
            </div>
          </div>
        )}

      <style jsx>{`
        .training-programs-page {
          min-height: 100%;
          padding: 34px;
          background: #f7f8fa;
          color: #172033;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .page-header h1 {
          margin: 0 0 8px;
          font-size: 30px;
          font-weight: 800;
          color: #142033;
        }

        .page-header p {
          margin: 0;
          color: #7a8799;
          font-size: 14px;
        }

        .primary-button,
        .secondary-button,
        .cancel-button,
        .delete-confirm-button,
        .action-button,
        .delivery-option {
          border: 0;
          cursor: pointer;
          font-family: inherit;
          transition: 0.2s ease;
        }

        .primary-button {
          min-height: 46px;
          padding: 0 20px;
          border-radius: 10px;
          background: #182238;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          white-space: nowrap;
        }

        .primary-button:hover {
          background: #10182a;
          transform: translateY(-1px);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: #fff;
          border: 1px solid #e4e8ee;
          border-radius: 14px;
          padding: 22px 24px;
          min-height: 104px;
        }

        .stat-label {
          color: #78869a;
          font-size: 14px;
          margin-bottom: 15px;
        }

        .stat-number {
          font-size: 27px;
          font-weight: 800;
          color: #111827;
        }

        .filters-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          border: 1px solid #e4e8ee;
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 20px;
        }

        .search-wrapper {
          position: relative;
          flex: 1;
        }

        .search-wrapper input {
          width: 100%;
          height: 46px;
          box-sizing: border-box;
          border: 1px solid #dfe4eb;
          border-radius: 9px;
          outline: none;
          padding: 0 44px 0 14px;
          font-family: inherit;
          color: #182238;
          background: #fff;
        }

        .search-wrapper input:focus,
        .filters-card select:focus,
        .field input:focus,
        .field textarea:focus {
          border-color: #182238;
          box-shadow: 0 0 0 3px
            rgba(24, 34, 56, 0.06);
        }

        .search-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #8b96a7;
          font-size: 21px;
          z-index: 1;
        }

        .filters-card select {
          height: 46px;
          min-width: 155px;
          border: 1px solid #dfe4eb;
          border-radius: 9px;
          padding: 0 12px;
          background: #fff;
          color: #334155;
          font-family: inherit;
          outline: none;
        }

        .programs-card {
          background: #fff;
          border: 1px solid #e4e8ee;
          border-radius: 14px;
          overflow: hidden;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1100px;
        }

        th {
          background: #fafbfc;
          color: #748196;
          font-size: 13px;
          font-weight: 700;
          text-align: right;
          padding: 16px 18px;
          border-bottom: 1px solid #e8ebef;
          white-space: nowrap;
        }

        td {
          padding: 16px 18px;
          border-bottom: 1px solid #eef1f4;
          color: #344054;
          font-size: 14px;
          vertical-align: middle;
        }

        tr:last-child td {
          border-bottom: 0;
        }

        .program-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 260px;
        }

        .program-icon {
          width: 52px;
          height: 52px;
          flex: 0 0 52px;
          border-radius: 10px;
          background: #eef1f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
        }

        .program-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .program-info strong {
          color: #172033;
          font-size: 14px;
        }

        .program-info small {
          color: #9a6b00;
          font-size: 11px;
          font-weight: 700;
        }

        .delivery-badge {
          display: inline-flex;
          align-items: center;
          border-radius: 20px;
          padding: 6px 11px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .delivery-badge.in-person {
          background: #eef3ff;
          color: #3559a8;
        }

        .delivery-badge.online {
          background: #edf9f3;
          color: #18794e;
        }

        .duration-cell {
          display: flex;
          align-items: baseline;
          gap: 4px;
          flex-wrap: wrap;
          max-width: 90px;
        }

        .duration-cell strong {
          color: #172033;
        }

        .duration-cell span {
          color: #667085;
          font-size: 12px;
        }

        .duration-cell small {
          width: 100%;
          color: #98a1af;
          font-size: 11px;
        }

        .price-cell {
          display: flex;
          flex-direction: column;
          gap: 3px;
          white-space: nowrap;
        }

        .price-cell strong {
          color: #182238;
        }

        .price-cell del {
          color: #a2a9b4;
          font-size: 11px;
        }

        .status-badge {
          border: 0;
          border-radius: 20px;
          padding: 6px 12px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .status-badge.published {
          background: #e8f7ef;
          color: #18794e;
        }

        .status-badge.draft {
          background: #f1f3f6;
          color: #687386;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .action-button {
          background: #f3f5f8;
          color: #334155;
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 700;
        }

        .action-button:hover {
          background: #e9edf2;
        }

        .action-button.schedule {
          background: #182238;
          color: #fff;
        }

        .action-button.schedule:hover {
          background: #10182a;
        }

        .action-button.danger {
          color: #b42318;
          background: #fff0ef;
        }

        .empty-state {
          min-height: 310px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
        }

        .empty-icon {
          font-size: 42px;
          margin-bottom: 14px;
        }

        .empty-state h2 {
          margin: 0 0 8px;
          color: #263247;
          font-size: 18px;
        }

        .empty-state p {
          margin: 0 0 20px;
          color: #8994a4;
          font-size: 13px;
        }

        .secondary-button {
          background: #f0f2f5;
          color: #182238;
          border-radius: 9px;
          padding: 11px 18px;
          font-weight: 700;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(15, 23, 42, 0.48);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow-y: auto;
        }

        .modal {
          width: min(900px, 100%);
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 25px 70px
            rgba(0, 0, 0, 0.18);
        }

        .modal-header {
          position: sticky;
          top: 0;
          z-index: 2;
          background: #fff;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 24px 26px;
          border-bottom: 1px solid #edf0f3;
        }

        .modal-header h2 {
          margin: 0 0 6px;
          color: #172033;
          font-size: 21px;
        }

        .modal-header p {
          margin: 0;
          color: #8792a3;
          font-size: 12px;
        }

        .close-button {
          width: 36px;
          height: 36px;
          border: 0;
          background: #f2f4f7;
          color: #5d6879;
          border-radius: 8px;
          cursor: pointer;
          font-size: 24px;
          line-height: 1;
          font-family: inherit;
          flex: 0 0 36px;
        }

        .form-section {
          padding: 24px 26px;
          border-bottom: 1px solid #edf0f3;
        }

        .form-section h3 {
          margin: 0 0 18px;
          color: #202c40;
          font-size: 15px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
          );
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .field-full {
          grid-column: 1 / -1;
        }

        .field label {
          color: #344054;
          font-size: 13px;
          font-weight: 700;
        }

        .field input,
        .field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dfe4eb;
          border-radius: 9px;
          padding: 11px 12px;
          outline: none;
          font-family: inherit;
          font-size: 13px;
          color: #172033;
          background: #fff;
          resize: vertical;
        }

        .field input {
          height: 44px;
        }

        .field small {
          color: #8a95a5;
          font-size: 11px;
        }

        .delivery-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .delivery-option {
          border: 1px solid #e0e5eb;
          background: #fff;
          border-radius: 11px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: right;
          cursor: pointer;
          font-family: inherit;
          transition: 0.2s ease;
        }

        .delivery-option:hover {
          border-color: #c8d0db;
        }

        .delivery-option.active {
          border-color: #182238;
          background: #f8f9fb;
          box-shadow: 0 0 0 2px
            rgba(24, 34, 56, 0.06);
        }

        .delivery-option-icon {
          width: 43px;
          height: 43px;
          border-radius: 9px;
          background: #eef1f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex: 0 0 43px;
        }

        .delivery-option > span:last-child {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .delivery-option strong {
          color: #263247;
          font-size: 13px;
        }

        .delivery-option small {
          color: #8a95a5;
          font-size: 11px;
        }

        .conditional-box {
          margin-top: 15px;
          padding: 15px;
          border-radius: 10px;
          background: #f8f9fb;
          border: 1px solid #e7eaf0;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .options-grid.two {
          grid-template-columns: repeat(2, 1fr);
        }

        .option-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          border: 1px solid #e1e6ec;
          border-radius: 10px;
          padding: 14px;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .option-card:hover {
          border-color: #c9d0d9;
          background: #fafbfc;
        }

        .option-card input {
          margin-top: 3px;
          accent-color: #182238;
        }

        .option-card > span {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .option-card strong {
          font-size: 13px;
          color: #293548;
        }

        .option-card small {
          color: #8a95a5;
          font-size: 11px;
          line-height: 1.5;
        }

        .modal-footer {
          position: sticky;
          bottom: 0;
          background: #fff;
          display: flex;
          justify-content: flex-start;
          gap: 10px;
          padding: 18px 26px;
          border-top: 1px solid #edf0f3;
        }

        .cancel-button {
          min-height: 44px;
          padding: 0 20px;
          border-radius: 9px;
          background: #f1f3f6;
          color: #344054;
          font-weight: 700;
          font-family: inherit;
        }

        .delete-modal {
          width: min(420px, 100%);
          background: #fff;
          border-radius: 16px;
          padding: 30px;
          text-align: center;
          box-shadow: 0 25px 70px
            rgba(0, 0, 0, 0.18);
        }

        .delete-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          border-radius: 50%;
          background: #fff0ef;
          color: #b42318;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
          font-weight: 800;
        }

        .delete-modal h2 {
          margin: 0 0 10px;
          font-size: 20px;
          color: #172033;
        }

        .delete-modal p {
          margin: 0;
          color: #667085;
          line-height: 1.8;
          font-size: 13px;
        }

        .delete-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 24px;
        }

        .delete-confirm-button {
          min-height: 44px;
          padding: 0 20px;
          border-radius: 9px;
          background: #b42318;
          color: #fff;
          font-weight: 700;
          font-family: inherit;
        }

        @media (max-width: 1000px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .options-grid {
            grid-template-columns: 1fr;
          }

          .options-grid.two {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .training-programs-page {
            padding: 20px 14px;
          }

          .page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .filters-card {
            flex-direction: column;
            align-items: stretch;
          }

          .filters-card select {
            width: 100%;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .field-full {
            grid-column: auto;
          }

          .delivery-options {
            grid-template-columns: 1fr;
          }

          .modal-overlay {
            padding: 10px;
          }

          .modal {
            max-height: calc(100vh - 20px);
          }
        }
      `}</style>
    </main>
  );
}