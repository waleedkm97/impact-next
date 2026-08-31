'use client';

import { useMemo, useState } from 'react';

type Category = {
  id: string;
  name: string;
  description: string;
};

type CategoryForm = {
  name: string;
  description: string;
};

type CourseReference = {
  category: string;
  type: 'recorded' | 'program';
};

/*
 * هذه بيانات مؤقتة للواجهة فقط.
 * لن نستخدم localStorage.
 * لاحقًا سيتم ربطها بالـ Backend.
 */
const initialCategories: Category[] = [
  {
    id: 'category-1',
    name: 'القيادة والإدارة',
    description:
      'برامج ودورات القيادة والإدارة وتطوير المهارات الإدارية.',
  },
  {
    id: 'category-2',
    name: 'المبيعات والتسويق',
    description:
      'تطوير مهارات البيع والتسويق وبناء علاقات العملاء.',
  },
  {
    id: 'category-3',
    name: 'الموارد البشرية',
    description:
      'برامج الموارد البشرية والتطوير المؤسسي وإدارة المواهب.',
  },
  {
    id: 'category-4',
    name: 'المالية والمحاسبة',
    description:
      'برامج المالية والمحاسبة والمهارات المالية.',
  },
  {
    id: 'category-5',
    name: 'سلاسل الإمداد',
    description:
      'برامج المشتريات والمخزون وسلاسل الإمداد والخدمات اللوجستية.',
  },
  {
    id: 'category-6',
    name: 'تقنية المعلومات',
    description:
      'برامج التقنية والبيانات والأمن السيبراني والتحول الرقمي.',
  },
];

/*
 * سيتم استبدال هذه البيانات لاحقًا ببيانات حقيقية
 * من الـ Backend.
 */
const courseReferences: CourseReference[] = [];

const emptyForm: CategoryForm = {
  name: '',
  description: '',
};

function createId() {
  return `category-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export default function CategoriesPage() {
  const [categories, setCategories] =
    useState<Category[]>(initialCategories);

  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<CategoryForm>(emptyForm);

  const [deleteModalOpen, setDeleteModalOpen] =
    useState(false);

  const [categoryToDelete, setCategoryToDelete] =
    useState<Category | null>(null);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((category) => {
      return (
        category.name
          .toLowerCase()
          .includes(query) ||
        category.description
          .toLowerCase()
          .includes(query)
      );
    });
  }, [categories, search]);

  function getRecordedCount(categoryName: string) {
    return courseReferences.filter(
      (course) =>
        course.category === categoryName &&
        course.type === 'recorded'
    ).length;
  }

  function getProgramsCount(categoryName: string) {
    return courseReferences.filter(
      (course) =>
        course.category === categoryName &&
        course.type === 'program'
    ).length;
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(category: Category) {
    setEditingId(category.id);

    setForm({
      name: category.name,
      description: category.description,
    });

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      alert('يرجى إدخال اسم الفئة.');
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.name.toLowerCase() ===
          name.toLowerCase() &&
        category.id !== editingId
    );

    if (duplicate) {
      alert('هذه الفئة موجودة بالفعل.');
      return;
    }

    if (editingId) {
      setCategories((current) =>
        current.map((category) =>
          category.id === editingId
            ? {
                ...category,
                name,
                description,
              }
            : category
        )
      );
    } else {
      setCategories((current) => [
        ...current,
        {
          id: createId(),
          name,
          description,
        },
      ]);
    }

    closeModal();
  }

  function askDelete(category: Category) {
    const recordedCount =
      getRecordedCount(category.name);

    const programsCount =
      getProgramsCount(category.name);

    if (
      recordedCount > 0 ||
      programsCount > 0
    ) {
      alert(
        'لا يمكن حذف هذه الفئة لأنها مرتبطة بدورات أو برامج تدريبية.'
      );
      return;
    }

    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  }

  function confirmDelete() {
    if (!categoryToDelete) {
      return;
    }

    setCategories((current) =>
      current.filter(
        (category) =>
          category.id !== categoryToDelete.id
      )
    );

    setCategoryToDelete(null);
    setDeleteModalOpen(false);
  }

  return (
    <main
      className="categories-page"
      dir="rtl"
    >
      <div className="page-header">
        <div>
          <h1>إدارة الفئات</h1>

          <p>
            إدارة فئات الدورات المسجلة والبرامج
            التدريبية.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddModal}
        >
          <span>＋</span>
          إضافة فئة
        </button>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            إجمالي الفئات
          </div>

          <div className="stat-number">
            {categories.length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            الدورات المسجلة
          </div>

          <div className="stat-number">
            {courseReferences.filter(
              (course) =>
                course.type === 'recorded'
            ).length}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            البرامج التدريبية
          </div>

          <div className="stat-number">
            {courseReferences.filter(
              (course) =>
                course.type === 'program'
            ).length}
          </div>
        </div>
      </section>

      <section className="toolbar-card">
        <div className="search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="البحث في الفئات..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>
      </section>

      <section className="categories-card">
        {filteredCategories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              ▦
            </div>

            <h2>
              لا توجد فئات
            </h2>

            <p>
              ابدأ بإضافة أول فئة إلى المنصة.
            </p>

            <button
              type="button"
              className="secondary-button"
              onClick={openAddModal}
            >
              ＋ إضافة فئة
            </button>
          </div>
        ) : (
          <div className="categories-list">
            {filteredCategories.map(
              (category, index) => {
                const recordedCount =
                  getRecordedCount(
                    category.name
                  );

                const programsCount =
                  getProgramsCount(
                    category.name
                  );

                return (
                  <article
                    className="category-item"
                    key={category.id}
                  >
                    <div className="category-main">
                      <div className="category-number">
                        {index + 1}
                      </div>

                      <div className="category-info">
                        <h3>
                          {category.name}
                        </h3>

                        {category.description && (
                          <p>
                            {
                              category.description
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="category-stats">
                      <span>
                        {recordedCount} دورة مسجلة
                      </span>

                      <span>
                        {programsCount} برنامج تدريبي
                      </span>
                    </div>

                    <div className="category-actions">
                      <button
                        type="button"
                        className="action-button"
                        onClick={() =>
                          openEditModal(
                            category
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
                            category
                          )
                        }
                      >
                        حذف
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingId
                    ? 'تعديل الفئة'
                    : 'إضافة فئة'}
                </h2>

                <p>
                  أضف اسم الفئة ووصفها.
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
              <div className="form-section">
                <div className="field">
                  <label>
                    اسم الفئة *
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          name: event.target.value,
                        })
                      )
                    }
                    placeholder="مثال: القيادة والإدارة"
                    required
                  />
                </div>

                <div className="field">
                  <label>
                    وصف الفئة
                  </label>

                  <textarea
                    rows={5}
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          description:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="اكتب وصفًا مختصرًا للفئة..."
                  />
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
                  {editingId
                    ? 'حفظ التعديلات'
                    : 'إضافة الفئة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModalOpen &&
        categoryToDelete && (
          <div className="modal-overlay">
            <div className="delete-modal">
              <div className="delete-icon">
                !
              </div>

              <h2>
                حذف الفئة؟
              </h2>

              <p>
                هل أنت متأكد من حذف الفئة:
                <strong>
                  {' '}
                  {categoryToDelete.name}
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
                    setCategoryToDelete(
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
        .categories-page {
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

        .primary-button {
          min-height: 46px;
          padding: 0 20px;
          border: 0;
          border-radius: 10px;
          background: #182238;
          color: #fff;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .primary-button:hover {
          background: #10182a;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: #fff;
          border: 1px solid #e4e8ee;
          border-radius: 14px;
          padding: 22px 24px;
        }

        .stat-label {
          color: #78869a;
          font-size: 14px;
          margin-bottom: 15px;
        }

        .stat-number {
          font-size: 28px;
          font-weight: 800;
          color: #111827;
        }

        .toolbar-card {
          background: #fff;
          border: 1px solid #e4e8ee;
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 20px;
        }

        .search-box {
          position: relative;
        }

        .search-box span {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #8b96a7;
          font-size: 21px;
        }

        .search-box input {
          width: 100%;
          height: 46px;
          box-sizing: border-box;
          border: 1px solid #dfe4eb;
          border-radius: 9px;
          outline: none;
          padding: 0 44px 0 14px;
          font-family: inherit;
          font-size: 13px;
        }

        .search-box input:focus,
        .field input:focus,
        .field textarea:focus {
          border-color: #182238;
          box-shadow: 0 0 0 3px
            rgba(24, 34, 56, 0.06);
        }

        .categories-card {
          background: #fff;
          border: 1px solid #e4e8ee;
          border-radius: 14px;
          overflow: hidden;
        }

        .categories-list {
          display: flex;
          flex-direction: column;
        }

        .category-item {
          display: grid;
          grid-template-columns: minmax(300px, 1fr) auto auto;
          align-items: center;
          gap: 25px;
          padding: 20px 24px;
          border-bottom: 1px solid #eef1f4;
        }

        .category-item:last-child {
          border-bottom: 0;
        }

        .category-main {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .category-number {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          border-radius: 10px;
          background: #f0f2f5;
          color: #182238;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
        }

        .category-info {
          min-width: 0;
        }

        .category-info h3 {
          margin: 0 0 6px;
          color: #202c40;
          font-size: 15px;
        }

        .category-info p {
          margin: 0;
          color: #8994a4;
          font-size: 12px;
          line-height: 1.6;
        }

        .category-stats {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }

        .category-stats span {
          padding: 7px 10px;
          border-radius: 7px;
          background: #f4f6f8;
          color: #667085;
          font-size: 11px;
          font-weight: 600;
        }

        .category-actions {
          display: flex;
          gap: 7px;
        }

        .action-button {
          border: 0;
          border-radius: 8px;
          padding: 8px 12px;
          background: #f2f4f7;
          color: #344054;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .action-button:hover {
          background: #e8ebef;
        }

        .action-button.danger {
          color: #b42318;
          background: #fff0ef;
        }

        .empty-state {
          min-height: 320px;
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
          color: #687386;
        }

        .empty-state h2 {
          margin: 0 0 8px;
          font-size: 18px;
          color: #263247;
        }

        .empty-state p {
          margin: 0 0 20px;
          color: #8994a4;
          font-size: 13px;
        }

        .secondary-button {
          border: 0;
          border-radius: 9px;
          background: #f0f2f5;
          color: #182238;
          padding: 11px 18px;
          font-family: inherit;
          font-weight: 700;
          cursor: pointer;
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
        }

        .modal {
          width: min(620px, 100%);
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 25px 70px
            rgba(0, 0, 0, 0.18);
          overflow: hidden;
        }

        .modal-header {
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
        }

        .form-section {
          padding: 24px 26px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 18px;
        }

        .field:last-child {
          margin-bottom: 0;
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
          resize: vertical;
        }

        .field input {
          height: 44px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-start;
          gap: 10px;
          padding: 18px 26px;
          border-top: 1px solid #edf0f3;
        }

        .cancel-button {
          min-height: 44px;
          padding: 0 20px;
          border: 0;
          border-radius: 9px;
          background: #f1f3f6;
          color: #344054;
          font-family: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .delete-modal {
          width: min(420px, 100%);
          background: #fff;
          border-radius: 16px;
          padding: 30px;
          text-align: center;
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
        }

        .delete-modal p {
          margin: 0;
          color: #667085;
          font-size: 13px;
          line-height: 1.8;
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
          border: 0;
          border-radius: 9px;
          background: #b42318;
          color: #fff;
          font-family: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .category-item {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .category-actions {
            justify-content: flex-start;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .categories-page {
            padding: 20px 14px;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .category-stats {
            flex-wrap: wrap;
          }

          .modal-overlay {
            padding: 10px;
          }
        }
      `}</style>
    </main>
  );
}