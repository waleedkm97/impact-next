'use client';

import { useMemo, useState } from 'react';

type RecordedCourse = {
  id: string;
  title: string;
  category: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  hours: number;
  shortDescription: string;
  fullDescription: string;
  objectives: string[];
  outline: string;
  audience: string;
  image: string;
  featured: boolean;
  published: boolean;
  preAssessmentEnabled: boolean;
  postAssessmentEnabled: boolean;
  courseEvaluationEnabled: boolean;
  videosCount: number;
  createdAt: string;
};

type CourseForm = {
  title: string;
  category: string;
  price: string;
  oldPrice: string;
  discount: string;
  hours: string;
  shortDescription: string;
  fullDescription: string;
  objectives: string;
  outline: string;
  audience: string;
  image: string;
  featured: boolean;
  published: boolean;
  preAssessmentEnabled: boolean;
  postAssessmentEnabled: boolean;
  courseEvaluationEnabled: boolean;
  videosCount: string;
};

const emptyForm: CourseForm = {
  title: '',
  category: '',
  price: '',
  oldPrice: '',
  discount: '',
  hours: '',
  shortDescription: '',
  fullDescription: '',
  objectives: '',
  outline: '',
  audience: '',
  image: '',
  featured: false,
  published: true,
  preAssessmentEnabled: true,
  postAssessmentEnabled: true,
  courseEvaluationEnabled: true,
  videosCount: '0',
};

const initialCourses: RecordedCourse[] = [];

function createId() {
  return `recorded-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('ar-SA').format(value);
}

export default function RecordedCoursesPage() {
  const [courses, setCourses] =
    useState<RecordedCourse[]>(initialCourses);

  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState<
    'all' | 'published' | 'draft'
  >('all');

  const [modalOpen, setModalOpen] = useState(false);

  const [editingCourseId, setEditingCourseId] =
    useState<string | null>(null);

  const [form, setForm] = useState<CourseForm>(emptyForm);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [courseToDelete, setCourseToDelete] =
    useState<RecordedCourse | null>(null);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.category.toLowerCase().includes(query) ||
        course.audience.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && course.published) ||
        (statusFilter === 'draft' && !course.published);

      return matchesSearch && matchesStatus;
    });
  }, [courses, search, statusFilter]);

  const publishedCount = courses.filter(
    (course) => course.published
  ).length;

  const draftCount = courses.filter(
    (course) => !course.published
  ).length;

  function openAddModal() {
    setEditingCourseId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(course: RecordedCourse) {
    setEditingCourseId(course.id);

    setForm({
      title: course.title,
      category: course.category,
      price: String(course.price),
      oldPrice: course.oldPrice
        ? String(course.oldPrice)
        : '',
      discount: course.discount
        ? String(course.discount)
        : '',
      hours: String(course.hours),
      shortDescription: course.shortDescription,
      fullDescription: course.fullDescription,
      objectives: course.objectives.join('\n'),
      outline: course.outline,
      audience: course.audience,
      image: course.image,
      featured: course.featured,
      published: course.published,
      preAssessmentEnabled:
        course.preAssessmentEnabled,
      postAssessmentEnabled:
        course.postAssessmentEnabled,
      courseEvaluationEnabled:
        course.courseEvaluationEnabled,
      videosCount: String(course.videosCount),
    });

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCourseId(null);
    setForm(emptyForm);
  }

  function updateField<K extends keyof CourseForm>(
    field: K,
    value: CourseForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.title.trim()) {
      alert('يرجى إدخال اسم الدورة.');
      return;
    }

    if (!form.category.trim()) {
      alert('يرجى إدخال التصنيف.');
      return;
    }

    const price = Number(form.price) || 0;

    const oldPrice =
      Number(form.oldPrice) || undefined;

    const discount =
      Number(form.discount) || undefined;

    const hours =
      Number(form.hours) || 0;

    const videosCount =
      Number(form.videosCount) || 0;

    const courseData: RecordedCourse = {
      id: editingCourseId || createId(),

      title: form.title.trim(),

      category: form.category.trim(),

      price,

      oldPrice,

      discount,

      hours,

      shortDescription:
        form.shortDescription.trim(),

      fullDescription:
        form.fullDescription.trim(),

      objectives: form.objectives
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),

      outline: form.outline.trim(),

      audience: form.audience.trim(),

      image: form.image.trim(),

      featured: form.featured,

      published: form.published,

      preAssessmentEnabled:
        form.preAssessmentEnabled,

      postAssessmentEnabled:
        form.postAssessmentEnabled,

      courseEvaluationEnabled:
        form.courseEvaluationEnabled,

      videosCount,

      createdAt:
        editingCourseId
          ? courses.find(
              (course) =>
                course.id === editingCourseId
            )?.createdAt ||
            new Date().toISOString()
          : new Date().toISOString(),
    };

    if (editingCourseId) {
      setCourses((current) =>
        current.map((course) =>
          course.id === editingCourseId
            ? courseData
            : course
        )
      );
    } else {
      setCourses((current) => [
        courseData,
        ...current,
      ]);
    }

    closeModal();
  }

  function askDelete(course: RecordedCourse) {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  }

  function confirmDelete() {
    if (!courseToDelete) return;

    setCourses((current) =>
      current.filter(
        (course) =>
          course.id !== courseToDelete.id
      )
    );

    setCourseToDelete(null);
    setShowDeleteModal(false);
  }

  function togglePublished(
    course: RecordedCourse
  ) {
    setCourses((current) =>
      current.map((item) =>
        item.id === course.id
          ? {
              ...item,
              published: !item.published,
            }
          : item
      )
    );
  }

  return (
    <main
      className="recorded-courses-page"
      dir="rtl"
    >
      <div className="page-header">
        <div>
          <h1>إدارة الدورات المسجلة</h1>

          <p>
            إدارة الدورات المسجلة والمحتوى الرقمي
            المتاح للشراء والتعلّم الذاتي.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openAddModal}
        >
          <span>＋</span>
          إضافة دورة مسجلة
        </button>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            إجمالي الدورات المسجلة
          </div>

          <div className="stat-number">
            {courses.length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            الدورات المنشورة
          </div>

          <div className="stat-number">
            {publishedCount}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            المسودات
          </div>

          <div className="stat-number">
            {draftCount}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            الدورات المميزة
          </div>

          <div className="stat-number">
            {
              courses.filter(
                (course) => course.featured
              ).length
            }
          </div>
        </div>
      </section>

      <section className="filters-card">
        <div className="search-wrapper">
          <span className="search-icon">⌕</span>

          <input
            type="text"
            placeholder="البحث في الدورات المسجلة..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

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
            منشورة
          </option>

          <option value="draft">
            مسودة
          </option>
        </select>
      </section>

      <section className="courses-card">
        {filteredCourses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              📚
            </div>

            <h2>
              {courses.length === 0
                ? 'لا توجد دورات مسجلة'
                : 'لا توجد نتائج مطابقة'}
            </h2>

            <p>
              {courses.length === 0
                ? 'ابدأ بإضافة أول دورة مسجلة إلى المنصة.'
                : 'جرّب تغيير كلمة البحث أو الفلتر.'}
            </p>

            {courses.length === 0 && (
              <button
                className="secondary-button"
                onClick={openAddModal}
              >
                ＋ إضافة أول دورة مسجلة
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>الدورة</th>
                  <th>التصنيف</th>
                  <th>السعر</th>
                  <th>الساعات</th>
                  <th>المقاطع</th>
                  <th>الحالة</th>
                  <th>التقييمات</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredCourses.map(
                  (course) => (
                    <tr key={course.id}>
                      <td>
                        <div className="course-cell">
                          <div className="course-image">
                            {course.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={course.image}
                                alt=""
                              />
                            ) : (
                              <span>📚</span>
                            )}
                          </div>

                          <div className="course-info">
                            <strong>
                              {course.title}
                            </strong>

                            {course.shortDescription && (
                              <span>
                                {
                                  course.shortDescription
                                }
                              </span>
                            )}

                            {course.featured && (
                              <small className="featured-label">
                                ★ دورة مميزة
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        {course.category}
                      </td>

                      <td>
                        <div className="price-cell">
                          <strong>
                            {formatPrice(
                              course.price
                            )}{' '}
                            ر.س
                          </strong>

                          {course.oldPrice && (
                            <del>
                              {formatPrice(
                                course.oldPrice
                              )}{' '}
                              ر.س
                            </del>
                          )}
                        </div>
                      </td>

                      <td>
                        {course.hours} ساعة
                      </td>

                      <td>
                        {course.videosCount}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`status-badge ${
                            course.published
                              ? 'published'
                              : 'draft'
                          }`}
                          onClick={() =>
                            togglePublished(
                              course
                            )
                          }
                          title="اضغط لتغيير حالة النشر"
                        >
                          {course.published
                            ? 'منشورة'
                            : 'مسودة'}
                        </button>
                      </td>

                      <td>
                        <div className="assessment-summary">
                          {course.preAssessmentEnabled && (
                            <span title="تقييم قبلي">
                              قبلي
                            </span>
                          )}

                          {course.postAssessmentEnabled && (
                            <span title="تقييم بعدي">
                              بعدي
                            </span>
                          )}

                          {course.courseEvaluationEnabled && (
                            <span title="تقييم الدورة">
                              الدورة
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            className="action-button"
                            onClick={() =>
                              openEditModal(
                                course
                              )
                            }
                          >
                            تعديل
                          </button>

                          <button
                            type="button"
                            className="action-button danger"
                            onClick={() =>
                              askDelete(course)
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

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingCourseId
                    ? 'تعديل الدورة المسجلة'
                    : 'إضافة دورة مسجلة'}
                </h2>

                <p>
                  هذه الصفحة مخصصة للدورات
                  المسجلة فقط، بدون جداول أو
                  مدن أو حضور.
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

            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>
                  المعلومات الأساسية
                </h3>

                <div className="form-grid">
                  <div className="field field-full">
                    <label>
                      اسم الدورة *
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
                      placeholder="مثال: إدارة الوقت بفعالية"
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
                      الفئة المستهدفة
                    </label>

                    <input
                      type="text"
                      value={form.audience}
                      onChange={(event) =>
                        updateField(
                          'audience',
                          event.target.value
                        )
                      }
                      placeholder="مثال: الموظفون والمدراء"
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
                      value={form.oldPrice}
                      onChange={(event) =>
                        updateField(
                          'oldPrice',
                          event.target.value
                        )
                      }
                      placeholder="اختياري"
                    />
                  </div>

                  <div className="field">
                    <label>
                      نسبة الخصم %
                    </label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.discount}
                      onChange={(event) =>
                        updateField(
                          'discount',
                          event.target.value
                        )
                      }
                      placeholder="مثال: 20"
                    />
                  </div>

                  <div className="field">
                    <label>
                      عدد الساعات
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={form.hours}
                      onChange={(event) =>
                        updateField(
                          'hours',
                          event.target.value
                        )
                      }
                      placeholder="مثال: 10"
                    />
                  </div>

                  <div className="field">
                    <label>
                      عدد المقاطع
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={form.videosCount}
                      onChange={(event) =>
                        updateField(
                          'videosCount',
                          event.target.value
                        )
                      }
                      placeholder="مثال: 12"
                    />
                  </div>

                  <div className="field field-full">
                    <label>
                      رابط صورة الدورة
                    </label>

                    <input
                      type="text"
                      value={form.image}
                      onChange={(event) =>
                        updateField(
                          'image',
                          event.target.value
                        )
                      }
                      placeholder="/assets/images/course.jpg"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>
                  وصف الدورة
                </h3>

                <div className="form-grid">
                  <div className="field field-full">
                    <label>
                      الوصف المختصر
                    </label>

                    <textarea
                      rows={3}
                      value={
                        form.shortDescription
                      }
                      onChange={(event) =>
                        updateField(
                          'shortDescription',
                          event.target.value
                        )
                      }
                      placeholder="وصف مختصر يظهر في بطاقة الدورة..."
                    />
                  </div>

                  <div className="field field-full">
                    <label>
                      الوصف الكامل
                    </label>

                    <textarea
                      rows={6}
                      value={
                        form.fullDescription
                      }
                      onChange={(event) =>
                        updateField(
                          'fullDescription',
                          event.target.value
                        )
                      }
                      placeholder="الوصف الكامل للدورة..."
                    />
                  </div>

                  <div className="field field-full">
                    <label>
                      الأهداف
                    </label>

                    <textarea
                      rows={5}
                      value={form.objectives}
                      onChange={(event) =>
                        updateField(
                          'objectives',
                          event.target.value
                        )
                      }
                      placeholder={
                        'اكتب كل هدف في سطر مستقل\nفهم المفاهيم الأساسية\nتطبيق المهارات عملياً\nتحسين الأداء'
                      }
                    />

                    <small>
                      كل هدف في سطر مستقل.
                    </small>
                  </div>

                  <div className="field field-full">
                    <label>
                      محتوى الدورة / المحاور
                    </label>

                    <textarea
                      rows={6}
                      value={form.outline}
                      onChange={(event) =>
                        updateField(
                          'outline',
                          event.target.value
                        )
                      }
                      placeholder="اكتب محاور ومحتوى الدورة..."
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>
                  التقييمات
                </h3>

                <div className="options-grid">
                  <label className="option-card">
                    <input
                      type="checkbox"
                      checked={
                        form.preAssessmentEnabled
                      }
                      onChange={(event) =>
                        updateField(
                          'preAssessmentEnabled',
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        التقييم القبلي
                      </strong>

                      <small>
                        يظهر للمتدرب قبل بدء الدورة.
                      </small>
                    </span>
                  </label>

                  <label className="option-card">
                    <input
                      type="checkbox"
                      checked={
                        form.postAssessmentEnabled
                      }
                      onChange={(event) =>
                        updateField(
                          'postAssessmentEnabled',
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        التقييم البعدي
                      </strong>

                      <small>
                        يظهر بعد إكمال الدورة.
                      </small>
                    </span>
                  </label>

                  <label className="option-card">
                    <input
                      type="checkbox"
                      checked={
                        form.courseEvaluationEnabled
                      }
                      onChange={(event) =>
                        updateField(
                          'courseEvaluationEnabled',
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        تقييم الدورة
                      </strong>

                      <small>
                        تقييم تجربة المتدرب للدورة.
                      </small>
                    </span>
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>
                  إعدادات النشر
                </h3>

                <div className="options-grid">
                  <label className="option-card">
                    <input
                      type="checkbox"
                      checked={form.published}
                      onChange={(event) =>
                        updateField(
                          'published',
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        نشر الدورة
                      </strong>

                      <small>
                        السماح بظهور الدورة للزوار
                        والمتدربين.
                      </small>
                    </span>
                  </label>

                  <label className="option-card">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(event) =>
                        updateField(
                          'featured',
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        دورة مميزة
                      </strong>

                      <small>
                        إظهار الدورة ضمن الدورات
                        المميزة.
                      </small>
                    </span>
                  </label>
                </div>
              </div>

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
                  {editingCourseId
                    ? 'حفظ التعديلات'
                    : 'إضافة الدورة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal &&
        courseToDelete && (
          <div className="modal-overlay">
            <div className="delete-modal">
              <div className="delete-icon">
                !
              </div>

              <h2>
                حذف الدورة؟
              </h2>

              <p>
                هل أنت متأكد من حذف دورة:
                <strong>
                  {' '}
                  {courseToDelete.title}
                </strong>
                ؟
              </p>

              <div className="delete-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCourseToDelete(null);
                  }}
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  className="delete-confirm-button"
                  onClick={confirmDelete}
                >
                  نعم، حذف
                </button>
              </div>
            </div>
          </div>
        )}

      <style jsx>{`
        .recorded-courses-page {
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
        .action-button {
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
          box-sizing: border-box;
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
          min-width: 160px;
          border: 1px solid #dfe4eb;
          border-radius: 9px;
          padding: 0 12px;
          background: #fff;
          color: #334155;
          font-family: inherit;
          outline: none;
        }

        .courses-card {
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
          min-width: 1050px;
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

        .course-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 270px;
        }

        .course-image {
          width: 54px;
          height: 54px;
          flex: 0 0 54px;
          border-radius: 10px;
          overflow: hidden;
          background: #eef1f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
        }

        .course-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .course-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .course-info strong {
          color: #172033;
          font-size: 14px;
        }

        .course-info span {
          color: #8994a4;
          font-size: 12px;
          max-width: 260px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .featured-label {
          color: #9a6b00;
          font-size: 11px;
          font-weight: 700;
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

        .assessment-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .assessment-summary span {
          background: #f1f3f7;
          color: #596579;
          border-radius: 5px;
          padding: 4px 7px;
          font-size: 10px;
          white-space: nowrap;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .action-button {
          background: #f3f5f8;
          color: #334155;
          padding: 7px 11px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 700;
        }

        .action-button:hover {
          background: #e9edf2;
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

        .options-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
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

        .option-card span {
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
            grid-template-columns: repeat(
              2,
              1fr
            );
          }

          .options-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .recorded-courses-page {
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