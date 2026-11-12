import type { LocalizedText } from "@/render-kit/schema/primitives";

const L = (en: string, ar: string) => ({ en, ar });

/** Sample text for one line of work, used so starter ideas read like the person's own field. */
export type FieldPack = {
  id: string;
  name: LocalizedText;
  /** Job title for a person. */
  title: LocalizedText;
  /** Headline for a company page. */
  headline: LocalizedText;
  intro: LocalizedText;
  about: LocalizedText;
  skills: LocalizedText[];
  services: { icon: string; title: LocalizedText; description: LocalizedText }[];
};

export const FIELDS: FieldPack[] = [
  {
    id: "software",
    name: L("Software and IT", "البرمجيات وتقنية المعلومات"),
    title: L("Software engineer", "مهندس برمجيات"),
    headline: L(
      "Software that ships on time and keeps working",
      "برمجيات تُسلَّم في موعدها وتستمر في العمل",
    ),
    intro: L(
      "I build web and mobile apps that stay fast as they grow. Seven years of shipping products used every day.",
      "أبني تطبيقات ويب وهاتف تبقى سريعة مع نموّها. سبع سنوات من تسليم منتجات تُستخدم يومياً.",
    ),
    about: L(
      "I started by fixing my school's timetable program and never stopped. I care about code that the next person can read, and about releases that do not need a weekend.",
      "بدأت بإصلاح برنامج الجداول في مدرستي ولم أتوقف منذ ذلك الحين. أهتم بكتابة شيفرة يستطيع غيري قراءتها، وبإصدارات لا تحتاج إلى عطلة نهاية الأسبوع.",
    ),
    skills: [
      "TypeScript",
      "React",
      "Node.js",
      "PostgreSQL",
      L("System design", "تصميم الأنظمة"),
      L("Automated testing", "الاختبارات الآلية"),
    ],
    services: [
      {
        icon: "code",
        title: L("Web apps", "تطبيقات الويب"),
        description: L(
          "From first screen to launch, built to be maintained.",
          "من أول شاشة حتى الإطلاق، مبنية لتسهل صيانتها.",
        ),
      },
      {
        icon: "phone",
        title: L("Mobile apps", "تطبيقات الهاتف"),
        description: L("One codebase for iPhone and Android.", "شيفرة واحدة للآيفون والأندرويد."),
      },
      {
        icon: "shield",
        title: L("Code review and rescue", "مراجعة وإنقاذ المشاريع"),
        description: L(
          "A clear report on what is slow, risky or broken, and the fix.",
          "تقرير واضح بما هو بطيء أو خطر أو معطّل، مع الحل.",
        ),
      },
    ],
  },
  {
    id: "design",
    name: L("Design", "التصميم"),
    title: L("Product designer", "مصمم منتجات"),
    headline: L("Design that makes products easy to use", "تصميم يجعل المنتجات سهلة الاستخدام"),
    intro: L(
      "I design apps and websites people understand the first time. Research first, pixels second.",
      "أصمم تطبيقات ومواقع يفهمها الناس من أول مرة. البحث أولاً ثم التفاصيل.",
    ),
    about: L(
      "I sit with real users before I open a design tool. Most of my best ideas came from watching someone get stuck.",
      "أجلس مع مستخدمين حقيقيين قبل أن أفتح أي برنامج تصميم. أغلب أفكاري الجيدة جاءت من مشاهدة شخص يتعثر.",
    ),
    skills: [
      L("Interface design", "تصميم الواجهات"),
      L("User research", "بحث المستخدمين"),
      L("Prototyping", "النماذج الأولية"),
      L("Design systems", "أنظمة التصميم"),
      "Figma",
      L("Arabic and English layout", "التصميم بالعربية والإنجليزية"),
    ],
    services: [
      {
        icon: "pen",
        title: L("App and web design", "تصميم التطبيقات والمواقع"),
        description: L("Screens, flows and a clickable prototype.", "شاشات ومسارات ونموذج تفاعلي."),
      },
      {
        icon: "users",
        title: L("User testing", "اختبارات المستخدمين"),
        description: L(
          "Five sessions, one clear list of what to fix.",
          "خمس جلسات وقائمة واضحة بما يجب إصلاحه.",
        ),
      },
      {
        icon: "layers",
        title: L("Design systems", "أنظمة التصميم"),
        description: L(
          "Components your developers can reuse.",
          "مكونات يستطيع مطوّروك إعادة استخدامها.",
        ),
      },
    ],
  },
  {
    id: "marketing",
    name: L("Marketing and sales", "التسويق والمبيعات"),
    title: L("Marketing manager", "مدير تسويق"),
    headline: L("Marketing you can measure", "تسويق يمكن قياسه"),
    intro: L(
      "I plan and run campaigns that bring customers, not just clicks. Every pound is tracked to a sale.",
      "أخطط وأدير حملات تجلب عملاء لا مجرد نقرات. كل جنيه يُتابَع حتى عملية البيع.",
    ),
    about: L(
      "I have run launches for shops, apps and clinics. I start with who buys and why, then pick the channel.",
      "أدرت حملات إطلاق لمتاجر وتطبيقات وعيادات. أبدأ بمن يشتري ولماذا، ثم أختار القناة.",
    ),
    skills: [
      L("Campaign planning", "تخطيط الحملات"),
      L("Paid ads", "الإعلانات المدفوعة"),
      L("Content strategy", "استراتيجية المحتوى"),
      L("Email marketing", "التسويق بالبريد"),
      L("Analytics", "تحليل البيانات"),
      "SEO",
    ],
    services: [
      {
        icon: "target",
        title: L("Campaigns", "الحملات"),
        description: L("Plan, launch and weekly reports.", "تخطيط وإطلاق وتقارير أسبوعية."),
      },
      {
        icon: "chart",
        title: L("Growth audits", "تدقيق النمو"),
        description: L(
          "Where you lose customers and how to stop it.",
          "أين تخسر عملاءك وكيف توقف ذلك.",
        ),
      },
      {
        icon: "globe",
        title: L("Social media", "وسائل التواصل"),
        description: L(
          "A month of content your team can keep up.",
          "محتوى شهر كامل يستطيع فريقك مواصلته.",
        ),
      },
    ],
  },
  {
    id: "medicine",
    name: L("Medicine and health", "الطب والصحة"),
    title: L("Consultant physician", "طبيب استشاري"),
    headline: L("Care that starts by listening", "رعاية تبدأ بالاستماع"),
    intro: L(
      "Fifteen years of clinical practice. I explain every option in plain words, so you can decide.",
      "خمسة عشر عاماً من الممارسة الطبية. أشرح كل خيار بكلمات بسيطة لتتمكن من اتخاذ القرار.",
    ),
    about: L(
      "I trained in Cairo and London and now see patients four days a week. I teach junior doctors on the fifth.",
      "تدرّبت في القاهرة ولندن وأستقبل المرضى الآن أربعة أيام في الأسبوع، وأدرّس الأطباء الجدد في اليوم الخامس.",
    ),
    skills: [
      L("Diagnosis", "التشخيص"),
      L("Patient communication", "التواصل مع المرضى"),
      L("Chronic care", "رعاية الأمراض المزمنة"),
      L("Clinical research", "البحث السريري"),
      L("Team leadership", "قيادة الفريق"),
      L("Medical teaching", "التعليم الطبي"),
    ],
    services: [
      {
        icon: "heart",
        title: L("Consultations", "الاستشارات"),
        description: L(
          "In the clinic or by video, 30 minutes.",
          "في العيادة أو عبر الفيديو، لمدة 30 دقيقة.",
        ),
      },
      {
        icon: "clock",
        title: L("Follow-up plans", "خطط المتابعة"),
        description: L(
          "A written plan and reminders between visits.",
          "خطة مكتوبة وتذكيرات بين الزيارات.",
        ),
      },
      {
        icon: "book",
        title: L("Second opinions", "الرأي الثاني"),
        description: L(
          "A careful review of your reports within three days.",
          "مراجعة دقيقة لتقاريرك خلال ثلاثة أيام.",
        ),
      },
    ],
  },
  {
    id: "engineering",
    name: L("Engineering", "الهندسة"),
    title: L("Civil engineer", "مهندس مدني"),
    headline: L("Projects delivered safely, on budget", "مشاريع تُسلَّم بأمان وضمن الميزانية"),
    intro: L(
      "I manage building sites from the first drawing to handover. Twelve projects, none late.",
      "أدير مواقع البناء من أول رسم حتى التسليم. اثنا عشر مشروعاً ولم يتأخر أي منها.",
    ),
    about: L(
      "I like the part of engineering where a drawing becomes something people walk into. Safety and schedule are the two numbers I check every morning.",
      "أحب ذلك الجزء من الهندسة الذي يتحول فيه الرسم إلى مكان يدخله الناس. السلامة والجدول الزمني هما الرقمان اللذان أراجعهما كل صباح.",
    ),
    skills: [
      L("Site management", "إدارة المواقع"),
      L("Structural design", "التصميم الإنشائي"),
      "AutoCAD",
      L("Cost control", "ضبط التكاليف"),
      L("Safety standards", "معايير السلامة"),
      L("Contract management", "إدارة العقود"),
    ],
    services: [
      {
        icon: "layers",
        title: L("Design and drawings", "التصميم والرسومات"),
        description: L("Complete drawings ready for permits.", "رسومات كاملة جاهزة للتراخيص."),
      },
      {
        icon: "briefcase",
        title: L("Site supervision", "الإشراف على الموقع"),
        description: L("Weekly visits and a written report.", "زيارات أسبوعية وتقرير مكتوب."),
      },
      {
        icon: "check",
        title: L("Inspections", "الفحص والمعاينة"),
        description: L(
          "An independent check before you buy or build.",
          "فحص مستقل قبل الشراء أو البناء.",
        ),
      },
    ],
  },
  {
    id: "architecture",
    name: L("Architecture and interiors", "العمارة والتصميم الداخلي"),
    title: L("Architect", "معماري"),
    headline: L("Spaces designed around how you live", "مساحات مصممة حول طريقة حياتك"),
    intro: L(
      "Homes, offices and cafés designed for light, air and the way people really use a room.",
      "منازل ومكاتب ومقاهٍ مصممة للضوء والهواء ولطريقة استخدام الناس الحقيقية للمكان.",
    ),
    about: L(
      "I spend a day in every space before I draw it. Good buildings come from knowing where the sun is at four in the afternoon.",
      "أقضي يوماً كاملاً في كل مكان قبل أن أرسمه. المباني الجيدة تأتي من معرفة أين تكون الشمس في الرابعة عصراً.",
    ),
    skills: [
      L("Concept design", "التصميم المبدئي"),
      L("Interior design", "التصميم الداخلي"),
      L("3D visualisation", "التصور ثلاثي الأبعاد"),
      "Revit",
      L("Material selection", "اختيار المواد"),
      L("Site coordination", "تنسيق الموقع"),
    ],
    services: [
      {
        icon: "pen",
        title: L("Residential design", "تصميم المنازل"),
        description: L("From concept to construction drawings.", "من الفكرة حتى رسومات التنفيذ."),
      },
      {
        icon: "star",
        title: L("Interiors", "التصميم الداخلي"),
        description: L(
          "Furniture, lighting and finishes chosen with you.",
          "أثاث وإضاءة وتشطيبات نختارها معك.",
        ),
      },
      {
        icon: "camera",
        title: L("3D walkthroughs", "جولات ثلاثية الأبعاد"),
        description: L(
          "See your space before a single wall goes up.",
          "شاهد مكانك قبل بناء أي جدار.",
        ),
      },
    ],
  },
  {
    id: "photography",
    name: L("Photography and video", "التصوير والفيديو"),
    title: L("Photographer", "مصوّر"),
    headline: L("Pictures people stop scrolling for", "صور يتوقف الناس عندها"),
    intro: L(
      "Weddings, portraits and brand shoots in natural light. Edited and delivered within ten days.",
      "حفلات زفاف وصور شخصية وجلسات للعلامات التجارية بالإضاءة الطبيعية. تُسلَّم بعد التعديل خلال عشرة أيام.",
    ),
    about: L(
      "I picked up my father's film camera at twelve. I still shoot as if every frame costs money.",
      "أمسكت كاميرا والدي الفيلمية وأنا في الثانية عشرة. ما زلت أصوّر كأن كل لقطة تكلّف مالاً.",
    ),
    skills: [
      L("Portraits", "الصور الشخصية"),
      L("Event coverage", "تغطية المناسبات"),
      L("Product photography", "تصوير المنتجات"),
      L("Colour grading", "تصحيح الألوان"),
      "Lightroom",
      L("Video editing", "مونتاج الفيديو"),
    ],
    services: [
      {
        icon: "camera",
        title: L("Weddings and events", "الأفراح والمناسبات"),
        description: L(
          "Full-day coverage and an album of 300 photos.",
          "تغطية يوم كامل وألبوم من 300 صورة.",
        ),
      },
      {
        icon: "users",
        title: L("Portraits", "جلسات شخصية"),
        description: L(
          "A one-hour session, 20 finished pictures.",
          "جلسة لمدة ساعة و20 صورة نهائية.",
        ),
      },
      {
        icon: "briefcase",
        title: L("Brand shoots", "تصوير العلامات التجارية"),
        description: L("Product and team photos for your website.", "صور للمنتجات والفريق لموقعك."),
      },
    ],
  },
  {
    id: "education",
    name: L("Education and training", "التعليم والتدريب"),
    title: L("Teacher and trainer", "معلّم ومدرّب"),
    headline: L("Courses people actually finish", "دورات يكملها الناس فعلاً"),
    intro: L(
      "I teach maths so that students stop being afraid of it. Ten years in classrooms and online.",
      "أدرّس الرياضيات بطريقة تجعل الطلاب لا يخافون منها. عشر سنوات في الفصول وعبر الإنترنت.",
    ),
    about: L(
      "I believe every student can do hard things with the right first step. My lessons start with a question, not a rule.",
      "أؤمن بأن كل طالب يستطيع إنجاز الأمور الصعبة إذا بدأ بالخطوة الصحيحة. دروسي تبدأ بسؤال لا بقاعدة.",
    ),
    skills: [
      L("Lesson planning", "تخطيط الدروس"),
      L("Online teaching", "التدريس عبر الإنترنت"),
      L("Exam preparation", "التحضير للاختبارات"),
      L("Curriculum design", "تصميم المناهج"),
      L("Student mentoring", "إرشاد الطلاب"),
      L("Public speaking", "التحدث أمام الجمهور"),
    ],
    services: [
      {
        icon: "book",
        title: L("Private lessons", "دروس خاصة"),
        description: L("One to one, in person or online.", "فردية، حضورياً أو عبر الإنترنت."),
      },
      {
        icon: "users",
        title: L("Group courses", "دورات جماعية"),
        description: L("Eight weeks, small groups of six.", "ثمانية أسابيع ومجموعات صغيرة من ستة."),
      },
      {
        icon: "target",
        title: L("Exam coaching", "التدريب على الاختبارات"),
        description: L(
          "A plan, past papers and weekly checks.",
          "خطة ونماذج سابقة ومتابعة أسبوعية.",
        ),
      },
    ],
  },
  {
    id: "finance",
    name: L("Finance and accounting", "المالية والمحاسبة"),
    title: L("Accountant", "محاسب"),
    headline: L("Clear numbers for better decisions", "أرقام واضحة لقرارات أفضل"),
    intro: L(
      "Bookkeeping, tax and monthly reports for small businesses. You always know what you earned and what you owe.",
      "مسك دفاتر وضرائب وتقارير شهرية للشركات الصغيرة. تعرف دائماً كم ربحت وكم عليك.",
    ),
    about: L(
      "I spent eight years in audit before working with small businesses. I translate accounts into plain language for owners.",
      "قضيت ثماني سنوات في المراجعة قبل العمل مع الشركات الصغيرة. أترجم الحسابات إلى لغة بسيطة لأصحاب الأعمال.",
    ),
    skills: [
      L("Bookkeeping", "مسك الدفاتر"),
      L("Tax filing", "الإقرارات الضريبية"),
      L("Financial reports", "التقارير المالية"),
      L("Budgeting", "إعداد الموازنات"),
      L("Payroll", "الرواتب"),
      "Excel",
    ],
    services: [
      {
        icon: "chart",
        title: L("Monthly accounts", "الحسابات الشهرية"),
        description: L(
          "Books closed by the fifth of every month.",
          "إقفال الدفاتر قبل الخامس من كل شهر.",
        ),
      },
      {
        icon: "shield",
        title: L("Tax", "الضرائب"),
        description: L(
          "Filed on time, with every allowed saving.",
          "تُقدَّم في موعدها مع كل خصم مسموح.",
        ),
      },
      {
        icon: "target",
        title: L("Budgets and forecasts", "الموازنات والتوقعات"),
        description: L("A one-page plan for the year ahead.", "خطة في صفحة واحدة للسنة القادمة."),
      },
    ],
  },
  {
    id: "food",
    name: L("Food and hospitality", "المطاعم والضيافة"),
    title: L("Chef", "شيف"),
    headline: L("Food worth crossing the city for", "طعام يستحق أن تعبر المدينة من أجله"),
    intro: L(
      "Seasonal Egyptian cooking with a short menu that changes every week.",
      "طبخ مصري موسمي بقائمة قصيرة تتغير كل أسبوع.",
    ),
    about: L(
      "I learned to cook in my grandmother's kitchen in Alexandria and trained in hotel kitchens for six years. I buy from the same four farmers.",
      "تعلمت الطبخ في مطبخ جدتي بالإسكندرية وتدربت في مطابخ الفنادق ست سنوات. أشتري من المزارعين الأربعة أنفسهم.",
    ),
    skills: [
      L("Menu design", "تصميم قوائم الطعام"),
      L("Egyptian cuisine", "المطبخ المصري"),
      L("Pastry", "الحلويات"),
      L("Kitchen management", "إدارة المطبخ"),
      L("Food costing", "حساب تكلفة الأطباق"),
      L("Catering", "خدمات التموين"),
    ],
    services: [
      {
        icon: "cup",
        title: L("Private dinners", "عشاء خاص"),
        description: L(
          "A five-course dinner cooked in your home.",
          "عشاء من خمسة أطباق يُطهى في منزلك.",
        ),
      },
      {
        icon: "users",
        title: L("Catering", "التموين"),
        description: L("Events from 20 to 200 guests.", "مناسبات من 20 إلى 200 ضيف."),
      },
      {
        icon: "book",
        title: L("Menu consulting", "استشارات القوائم"),
        description: L(
          "A new menu, costed and tested with your team.",
          "قائمة جديدة محسوبة التكلفة ومجرّبة مع فريقك.",
        ),
      },
    ],
  },
];

export function getField(id: string | null): FieldPack | null {
  return FIELDS.find((f) => f.id === id) ?? null;
}
