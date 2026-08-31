/**
 * Legacy-compatible Seed Data
 * 
 * This contains the default data from the legacy ImpactStore implementation.
 * These values are only used to initialize LocalStorage when empty.
 */

import { STORAGE_KEYS } from '@/lib/storage/storage-keys';

// Default Settings
export const DEFAULT_SETTINGS = {
  websiteName: 'Impact Training',
  phone: '+966 11 234 5678',
  email: 'info@impacttraining.com',
  instagram: '@impactlearning',
  linkedin: 'linkedin.com/company/impactlearning',
  whatsapp: '0595389443',
  logoHeader: 'assets/logos/logo_white-remove.png',
  logoFooter: 'assets/logos/logo_blue-remove.png'
};

// Default Categories
export const DEFAULT_CATEGORIES = [
  {
    id: 'leadership-management',
    name: 'القيادة والإدارة',
    description: 'برامج تطوير القيادة والإدارة وبناء فرق العمل.'
  },
  {
    id: 'sales',
    name: 'المبيعات',
    description: 'برامج تطوير مهارات البيع والتفاوض والبيع الاستشاري.'
  },
  {
    id: 'customer-service',
    name: 'خدمة العملاء',
    description: 'برامج تطوير تجربة العميل وخدمة العملاء.'
  },
  {
    id: 'human-resources',
    name: 'الموارد البشرية',
    description: 'برامج تطوير ممارسات ومهارات الموارد البشرية.'
  },
  {
    id: 'project-management',
    name: 'إدارة المشاريع',
    description: 'برامج تطوير مهارات إدارة المشاريع والتخطيط والتنفيذ.'
  },
  {
    id: 'communication',
    name: 'التواصل',
    description: 'برامج تطوير مهارات التواصل والعرض والإلقاء.'
  },
  {
    id: 'time-management',
    name: 'إدارة الوقت',
    description: 'برامج تطوير الإنتاجية وإدارة الوقت والأولويات.'
  },
  {
    id: 'creative-thinking',
    name: 'التفكير الإبداعي',
    description: 'برامج تطوير التفكير الإبداعي وحل المشكلات والابتكار.'
  }
];

// Default Services
export const DEFAULT_SERVICES = [
  {
    id: 'recorded-courses',
    title: 'الدورات المسجلة',
    shortDescription: 'دورات تدريبية مسجلة تتيح للمتدرب التعلم في أي وقت وبالسرعة التي تناسبه.',
    fullDescription: 'نوفر مجموعة من الدورات التدريبية المسجلة التي تتيح للمتدربين الوصول إلى المحتوى التدريبي والتعلم بشكل مرن وفق احتياجاتهم ووقتهم.',
    icon: 'video',
    objectives: [
      'إتاحة التعلم بشكل مرن وفي أي وقت',
      'توفير محتوى تدريبي عملي ومنظم',
      'تمكين المتدرب من التعلم وفق سرعته الخاصة'
    ],
    phases: [
      { name: '1. اختيار الدورة', desc: 'استعراض الدورات المتاحة واختيار البرنامج المناسب.' },
      { name: '2. التعلم', desc: 'الوصول إلى المحتوى التدريبي ومتابعة الدروس والأنشطة.' },
      { name: '3. إتمام الدورة', desc: 'استكمال محتوى الدورة والتقييمات المرتبطة بها.' }
    ],
    deliverables: ['محتوى تدريبي مسجل', 'دروس ومواد تعليمية', 'اختبارات وتقييمات'],
    audience: 'الأفراد والموظفون والجهات الراغبة في تطوير مهارات فرقها'
  },
  {
    id: 'training-courses',
    title: 'الدورات التدريبية',
    shortDescription: 'برامج تدريبية حضورية أو مباشرة عبر الإنترنت يقدمها مدربون متخصصون وفق احتياجات الأفراد والمنشآت.',
    fullDescription: 'نقدم دورات وبرامج تدريبية مباشرة حضوريًا أو عبر الإنترنت، تغطي مجموعة متنوعة من المجالات والمهارات، مع إمكانية تنفيذ برامج مخصصة للمنشآت.',
    icon: 'training',
    objectives: [
      'تطوير المهارات والمعارف المهنية',
      'تقديم تدريب عملي وتفاعلي',
      'تلبية احتياجات الأفراد والمنشآت التدريبية'
    ],
    phases: [
      { name: '1. اختيار البرنامج', desc: 'استعراض البرامج التدريبية المجدولة واختيار البرنامج المناسب.' },
      { name: '2. التسجيل', desc: 'إتمام التسجيل في البرنامج واختيار طريقة الحضور المتاحة.' },
      { name: '3. التنفيذ والتقييم', desc: 'حضور البرنامج والمشاركة في الأنشطة والتقييمات.' }
    ],
    deliverables: ['برنامج تدريبي مباشر', 'مواد تدريبية', 'أنشطة وتطبيقات عملية', 'تقييم المتدربين'],
    audience: 'الأفراد والشركات والمؤسسات والجهات الحكومية'
  },
  {
    id: 'tna-evaluation',
    title: 'تحليل الاحتياج التدريبي والتقييمات',
    shortDescription: 'تحليل احتياجات المنشأة التدريبية وتحديد الفجوات المهارية، مع تنفيذ التقييمات المناسبة قبل وبعد التدريب.',
    fullDescription: 'خدمة تساعد المنشآت على تحديد احتياجاتها التدريبية بصورة أكثر دقة من خلال تحليل الفجوات والاحتياجات، إلى جانب تصميم وتنفيذ التقييمات المناسبة لقياس مستوى المعرفة والمهارات والاستفادة من التدريب.',
    icon: 'analysis',
    objectives: [
      'تحديد الاحتياجات التدريبية الفعلية للمنشأة',
      'تحليل الفجوات المهارية والمعرفية',
      'قياس مستوى المتدربين قبل وبعد التدريب',
      'دعم اتخاذ القرارات التدريبية بناءً على نتائج التقييم'
    ],
    phases: [
      { name: '1. جمع وتحليل البيانات', desc: 'جمع المعلومات المتعلقة بالوظائف والمهارات والأداء والاحتياجات.' },
      { name: '2. تحديد الفجوات والاحتياجات', desc: 'تحليل الفجوات وتحديد الأولويات التدريبية.' },
      { name: '3. التقييم وقياس النتائج', desc: 'تنفيذ التقييمات المناسبة وتحليل النتائج وإعداد التوصيات.' }
    ],
    deliverables: ['تحليل الاحتياج التدريبي', 'تقرير الفجوات المهارية', 'أدوات التقييم', 'تقرير النتائج والتوصيات'],
    audience: 'الشركات والمؤسسات الحكومية وإدارات الموارد البشرية والتدريب'
  },
  {
    id: 'post-training-consulting',
    title: 'الاستشارات القصيرة ما بعد الدورة',
    shortDescription: 'جلسات استشارية قصيرة تساعد المتدرب على تطبيق ما تعلمه وتحويل المعرفة إلى ممارسة عملية.',
    fullDescription: 'استشارات قصيرة تقدم بعد انتهاء الدورة التدريبية لمساعدة المتدرب أو الجهة على تطبيق المهارات والمعارف المكتسبة، ومعالجة التحديات التي قد تظهر أثناء التطبيق في بيئة العمل.',
    icon: 'consulting',
    objectives: [
      'دعم تطبيق المهارات المكتسبة بعد التدريب',
      'معالجة التحديات التي تواجه المتدرب أثناء التطبيق',
      'ربط مخرجات التدريب باحتياجات العمل الفعلية'
    ],
    phases: [
      { name: '1. تحديد التحدي', desc: 'تحديد التحديات أو الموضوعات التي تحتاج إلى دعم استشاري.' },
      { name: '2. الجلسة الاستشارية', desc: 'تقديم جلسة قصيرة ومركزة لمعالجة الموضوع المحدد.' },
      { name: '3. التوصيات والمتابعة', desc: 'تقديم توصيات عملية قابلة للتطبيق.' }
    ],
    deliverables: ['جلسة استشارية قصيرة', 'توصيات عملية', 'إرشادات للتطبيق'],
    audience: 'المتدربون والموظفون والجهات الراغبة في دعم تطبيق مخرجات التدريب'
  }
];

// Default Recorded Lessons
export const DEFAULT_RECORDED_LESSONS = [
  {
    id: 'les-1',
    type: 'video',
    title: '1. أساسيات البيع الفعّال وبناء الثقة الأولية',
    description: 'فهم طبيعة البيع الحديث، دور الثقة، وكيفية بناء حضور قوي ومقنع في أول لقاء مع العميل.',
    duration: '18 دقيقة',
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    order: 1
  },
  {
    id: 'quiz-1',
    type: 'quiz',
    afterLessonId: 'les-1',
    title: 'اختبار قصير: مبادئ الثقة في البيع الحديث',
    question: 'ما هو العنصر الأكثر أهمية في بناء أول انطباع إيجابي مع العميل؟',
    options: [
      'الحديث السريع عن مزايا وسعر المنتج فوراً',
      'الاستماع النشط لفهم احتياج العميل الحقيقي وإظهار الاهتمام والتعاطف',
      'الضغط على العميل لإغلاق الصفقة في أول دقيقة',
      'تقديم خصم فوري قبل معرفة تفاصيل المشكلة'
    ],
    correctIndex: 1,
    explanation: 'الاستماع النشط وفهم المشكلة الحقيقية هو الأساس الراسخ لبناء الثقة والبيع الاستشاري الناجح.',
    order: 2
  },
  {
    id: 'les-2',
    type: 'video',
    title: '2. قراءة العميل وتحديد الاحتياج الحقيقي',
    description: 'اكتشاف الاحتياجات غير المعلنة للعميل وتحويلها إلى فرص مبيعات ملموسة ومخصصة.',
    duration: '22 دقيقة',
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    order: 3
  },
  {
    id: 'quiz-2',
    type: 'quiz',
    afterLessonId: 'les-2',
    title: 'اختبار قصير: تحليل احتياج العميل',
    question: 'عندما يطرح العميل استفساراً غامضاً أو غير محدد، ما هو التصرف الاستشاري السليم؟',
    options: [
      'افتراض الإجابة والبدء في الشرح الطويل دون تأكيد',
      'طرح أسئلة استيضاحية مفتوحة للوصول إلى جذر التحدي',
      'تجاهل السؤال والتركيز على شرائح العرض التقديمي فقط',
      'تأجيل الرد وإنهاء الجلسة'
    ],
    correctIndex: 1,
    explanation: 'الأسئلة المفتوحة تمكنك من تشخيص الاحتياج الدقيق وتقديم الحل الأنسب الذي يلامس مشكلة العميل.',
    order: 4
  },
  {
    id: 'les-3',
    type: 'video',
    title: '3. بناء العلاقة وإدارة الحوار الاستشاري',
    description: 'إنشاء انطباع إيجابي مستدام وجعل العميل شريكاً فاعلاً في اتخاذ قرار الشراء.',
    duration: '25 دقيقة',
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    order: 5
  },
  {
    id: 'les-4',
    type: 'video',
    title: '4. أدوات العرض والتقديم الإقناعي',
    description: 'عرض القيمة المضافة بطريقة مبسطة ومقنعة تبرز عائد الاستثمار والأثر العملي.',
    duration: '20 دقيقة',
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    order: 6
  },
  {
    id: 'quiz-3',
    type: 'quiz',
    afterLessonId: 'les-4',
    title: 'اختبار قصير: مهارات العرض الإقناعي',
    question: 'ما الذي يجب أن يركز عليه العرض التقديمي المقنع للحلول والمنتجات؟',
    options: [
      'سرد المواصفات الفنية المجردة بأطول وقت ممكن',
      'الأثر والعائد والقيمة الملموسة التي ستتحقق لواقع عمل العميل',
      'المقارنة السلبية الحادة مع المنافسين',
      'تكرار نصوص العقد والشروط القانونية'
    ],
    correctIndex: 1,
    explanation: 'العميل يشتري الأثر والقيمة المضافة التي تحل مشكلته وليست مجرد المواصفات الفنية المجردة.',
    order: 7
  },
  {
    id: 'les-5',
    type: 'video',
    title: '5. استراتيجيات التعامل مع الاعتراضات والرفض',
    description: 'منهجية هادئة واحترافية للتعامل مع اعتراضات السعر والوقت والمنافسين وتحويلها لفرص.',
    duration: '24 دقيقة',
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    order: 8
  },
  {
    id: 'quiz-4',
    type: 'quiz',
    afterLessonId: 'les-5',
    title: 'اختبار قصير: معالجة اعتراضات السعر',
    question: 'كيف تتعامل مع اعتراض العميل بخصوص السعر المرتفع؟',
    options: [
      'الموافقة الفورية على تقديم أكبر خصم ممكن دون نقاش',
      'تأكيد تفهم وجهة النظر ثم إعادة توجيه التركيز إلى القيمة والعائد مقابل الاستثمار',
      'إنهاء الاجتماع فوراً لعدم جدوى التفاوض',
      'الجدال الحاد وإثبات خطأ العميل في التقدير'
    ],
    correctIndex: 1,
    explanation: 'إظهار التفهم ثم بيان القيمة والعائد يعيد موازنة السعر في ذهن العميل ويبرهن على جدوى الاستثمار.',
    order: 9
  },
  {
    id: 'les-6',
    type: 'video',
    title: '6. أساليب إغلاق الصفقات بثقة واستدامة',
    description: 'اختيار توقيت وأسلوب الإغلاق الأنسب لكل عميل وتثبيت الاتفاق وبناء علاقة طويلة الأمد.',
    duration: '19 دقيقة',
    videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    order: 10
  }
];

// Seed Courses (simplified - full set would be very long)
export const SEED_COURSES = [
  // Recorded Course
  {
    id: 'sales-mastery',
    title: 'مهارات البيع وتحويل الفرص لنتائج ملموسة',
    category: 'المبيعات',
    type: 'recorded',
    delivery: 'مسجلة',
    price: 99,
    oldPrice: 200,
    discount: 'عرض الإطلاق',
    days: 0,
    hours: '6 ساعات',
    videosCount: 6,
    location: 'عن بعد - منصة IMPACT',
    dates: 'متاحة فوراً',
    shortDescription: 'دورة عملية تساعدك على فهم أساليب البيع الفعالة، بناء الثقة مع العملاء، وتحويل الفرص إلى مبيعات ملموسة عبر منهج واضح ومبني على التطبيق.',
    fullDescription: 'هذه الدورة مصممة لمساعدتك على تطوير مهارات البيع الشخصية والمهنية، وتحويل الفرص إلى مبيعات واقعية عبر أساليب عملية، تركز على فهم العميل، بناء الثقة، وإدارة الحوار بذكاء.',
    objectives: [
      'فهم أسس البيع الحديث وكيفية بناء علاقة قوية مع العميل.',
      'تحديد الاحتياجات والعمل على حلول مناسبة ومقنعة.',
      'التعامل مع الاعتراضات بمهارة وثقة.',
      'إغلاق الصفقة بأسلوب موجه نحو نتائج ملموسة.'
    ],
    outcomes: [
      'تحسين مهارات التواصل مع العملاء في المراحل المختلفة من البيع.',
      'رفع قدرة الفريق على التعامل مع الاعتراضات بثقة واحترافية.',
      'تنمية مهارات بناء علاقة طويلة الأمد مع العملاء.',
      'زيادة نسبة التحويل عبر أسلوب مبني على فهم الاحتياج الحقيقي.'
    ],
    outline: [
      'أساسيات البيع الفعّال وبناء الثقة',
      'قراءة العميل وتحديد الاحتياج الحقيقي',
      'بناء العلاقة وإدارة الحوار الاستشاري',
      'أدوات العرض والتقديم الإقناعي',
      'استراتيجيات التعامل مع الاعتراضات والرفض',
      'أساليب إغلاق الصفقات بثقة واستدامة'
    ],
    lessons: DEFAULT_RECORDED_LESSONS,
    audience: 'مناسبة للمهنيين في مجالات المبيعات، العلاقات العامة، الإدارة، والتسويق، وكذلك للمنصبين في وظائف خدمة العملاء والنجاح التجاري.',
    methodology: 'دورة فيديو مسجلة مع اختبارات تفاعلية وتطبيقات عملية قابلة للتحميل.',
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    hasCertificate: true,
    featured: true,
    published: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

// Default Trainees
export const DEFAULT_TRAINEES = [
  {
    id: 'tr-1',
    name: 'سارة السلمي',
    email: 'sara@example.com',
    phone: '0551234567',
    enrolledCourses: ['sales-mastery'],
    progress: {
      'sales-mastery': {
        completedItems: ['les-1', 'quiz-1'],
        progressPercent: 33
      }
    },
    certificates: 1,
    lastLogin: 'منذ ساعتين',
    createdAt: '2026-01-10T10:00:00.000Z'
  },
  {
    id: 'tr-2',
    name: 'عبدالله معاذ',
    email: 'abdullah@example.com',
    phone: '0552345678',
    enrolledCourses: ['sales-mastery'],
    progress: {
      'sales-mastery': {
        completedItems: ['les-1', 'quiz-1', 'les-2', 'quiz-2'],
        progressPercent: 66
      }
    },
    certificates: 1,
    lastLogin: 'اليوم',
    createdAt: '2026-01-15T12:00:00.000Z'
  },
  {
    id: 'tr-3',
    name: 'نورة الفهد',
    email: 'noura@example.com',
    phone: '0553456789',
    enrolledCourses: ['sales-mastery'],
    progress: {
      'sales-mastery': {
        completedItems: [
          'les-1',
          'quiz-1',
          'les-2',
          'quiz-2',
          'les-3',
          'les-4',
          'quiz-3',
          'les-5',
          'quiz-4',
          'les-6'
        ],
        progressPercent: 100
      }
    },
    certificates: 2,
    lastLogin: 'منذ يوم',
    createdAt: '2026-01-20T14:00:00.000Z'
  },
  {
    id: 'tr-4',
    name: 'يوسف الحارثي',
    email: 'yusuf@example.com',
    phone: '0554567890',
    enrolledCourses: [],
    progress: {},
    certificates: 0,
    lastLogin: 'منذ 3 أيام',
    createdAt: '2026-02-01T09:00:00.000Z'
  }
];

// Default Orders
export const DEFAULT_ORDERS = [
  {
    id: '#10021',
    customer: 'أحمد الراشد',
    email: 'ahmed@example.com',
    product: 'مهارات البيع وتحويل الفرص لنتائج ملموسة',
    courseId: 'sales-mastery',
    amount: 'SAR 99',
    status: 'مكتمل',
    method: 'بطاقة ائتمانية',
    date: '2026-06-10'
  },
  {
    id: '#10022',
    customer: 'ليلى الخطيب',
    email: 'layla@example.com',
    product: 'القيادة الحديثة',
    courseId: 'leadership-modern',
    amount: 'SAR 5,500',
    status: 'مكتمل',
    method: 'تحويل بنكي',
    date: '2026-06-12'
  },
  {
    id: '#10023',
    customer: 'محمد القحطاني',
    email: 'mohammed@example.com',
    product: 'مهارات التعامل مع العملاء',
    courseId: 'client-handling',
    amount: 'SAR 5,500',
    status: 'مكتمل',
    method: 'Apple Pay',
    date: '2026-06-15'
  },
  {
    id: '#10024',
    customer: 'سارة الخالد',
    email: 'sara.k@example.com',
    product: 'إدارة الأداء',
    courseId: 'hr-performance',
    amount: 'SAR 3,000',
    status: 'قيد التجهيز',
    method: 'بطاقة ائتمانية',
    date: '2026-06-18'
  }
];

// Default Coupons
export const DEFAULT_COUPONS = [
  {
    id: 'cp-1',
    code: 'WELCOME10',
    discount: 10,
    expiry: '2026-08-31',
    uses: 640,
    maxUses: 1000
  },
  {
    id: 'cp-2',
    code: 'IMPACT20',
    discount: 20,
    expiry: '2026-09-15',
    uses: 320,
    maxUses: 500
  },
  {
    id: 'cp-3',
    code: 'LEARN30',
    discount: 30,
    expiry: '2026-10-01',
    uses: 134,
    maxUses: 300
  }
];

// Default City List for Schedule Generation
export const DEFAULT_CITIES = [
  'الرياض',
  'جدة',
  'الدمام',
  'دبي',
  'القاهرة',
  'البحرين',
  'قطر',
  'لندن',
  'برشلونة',
  'ميلان'
];
