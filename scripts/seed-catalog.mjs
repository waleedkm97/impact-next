import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client.ts';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const imagePools = {
  hr: [
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=82',
  ],
  supply: [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1200&q=82',
  ],
  finance: [
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=82',
  ],
  sales: [
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&w=1200&q=82',
  ],
  marketing: [
    'https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=82',
  ],
  leadership: [
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=82',
  ],
  technology: [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=82',
  ],
  microsoft: [
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=82',
  ],
  insurance: [
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=82',
  ],
  projects: [
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1504610926078-a1611febcad3?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=82',
  ],
  quality: [
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=82',
  ],
  safety: [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=82',
  ],
  soft: [
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=82',
  ],
  data: [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=82',
  ],
  governance: [
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=82',
  ],
  logistics: [
    'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1200&q=82',
  ],
  law: [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1200&q=82',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=82',
  ],
};

const categories = [
  ['human-resources', 'الموارد البشرية', 'hr', 'تطوير رأس المال البشري وبناء بيئات عمل عالية الأداء.'],
  ['procurement-supply-chain', 'المشتريات وسلاسل الإمداد', 'supply', 'ممارسات استراتيجية لإدارة المشتريات وسلاسل الإمداد.'],
  ['accounting-finance', 'المحاسبة والمالية', 'finance', 'مهارات مالية عملية لدعم القرار والرقابة والنمو.'],
  ['sales-customer-service', 'المبيعات وخدمة العملاء', 'sales', 'تجارب بيع وخدمة عملاء تقود إلى نتائج قابلة للقياس.'],
  ['marketing', 'التسويق', 'marketing', 'أدوات التسويق وبناء العلامة التجارية في الأسواق الحديثة.'],
  ['leadership-management', 'القيادة والإدارة', 'leadership', 'قدرات قيادية لإدارة الفرق وتحقيق الأولويات.'],
  ['information-technology', 'تقنية المعلومات', 'technology', 'أساسيات التقنية والأمن والخدمات الرقمية للمؤسسات.'],
  ['microsoft', 'Microsoft', 'microsoft', 'مهارات Microsoft العملية للإنتاجية والتحليل واتخاذ القرار.'],
  ['insurance', 'التأمين', 'insurance', 'إدارة المخاطر والمنتجات والعمليات التأمينية باحتراف.'],
  ['project-management', 'إدارة المشاريع', 'projects', 'منهجيات وأدوات تسليم المشاريع في الوقت والميزانية.'],
  ['quality-performance', 'الجودة وتحسين الأداء', 'quality', 'أنظمة الجودة والتحسين المستمر وقياس الأداء.'],
  ['occupational-safety', 'السلامة والصحة المهنية', 'safety', 'ممارسات السلامة والوقاية وإدارة المخاطر في بيئة العمل.'],
  ['personal-skills', 'المهارات الشخصية', 'soft', 'مهارات التواصل والتعاون والفعالية المهنية.'],
  ['data-analytics', 'البيانات والتحليلات', 'data', 'تحويل البيانات إلى رؤى وقرارات عملية.'],
  ['governance-risk-compliance', 'الحوكمة والمخاطر والامتثال', 'governance', 'أطر الحوكمة والرقابة وإدارة المخاطر والامتثال.'],
  ['logistics-inventory', 'اللوجستيات وإدارة المخزون', 'logistics', 'رفع كفاءة التدفق والتخزين والتوزيع.'],
  ['business-law', 'القانون والأعمال', 'law', 'المفاهيم القانونية اللازمة للقرارات والعقود والأعمال.'],
].map(([id, name, imageKey, description]) => ({ id, name, imageKey, description }));

const englishNames = {
  'human-resources': 'Human Resources',
  'procurement-supply-chain': 'Procurement & Supply Chain',
  'accounting-finance': 'Accounting & Finance',
  'sales-customer-service': 'Sales & Customer Service',
  marketing: 'Marketing',
  'leadership-management': 'Leadership & Management',
  'information-technology': 'Information Technology',
  microsoft: 'Microsoft',
  insurance: 'Insurance',
  'project-management': 'Project Management',
  'quality-performance': 'Quality & Performance Improvement',
  'occupational-safety': 'Occupational Safety & Health',
  'personal-skills': 'Soft Skills',
  'data-analytics': 'Data & Analytics',
  'governance-risk-compliance': 'Governance, Risk & Compliance',
  'logistics-inventory': 'Logistics & Inventory Management',
  'business-law': 'Law & Business',
  'إدارة الوقت': 'Time Management',
  'التفكير الإبداعي': 'Creative Thinking',
  'التواصل': 'Communication',
  'المبيعات': 'Sales',
  'خدمة العملاء': 'Customer Service',
  'الي بتنحذف': 'Archived Category',
  'فئة مرتبطة للاختبار': 'Test Category',
};

for (const category of categories) category.englishName = englishNames[category.id] || englishNames[category.name] || 'Professional Development';

const titles = {
  'human-resources': ['إدارة الأداء الوظيفي', 'تخطيط القوى العاملة', 'تحليل الوظائف وبناء الوصف الوظيفي', 'إدارة المواهب والتعاقب الوظيفي', 'التعويضات والمزايا', 'المقابلات المبنية على الكفاءات', 'تجربة الموظف وتصميم رحلة العمل'],
  'procurement-supply-chain': ['إدارة المشتريات الاستراتيجية', 'إدارة الموردين وتقييم الأداء', 'التفاوض الاحترافي في المشتريات', 'تخطيط الطلب والتنبؤ بالمبيعات', 'أساسيات سلاسل الإمداد', 'إدارة العقود والمناقصات', 'مؤشرات أداء المشتريات وسلسلة الإمداد'],
  'accounting-finance': ['التحليل المالي لاتخاذ القرار', 'إعداد الموازنات التقديرية', 'المحاسبة لغير المحاسبين', 'إدارة التدفقات النقدية', 'الرقابة المالية الداخلية', 'قراءة القوائم المالية', 'إدارة التكاليف وتحسين الربحية'],
  'sales-customer-service': ['مهارات البيع الاحترافي', 'إدارة الحسابات الرئيسية', 'خدمة العملاء وبناء الولاء', 'تصميم تجربة العميل', 'التفاوض البيعي وإدارة الاعتراضات', 'إدارة مراكز الاتصال', 'قياس جودة الخدمة ورضا العملاء'],
  marketing: ['التسويق الرقمي المتكامل', 'التسويق بالمحتوى', 'بناء وإدارة العلامة التجارية', 'التسويق عبر وسائل التواصل', 'استراتيجية التسويق وتجزئة السوق', 'تحسين محركات البحث SEO', 'قياس عائد الاستثمار التسويقي'],
  'leadership-management': ['القيادة الفعالة وبناء الثقة', 'الذكاء القيادي', 'إدارة الفرق عالية الأداء', 'اتخاذ القرار وحل المشكلات', 'إدارة التغيير المؤسسي', 'التفويض وإدارة الأولويات', 'إدارة الاجتماعات والنتائج'],
  'information-technology': ['Cybersecurity Fundamentals', 'IT Service Management', 'Cloud Fundamentals', 'Networking Fundamentals', 'إدارة أمن المعلومات', 'أساسيات التحول الرقمي', 'إدارة البنية التحتية التقنية'],
  microsoft: ['Microsoft Excel للمبتدئين', 'Microsoft Excel المتقدم', 'تحليل البيانات باستخدام Power BI', 'Microsoft PowerPoint للعروض المؤثرة', 'Microsoft Word للأعمال', 'Microsoft Project لإدارة المشاريع', 'Microsoft 365 للإنتاجية المؤسسية'],
  insurance: ['أساسيات التأمين وإدارة المخاطر', 'اكتتاب التأمين وتقييم المخاطر', 'إدارة مطالبات التأمين', 'تسويق المنتجات التأمينية', 'الامتثال والحوكمة في التأمين', 'إعادة التأمين للممارسين', 'تحليل محافظ التأمين'],
  'project-management': ['أساسيات إدارة المشاريع', 'إدارة مخاطر المشاريع', 'إدارة أصحاب المصلحة', 'Agile Project Management', 'Scrum للمشاريع الرقمية', 'إدارة نطاق وميزانية المشروع', 'إدارة المشاريع باستخدام مؤشرات الأداء'],
  'quality-performance': ['أساسيات إدارة الجودة', 'التحسين المستمر وKaizen', 'مؤشرات الأداء المتوازنة', 'تدقيق أنظمة الجودة', 'تحليل الأسباب الجذرية', 'Lean Management', 'تصميم إجراءات العمل وقياسها'],
  'occupational-safety': ['أساسيات السلامة والصحة المهنية', 'تقييم المخاطر في بيئة العمل', 'التحقيق في الحوادث', 'خطط الطوارئ والإخلاء', 'السلامة في مواقع الإنشاءات', 'السلامة الكيميائية والتعامل مع المواد', 'ثقافة السلامة والقيادة الوقائية'],
  'personal-skills': ['التواصل المؤثر في بيئة العمل', 'الذكاء العاطفي', 'إدارة الوقت والإنجاز', 'التفكير النقدي والإبداعي', 'العرض والتقديم الاحترافي', 'العمل الجماعي وبناء التعاون', 'كتابة التقارير والمراسلات المهنية'],
  'data-analytics': ['أساسيات تحليل البيانات', 'تصوير البيانات ولوحات المعلومات', 'تحليل البيانات باستخدام Excel', 'مقدمة في SQL للأعمال', 'البيانات لاتخاذ القرار', 'مؤشرات الأداء والتحليلات التنبؤية', 'حوكمة البيانات وجودتها'],
  'governance-risk-compliance': ['أساسيات الحوكمة المؤسسية', 'إدارة المخاطر المؤسسية ERM', 'الامتثال والرقابة الداخلية', 'مكافحة الاحتيال والفساد', 'إدارة استمرارية الأعمال', 'إدارة المخاطر التشغيلية', 'تصميم مصفوفة الصلاحيات والضوابط'],
  'logistics-inventory': ['إدارة المخزون الحديثة', 'تخطيط المستودعات', 'عمليات النقل والتوزيع', 'تحسين سلسلة التوريد اللوجستية', 'مؤشرات أداء المستودعات', 'الجرد والرقابة على المخزون', 'إدارة الخدمات اللوجستية للمشاريع'],
  'business-law': ['صياغة ومراجعة العقود التجارية', 'القانون التجاري لغير القانونيين', 'إدارة النزاعات التجارية', 'حوكمة الشركات والالتزامات النظامية', 'الامتثال للأنظمة في بيئة الأعمال', 'حماية البيانات والخصوصية للأعمال', 'المهارات القانونية لمديري الأعمال'],
};

const extraTitles = {
  'human-resources': ['تصميم تجربة المرشح', 'إدارة علاقات الموظفين', 'التخطيط الاستراتيجي للتدريب'],
  'procurement-supply-chain': ['إدارة المشتريات الحكومية', 'تحسين أداء سلسلة الإمداد', 'إدارة المخاطر في التوريد'],
  'accounting-finance': ['التخطيط والتحليل المالي FP&A', 'الزكاة والضريبة للأعمال', 'التدقيق الداخلي المبني على المخاطر'],
  'sales-customer-service': ['استراتيجية الاحتفاظ بالعملاء', 'البيع الاستشاري B2B', 'إدارة تجربة ما بعد البيع'],
  marketing: ['تخطيط الحملات التسويقية', 'إدارة علاقات العملاء CRM', 'استراتيجية التسويق B2B'],
  'leadership-management': ['الكوتشنج للمديرين', 'القيادة الاستراتيجية', 'إدارة الأداء للفرق'],
  'information-technology': ['أساسيات الذكاء الاصطناعي للأعمال', 'إدارة قواعد البيانات', 'إدارة استمرارية الخدمات التقنية'],
  microsoft: ['Excel للأعمال المالية', 'Power BI المتقدم', 'أتمتة الأعمال باستخدام Power Automate'],
  insurance: ['تسعير المنتجات التأمينية', 'إدارة مخاطر التأمين الصحي', 'التحقيق في المطالبات الاحتيالية'],
  'project-management': ['إدارة البرامج والمحافظ', 'التخطيط الزمني للمشاريع', 'إدارة المشاريع الرشيقة المتقدمة'],
  'quality-performance': ['التميز المؤسسي EFQM', 'إدارة العمليات بالبيانات', 'بناء نظام إدارة الجودة ISO'],
  'occupational-safety': ['سلامة الأعمال في الأماكن المرتفعة', 'إدارة المواد الخطرة', 'الإسعافات الأولية في بيئة العمل'],
  'personal-skills': ['التفاوض وبناء التأثير', 'مهارات التفكير الاستراتيجي', 'التعامل مع ضغوط العمل'],
  'data-analytics': ['تحليل الأعمال باستخدام Power BI', 'أساسيات علم البيانات', 'تصميم قواعد البيانات للتحليلات'],
  'governance-risk-compliance': ['الرقابة على مكافحة غسل الأموال', 'إدارة مخاطر الطرف الثالث', 'اختبارات فعالية الضوابط'],
  'logistics-inventory': ['إدارة أسطول النقل', 'التنبؤ بالمخزون', 'تصميم شبكات التوزيع'],
  'business-law': ['عقود التوريد والمقاولات', 'الملكية الفكرية للأعمال', 'إدارة التحقيقات الداخلية'],
};

const slugify = (value) => value.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
const categoriesById = new Map(categories.map((category) => [category.id, category]));
const catalogCourses = categories.flatMap((category) => [...titles[category.id], ...(extraTitles[category.id] ?? [])].map((title, index) => {
  const image = imagePools[category.imageKey][index % imagePools[category.imageKey].length];
  const id = `catalog-${category.id}-${index + 1}`;
  const slug = `${category.id}-${slugify(title)}`;
  const topics = [
    `مفاهيم ${title} وأثرها على الأداء المؤسسي`,
    `الأدوات والنماذج العملية في ${title}`,
    'تحليل الحالات والتحديات الواقعية',
    'بناء خطة تطبيق قابلة للقياس',
  ];
  const englishTitle = `${category.englishName}: Professional Practice ${index + 1}`;
  return {
    id,
    slug,
    title,
    categoryId: category.id,
    description: `برنامج مهني تطبيقي في ${title} يربط المعرفة بالممارسة، ويمنح المشاركين أدوات واضحة لتحسين القرارات والنتائج في بيئة العمل.`,
    shortDescription: `${category.description} يركز البرنامج على ${title} من خلال تطبيقات وحالات عملية.`,
    type: 'training',
    delivery: 'in_person',
    trainingKind: 'public',
    cities: ['الرياض', 'جدة', 'الدمام'],
    price: 3500 + (index % 4) * 250,
    oldPrice: 4000 + (index % 4) * 250,
    discount: 10,
    currency: 'SAR',
    days: 3,
    hours: 15,
    videosCount: 0,
    objectives: [
      `فهم الأسس المهنية المتقدمة في ${title}.`,
      'تطبيق أدوات عملية على مواقف وتحديات من بيئة العمل.',
      'تحليل النتائج وبناء قرارات أكثر دقة واستدامة.',
    ],
    outcomes: [
      'خطة تطبيق عملية قابلة للقياس بعد انتهاء البرنامج.',
      'نماذج وأدوات عمل يمكن استخدامها مباشرة.',
    ],
    outline: topics.join('\n'),
    audience: `المتخصصون والمشرفون والمديرون العاملون في مجال ${category.name} وكل من يحتاج إلى تطوير مهاراته المهنية.`,
    methodology: 'شرح تفاعلي، تمارين جماعية، حالات عملية، ومحاكاة مرتبطة بواقع العمل.',
    contentEn: {
      title: englishTitle,
      shortDescription: `A practical ${category.englishName} program focused on ${englishTitle}.`,
      description: `A professional, application-led program that connects ${englishTitle} with workplace decisions, tools and measurable outcomes.`,
      objectives: [
        `Understand the professional foundations of ${englishTitle}.`,
        'Apply practical tools to realistic workplace situations.',
        'Build an actionable improvement plan with measurable outcomes.',
      ],
      outline: [`Core concepts and business impact`, 'Practical tools and models', 'Case studies and workplace challenges', 'Application plan and measurement'],
      audience: `Professionals, supervisors and managers working in ${category.englishName}.`,
      methodology: 'Interactive facilitation, group exercises, case studies and workplace simulations.',
    },
    image,
    thumbnail: image,
    featured: index < 2,
    published: true,
    status: 'published',
    materialsEnabled: false,
    attendanceEnabled: true,
    preAssessmentEnabled: false,
    postAssessmentEnabled: false,
    courseEvaluationEnabled: true,
  };
}));

const normalizeCategoryName = (value) => String(value ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '');

async function normalizeCategories() {
  const existing = await prisma.category.findMany({ select: { id: true, name: true } });
  const canonicalByName = new Map(categories.map((category) => [normalizeCategoryName(category.name), category]));
  const aliases = new Map([
    [normalizeCategoryName('المبيعات'), 'sales-customer-service'],
    [normalizeCategoryName('خدمة العملاء'), 'sales-customer-service'],
  ]);

  for (const item of existing) {
    const canonical = aliases.has(normalizeCategoryName(item.name))
      ? categoriesById.get(aliases.get(normalizeCategoryName(item.name)))
      : canonicalByName.get(normalizeCategoryName(item.name));
    if (!canonical || item.id === canonical.id) continue;

    await prisma.$transaction(async (transaction) => {
      await transaction.course.updateMany({ where: { categoryId: item.id }, data: { categoryId: canonical.id } });
      await transaction.category.delete({ where: { id: item.id } });
    });
  }
}

async function main() {
  await normalizeCategories();
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      create: { id: category.id, name: category.name, englishName: category.englishName, description: category.description, image: imagePools[category.imageKey][0], published: true },
      update: { name: category.name, englishName: category.englishName, description: category.description, image: imagePools[category.imageKey][0], published: true },
    });
  }

  const legacyCategories = await prisma.category.findMany({ select: { id: true, name: true, englishName: true } });
  for (const category of legacyCategories) {
    const translatedName = englishNames[category.name] || category.englishName;
    if (translatedName && translatedName !== category.englishName) {
      await prisma.category.update({ where: { id: category.id }, data: { englishName: translatedName } });
    }
  }

  for (const course of catalogCourses) {
    const existingBySlug = await prisma.course.findUnique({ where: { slug: course.slug }, select: { id: true } });
    const id = existingBySlug?.id ?? course.id;
    await prisma.course.upsert({
      where: { id },
      create: { ...course, id },
      update: {
        title: course.title,
        description: course.description,
        shortDescription: course.shortDescription,
        categoryId: course.categoryId,
        image: course.image,
        thumbnail: course.thumbnail,
        objectives: course.objectives,
        outcomes: course.outcomes,
        outline: course.outline,
        audience: course.audience,
        methodology: course.methodology,
        contentEn: course.contentEn,
        metaTitle: course.title,
        metaDescription: course.shortDescription,
        published: true,
        status: 'published',
      },
    });
  }

  const existingCourses = (await prisma.course.findMany({
    select: { id: true, title: true, contentEn: true, category: { select: { englishName: true } } },
  })).filter((course) => !course.contentEn);
  for (const course of existingCourses) {
    const categoryName = course.category?.englishName ?? 'Professional Development';
    await prisma.course.update({
      where: { id: course.id },
      data: {
        contentEn: {
          title: `${categoryName} Professional Course`,
          shortDescription: `A practical professional development course in ${categoryName}.`,
          description: `A structured professional course designed to build workplace capability in ${categoryName} through practical tools and applied learning.`,
          objectives: ['Build practical workplace capability.', 'Apply professional tools to real situations.', 'Create an actionable improvement plan.'],
          outline: ['Core concepts', 'Practical tools', 'Workplace case studies', 'Application plan'],
          audience: `Professionals and managers seeking development in ${categoryName}.`,
          methodology: 'Interactive learning, practical exercises and workplace case studies.',
        },
      },
    });
  }

  console.log(`Catalog seed complete: ${categories.length} categories, ${catalogCourses.length} courses.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
