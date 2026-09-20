'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type {
  Course,
  CourseLesson,
  LessonQuestion,
} from '@/types/course';

type Q = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

const emptyVideo = {
  title: '',
  description: '',
  videoId: '',
  duration: '',
};

const emptyQuiz = {
  title: '',
  description: '',
  questions: [
    {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '0',
      explanation: '',
    },
  ],
};

export default function ContentManager() {
  const params = useParams<{
    id: string;
  }>();

  const id = params.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [videoOpen, setVideoOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [v, setV] = useState(emptyVideo);

  const [q, setQ] = useState<{
    title: string;
    description: string;
    questions: Q[];
  }>(emptyQuiz);

  async function load() {
    try {
      const response = await fetch(
        `/api/course-lessons?courseId=${encodeURIComponent(id)}`,
        {
          method: 'GET',
          cache: 'no-store',
        },
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            'تعذر تحميل محتوى الدورة.',
        );
      }

      if (result?.course) {
        setCourse(result.course);
      }

      setLessons(
        Array.isArray(result?.lessons)
          ? result.lessons
          : [],
      );
    } catch (error) {
      console.error(
        'Failed to load course content:',
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : 'تعذر تحميل محتوى الدورة.',
      );
    }
  }

  useEffect(() => {
    if (id) {
      void load();
    }
  }, [id]);

  function addVideo() {
    setEditing(null);
    setV(emptyVideo);
    setVideoOpen(true);
  }

  function editVideo(x: CourseLesson) {
    setEditing(x.id);

    setV({
      title: x.title,
      description: x.description ?? '',
      videoId: x.videoId ?? '',
      duration: x.videoDuration
        ? String(
            Math.round(
              x.videoDuration / 60,
            ),
          )
        : '',
    });

    setVideoOpen(true);
  }

  async function saveVideo(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    if (
      !v.title.trim() ||
      !v.videoId.trim()
    ) {
      return alert(
        'أدخل عنوان الفيديو ورابط/معرف الفيديو.',
      );
    }

    const data = {
      title: v.title.trim(),
      description: v.description.trim(),
      type: 'video',
      order: editing
        ? lessons.find(
            (x) => x.id === editing,
          )?.order ??
          lessons.length + 1
        : lessons.length + 1,
      videoId: v.videoId.trim(),
      videoDuration:
        (Number(v.duration) || 0) * 60,
    };

    try {
      const response = await fetch(
        editing
          ? `/api/course-lessons/${encodeURIComponent(
              editing,
            )}`
          : '/api/course-lessons',
        {
          method: editing ? 'PUT' : 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(
            editing
              ? data
              : {
                  courseId: id,
                  ...data,
                },
          ),
        },
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            'تعذر حفظ الفيديو.',
        );
      }

      setVideoOpen(false);
      await load();
    } catch (error) {
      console.error(
        'Failed to save video:',
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : 'تعذر حفظ الفيديو.',
      );
    }
  }

  function addQuiz() {
    setEditing(null);
    setQ(
      JSON.parse(
        JSON.stringify(emptyQuiz),
      ),
    );
    setQuizOpen(true);
  }

  function editQuiz(x: CourseLesson) {
    setEditing(x.id);

    setQ({
      title: x.title,
      description:
        x.description ?? '',
      questions: (
        x.questions ?? []
      ).map((z) => ({
        question: z.question,
        options:
          z.options ?? [
            '',
            '',
            '',
            '',
          ],
        correctAnswer:
          String(z.correctAnswer),
        explanation:
          z.explanation ?? '',
      })),
    });

    setQuizOpen(true);
  }

  async function saveQuiz(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    if (!q.title.trim()) {
      return alert(
        'أدخل عنوان الاختبار.',
      );
    }

    const questions: LessonQuestion[] =
      q.questions
        .filter(
          (x) => x.question.trim(),
        )
        .map((x, i) => ({
          id: `q-${Date.now()}-${i}`,
          lessonId:
            editing ?? '',
          question:
            x.question.trim(),
          type: 'multiple-choice',
          options:
            x.options.filter(Boolean),
          correctAnswer:
            x.correctAnswer,
          explanation:
            x.explanation.trim(),
          order: i + 1,
          points: 1,
        }));

    try {
      if (editing) {
        const response = await fetch(
          `/api/course-lessons/${encodeURIComponent(
            editing,
          )}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              title: q.title.trim(),
              description:
                q.description.trim(),
              type: 'quiz',
              order:
                lessons.find(
                  (x) =>
                    x.id === editing,
                )?.order ??
                lessons.length + 1,
              questions,
            }),
          },
        );

        const result =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error ||
              'تعذر حفظ الاختبار.',
          );
        }
      } else {
        const createResponse =
          await fetch(
            '/api/course-lessons',
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                courseId: id,
                title: q.title.trim(),
                description:
                  q.description.trim(),
                type: 'quiz',
                order:
                  lessons.length + 1,
              }),
            },
          );

        const createResult =
          await createResponse
            .json()
            .catch(() => null);

        if (!createResponse.ok) {
          throw new Error(
            createResult?.error ||
              'تعذر إنشاء الاختبار.',
          );
        }

        const createdId =
          createResult?.lesson?.id;

        if (!createdId) {
          throw new Error(
            'تم إنشاء الاختبار ولكن لم يتم إرجاع معرفه.',
          );
        }

        const questionResponse =
          await fetch(
            `/api/course-lessons/${encodeURIComponent(
              createdId,
            )}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                questions:
                  questions.map(
                    (x) => ({
                      ...x,
                      lessonId:
                        createdId,
                    }),
                  ),
              }),
            },
          );

        const questionResult =
          await questionResponse
            .json()
            .catch(() => null);

        if (!questionResponse.ok) {
          throw new Error(
            questionResult?.error ||
              'تم إنشاء الاختبار ولكن تعذر حفظ الأسئلة.',
          );
        }
      }

      setQuizOpen(false);
      await load();
    } catch (error) {
      console.error(
        'Failed to save quiz:',
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : 'تعذر حفظ الاختبار.',
      );
    }
  }

  async function remove(
    x: CourseLesson,
  ) {
    if (
      !confirm(
        `حذف «${x.title}»؟`,
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/course-lessons/${encodeURIComponent(
            x.id,
          )}`,
          {
            method: 'DELETE',
          },
        );

      const result =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            'تعذر حذف المحتوى.',
        );
      }

      await load();
    } catch (error) {
      console.error(
        'Failed to delete lesson:',
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : 'تعذر حذف المحتوى.',
      );
    }
  }

  if (!course) {
    return (
      <main className="admin-page">
        جاري التحميل...
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <div className="eyebrow">
            إدارة المحتوى
          </div>

          <h1>{course.title}</h1>

          <p>
            إضافة وترتيب الفيديوهات
            والاختبارات التفاعلية للدورة.
          </p>
        </div>

        <div className="admin-actions">
          <Link
            href="/admin/courses"
            className="admin-btn admin-btn-light"
          >
            العودة للدورات
          </Link>

          <button
            className="admin-btn admin-btn-primary"
            onClick={addVideo}
          >
            + إضافة فيديو
          </button>

          <button
            className="admin-btn admin-btn-gold"
            onClick={addQuiz}
          >
            + إضافة اختبار
          </button>
        </div>
      </header>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>المحتوى</th>
              <th>النوع</th>
              <th>الأسئلة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>

          <tbody>
            {lessons.map(
              (x, i) => (
                <tr key={x.id}>
                  <td>{i + 1}</td>

                  <td>
                    <strong>
                      {x.title}
                    </strong>

                    <br />

                    <small>
                      {x.description ||
                        ''}
                    </small>
                  </td>

                  <td>
                    {x.type ===
                    'video'
                      ? 'فيديو'
                      : 'اختبار تفاعلي'}
                  </td>

                  <td>
                    {x.questions
                      ?.length ?? 0}
                  </td>

                  <td>
                    <button
                      className="admin-btn admin-btn-light"
                      onClick={() =>
                        x.type ===
                        'video'
                          ? editVideo(
                              x,
                            )
                          : editQuiz(
                              x,
                            )
                      }
                    >
                      تعديل
                    </button>{' '}

                    <button
                      className="admin-btn admin-btn-danger"
                      onClick={() =>
                        void remove(
                          x,
                        )
                      }
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ),
            )}

            {lessons.length ===
              0 && (
              <tr>
                <td colSpan={5}>
                  <div className="admin-empty">
                    <strong>
                      لا يوجد محتوى
                    </strong>

                    <span>
                      ابدأ بإضافة فيديو أو
                      اختبار.
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {videoOpen && (
        <div className="admin-modal-backdrop">
          <form
            className="admin-modal"
            style={{
              maxWidth: 700,
            }}
            onSubmit={saveVideo}
          >
            <div className="admin-modal-header">
              <h2>
                {editing
                  ? 'تعديل فيديو'
                  : 'إضافة فيديو'}
              </h2>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() =>
                  setVideoOpen(
                    false,
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-form-grid">
                <Field
                  label="عنوان الفيديو"
                  full
                >
                  <input
                    className="admin-input"
                    required
                    value={
                      v.title
                    }
                    onChange={(
                      e,
                    ) =>
                      setV({
                        ...v,
                        title:
                          e.target
                            .value,
                      })
                    }
                  />
                </Field>

                <Field
                  label="رابط/معرف الفيديو"
                  full
                >
                  <input
                    className="admin-input"
                    required
                    value={
                      v.videoId
                    }
                    onChange={(
                      e,
                    ) =>
                      setV({
                        ...v,
                        videoId:
                          e.target
                            .value,
                      })
                    }
                  />
                </Field>

                <Field label="المدة بالدقائق">
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    value={
                      v.duration
                    }
                    onChange={(
                      e,
                    ) =>
                      setV({
                        ...v,
                        duration:
                          e.target
                            .value,
                      })
                    }
                  />
                </Field>

                <Field label="الوصف">
                  <input
                    className="admin-input"
                    value={
                      v.description
                    }
                    onChange={(
                      e,
                    ) =>
                      setV({
                        ...v,
                        description:
                          e.target
                            .value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-light"
                onClick={() =>
                  setVideoOpen(
                    false,
                  )
                }
              >
                إلغاء
              </button>

              <button className="admin-btn admin-btn-primary">
                حفظ الفيديو
              </button>
            </div>
          </form>
        </div>
      )}

      {quizOpen && (
        <div className="admin-modal-backdrop">
          <form
            className="admin-modal"
            style={{
              maxWidth: 900,
            }}
            onSubmit={saveQuiz}
          >
            <div className="admin-modal-header">
              <h2>
                {editing
                  ? 'تعديل اختبار تفاعلي'
                  : 'إضافة اختبار تفاعلي'}
              </h2>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() =>
                  setQuizOpen(
                    false,
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-field">
                <label>
                  عنوان الاختبار
                </label>

                <input
                  className="admin-input"
                  required
                  value={
                    q.title
                  }
                  onChange={(
                    e,
                  ) =>
                    setQ({
                      ...q,
                      title:
                        e.target
                          .value,
                    })
                  }
                />
              </div>

              <div
                className="admin-field"
                style={{
                  marginTop: 12,
                }}
              >
                <label>
                  الوصف
                </label>

                <textarea
                  className="admin-textarea"
                  rows={2}
                  value={
                    q.description
                  }
                  onChange={(
                    e,
                  ) =>
                    setQ({
                      ...q,
                      description:
                        e.target
                          .value,
                    })
                  }
                />
              </div>

              {q.questions.map(
                (x, qi) => (
                  <div
                    className="admin-card"
                    style={{
                      padding: 14,
                      marginTop: 14,
                    }}
                    key={qi}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                      }}
                    >
                      <strong>
                        السؤال{' '}
                        {qi + 1}
                      </strong>

                      {q.questions
                        .length >
                        1 && (
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() =>
                            setQ({
                              ...q,
                              questions:
                                q.questions.filter(
                                  (
                                    _,
                                    i,
                                  ) =>
                                    i !==
                                    qi,
                                ),
                            })
                          }
                        >
                          حذف السؤال
                        </button>
                      )}
                    </div>

                    <div
                      className="admin-field"
                      style={{
                        marginTop: 10,
                      }}
                    >
                      <label>
                        السؤال
                      </label>

                      <input
                        className="admin-input"
                        required
                        value={
                          x.question
                        }
                        onChange={(
                          e,
                        ) => {
                          const a = [
                            ...q.questions,
                          ];

                          a[qi] = {
                            ...a[
                              qi
                            ],
                            question:
                              e.target
                                .value,
                          };

                          setQ({
                            ...q,
                            questions:
                              a,
                          });
                        }}
                      />
                    </div>

                    <div
                      className="admin-form-grid"
                      style={{
                        marginTop: 10,
                      }}
                    >
                      {x.options.map(
                        (
                          o,
                          oi,
                        ) => (
                          <div
                            className="admin-field"
                            key={
                              oi
                            }
                          >
                            <label>
                              الخيار{' '}
                              {oi +
                                1}
                            </label>

                            <input
                              className="admin-input"
                              value={
                                o
                              }
                              onChange={(
                                e,
                              ) => {
                                const a =
                                  [
                                    ...q.questions,
                                  ];

                                const opts =
                                  [
                                    ...a[
                                      qi
                                    ]
                                      .options,
                                  ];

                                opts[
                                  oi
                                ] =
                                  e.target.value;

                                a[
                                  qi
                                ] = {
                                  ...a[
                                    qi
                                  ],
                                  options:
                                    opts,
                                };

                                setQ({
                                  ...q,
                                  questions:
                                    a,
                                });
                              }}
                            />
                          </div>
                        ),
                      )}
                    </div>

                    <div
                      className="admin-form-grid"
                      style={{
                        marginTop: 10,
                      }}
                    >
                      <Field label="الإجابة الصحيحة">
                        <select
                          className="admin-select"
                          value={
                            x.correctAnswer
                          }
                          onChange={(
                            e,
                          ) => {
                            const a =
                              [
                                ...q.questions,
                              ];

                            a[qi] = {
                              ...a[
                                qi
                              ],
                              correctAnswer:
                                e.target
                                  .value,
                            };

                            setQ({
                              ...q,
                              questions:
                                a,
                            });
                          }}
                        >
                          {x.options.map(
                            (
                              _,
                              oi,
                            ) => (
                              <option
                                key={
                                  oi
                                }
                                value={
                                  oi
                                }
                              >
                                الخيار{' '}
                                {oi +
                                  1}
                              </option>
                            ),
                          )}
                        </select>
                      </Field>

                      <Field label="شرح الإجابة">
                        <input
                          className="admin-input"
                          value={
                            x.explanation
                          }
                          onChange={(
                            e,
                          ) => {
                            const a =
                              [
                                ...q.questions,
                              ];

                            a[qi] = {
                              ...a[
                                qi
                              ],
                              explanation:
                                e.target
                                  .value,
                            };

                            setQ({
                              ...q,
                              questions:
                                a,
                            });
                          }}
                        />
                      </Field>
                    </div>
                  </div>
                ),
              )}

              <button
                type="button"
                className="admin-btn admin-btn-light"
                onClick={() =>
                  setQ({
                    ...q,
                    questions: [
                      ...q.questions,
                      {
                        question:
                          '',
                        options: [
                          '',
                          '',
                          '',
                          '',
                        ],
                        correctAnswer:
                          '0',
                        explanation:
                          '',
                      },
                    ],
                  })
                }
              >
                + إضافة سؤال
              </button>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-light"
                onClick={() =>
                  setQuizOpen(
                    false,
                  )
                }
              >
                إلغاء
              </button>

              <button className="admin-btn admin-btn-primary">
                حفظ الاختبار
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div
      className={
        full
          ? 'admin-field admin-field-full'
          : 'admin-field'
      }
    >
      <label>{label}</label>
      {children}
    </div>
  );
}