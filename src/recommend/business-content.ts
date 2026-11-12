import type { LocalizedText } from "@/render-kit/schema/primitives";

const L = (en: string, ar: string) => ({ en, ar });

type Item = { title: LocalizedText; description: LocalizedText };
type Question = { question: LocalizedText; answer: LocalizedText };

/** Sample text for the company sections, so a business page in a field reads like that field. */
export type BusinessPack = {
  steps: Item[];
  faq: Question[];
  caseStudy: {
    heading: LocalizedText;
    summary: LocalizedText;
    client: LocalizedText;
    role: LocalizedText;
    challenge: LocalizedText;
    solution: LocalizedText;
    result: LocalizedText;
    stats: { value: string; label: LocalizedText }[];
  };
};

export const BUSINESS: Record<string, BusinessPack> = {
  software: {
    steps: [
      {
        title: L("A free first call", "مكالمة أولى مجانية"),
        description: L(
          "We talk through what you need and what it should cost.",
          "نتحدث عمّا تحتاجه وكم يجب أن يكلّف.",
        ),
      },
      {
        title: L("A written plan", "خطة مكتوبة"),
        description: L(
          "Screens, timeline and a fixed price within a week.",
          "الشاشات والمدة وسعر ثابت خلال أسبوع.",
        ),
      },
      {
        title: L("Build in two-week steps", "بناء على مراحل كل أسبوعين"),
        description: L("You try a working version every two weeks.", "تجرّب نسخة تعمل كل أسبوعين."),
      },
      {
        title: L("Launch and support", "الإطلاق والدعم"),
        description: L(
          "We stay on call for three months after launch.",
          "نبقى متاحين ثلاثة أشهر بعد الإطلاق.",
        ),
      },
    ],
    faq: [
      {
        question: L("Who owns the code?", "لمن تعود ملكية الشيفرة؟"),
        answer: L("You do, from the first day.", "لك أنت، من اليوم الأول."),
      },
      {
        question: L("Can you take over an existing app?", "هل يمكنكم استلام تطبيق قائم؟"),
        answer: L(
          "Yes. We start with a one-week review and a written report.",
          "نعم. نبدأ بمراجعة لمدة أسبوع وتقرير مكتوب.",
        ),
      },
      {
        question: L("How do you charge?", "كيف تحسبون التكلفة؟"),
        answer: L(
          "A fixed price per phase, agreed before work starts.",
          "سعر ثابت لكل مرحلة يُتفق عليه قبل البدء.",
        ),
      },
    ],
    caseStudy: {
      heading: L("Ordering app for a bakery chain", "تطبيق طلبات لسلسلة مخابز"),
      summary: L(
        "How eight branches moved phone orders into one app.",
        "كيف نقلت ثمانية فروع طلبات الهاتف إلى تطبيق واحد.",
      ),
      client: L("Nour Bakeries", "مخابز نور"),
      role: L("Design and development", "التصميم والتطوير"),
      challenge: L(
        "Orders came by phone and WhatsApp, and one in ten was written down wrong.",
        "كانت الطلبات تأتي بالهاتف وواتساب، وكان طلب من كل عشرة يُكتب خطأً.",
      ),
      solution: L(
        "A web and mobile app with one order screen for every branch.",
        "تطبيق ويب وهاتف بشاشة طلبات واحدة لكل الفروع.",
      ),
      result: L(
        "Wrong orders fell below 1% and online sales doubled in six months.",
        "انخفضت الطلبات الخاطئة إلى أقل من 1% وتضاعفت المبيعات أونلاين خلال ستة أشهر.",
      ),
      stats: [
        { value: "2x", label: L("online sales", "المبيعات أونلاين") },
        { value: "<1%", label: L("wrong orders", "طلبات خاطئة") },
      ],
    },
  },
  design: {
    steps: [
      {
        title: L("Listen", "الاستماع"),
        description: L("We interview your customers and your team.", "نقابل عملاءك وفريقك."),
      },
      {
        title: L("Sketch", "الرسم الأولي"),
        description: L(
          "Rough ideas on paper you can react to in days.",
          "أفكار أولية على الورق تراها خلال أيام.",
        ),
      },
      {
        title: L("Design and test", "التصميم والاختبار"),
        description: L(
          "Clickable screens tested with five real users.",
          "شاشات قابلة للنقر نختبرها مع خمسة مستخدمين حقيقيين.",
        ),
      },
      {
        title: L("Hand over", "التسليم"),
        description: L(
          "Files and notes your developers can build from.",
          "ملفات وملاحظات يبني منها المطورون مباشرة.",
        ),
      },
    ],
    faq: [
      {
        question: L("Which tools do you use?", "ما الأدوات التي تستخدمونها؟"),
        answer: L(
          "Figma, and you get full access to every file.",
          "فيجما، وتحصل على وصول كامل لكل الملفات.",
        ),
      },
      {
        question: L("Do you work with our developers?", "هل تعملون مع مطورينا؟"),
        answer: L(
          "Yes. We join their weekly meeting until launch.",
          "نعم. ننضم لاجتماعهم الأسبوعي حتى الإطلاق.",
        ),
      },
      {
        question: L("How many revisions are included?", "كم عدد التعديلات المشمولة؟"),
        answer: L(
          "Two full rounds per screen, and small fixes any time.",
          "جولتان كاملتان لكل شاشة، وتعديلات صغيرة في أي وقت.",
        ),
      },
    ],
    caseStudy: {
      heading: L("A clearer banking app", "تطبيق بنكي أوضح"),
      summary: L(
        "Making transfers easy for first-time users.",
        "جعل التحويلات سهلة للمستخدمين الجدد.",
      ),
      client: L("Masr Pay", "مصر باي"),
      role: L("Research and product design", "البحث وتصميم المنتج"),
      challenge: L(
        "Four in ten new users gave up on their first transfer.",
        "أربعة من كل عشرة مستخدمين جدد تركوا أول تحويل.",
      ),
      solution: L(
        "A three-step transfer with plain words and saved contacts.",
        "تحويل من ثلاث خطوات بكلمات بسيطة وجهات اتصال محفوظة.",
      ),
      result: L(
        "First transfers completed rose from 60% to 91%.",
        "ارتفعت نسبة إتمام أول تحويل من 60% إلى 91%.",
      ),
      stats: [
        { value: "91%", label: L("first transfers completed", "إتمام أول تحويل") },
        { value: "3", label: L("steps, down from 7", "خطوات بدلاً من 7") },
      ],
    },
  },
  marketing: {
    steps: [
      {
        title: L("Audit", "التدقيق"),
        description: L(
          "We look at your ads, pages and numbers.",
          "نراجع إعلاناتك وصفحاتك وأرقامك.",
        ),
      },
      {
        title: L("Plan", "الخطة"),
        description: L(
          "A 90-day plan with a budget and clear targets.",
          "خطة لمدة 90 يوماً بميزانية وأهداف واضحة.",
        ),
      },
      {
        title: L("Run", "التنفيذ"),
        description: L("Campaigns, content and weekly tests.", "حملات ومحتوى واختبارات أسبوعية."),
      },
      {
        title: L("Report", "التقرير"),
        description: L(
          "One page every month: what worked and what is next.",
          "صفحة واحدة شهرياً: ما نجح وما التالي.",
        ),
      },
    ],
    faq: [
      {
        question: L("What is the minimum ad budget?", "ما أقل ميزانية للإعلانات؟"),
        answer: L(
          "We suggest at least EGP 15,000 a month for results you can measure.",
          "نقترح 15,000 جنيه شهرياً على الأقل لنتائج يمكن قياسها.",
        ),
      },
      {
        question: L("Do you sign long contracts?", "هل توقّعون عقوداً طويلة؟"),
        answer: L(
          "No. Three months to start, then month to month.",
          "لا. ثلاثة أشهر للبداية ثم شهراً بشهر.",
        ),
      },
      {
        question: L("Who owns the ad accounts?", "لمن تعود حسابات الإعلانات؟"),
        answer: L("You do. We work inside your accounts.", "لك أنت. نعمل داخل حساباتك."),
      },
    ],
    caseStudy: {
      heading: L("Half the cost per customer", "نصف تكلفة العميل"),
      summary: L(
        "A skincare brand that stopped buying followers.",
        "علامة عناية بالبشرة توقفت عن شراء المتابعين.",
      ),
      client: L("Zahra Skincare", "زهرة للعناية بالبشرة"),
      role: L("Strategy and paid ads", "الاستراتيجية والإعلانات الممولة"),
      challenge: L(
        "Each new customer cost EGP 420 and most never came back.",
        "كان كل عميل جديد يكلّف 420 جنيهاً وأغلبهم لا يعود.",
      ),
      solution: L(
        "Fewer ads, real customer videos and a refill reminder by SMS.",
        "إعلانات أقل وفيديوهات من عملاء حقيقيين وتذكير بإعادة الطلب برسالة.",
      ),
      result: L(
        "Cost per customer fell to EGP 190 and repeat orders tripled.",
        "انخفضت تكلفة العميل إلى 190 جنيهاً وتضاعفت الطلبات المتكررة ثلاث مرات.",
      ),
      stats: [
        { value: "-55%", label: L("cost per customer", "تكلفة العميل") },
        { value: "3x", label: L("repeat orders", "الطلبات المتكررة") },
      ],
    },
  },
  medicine: {
    steps: [
      {
        title: L("Book online", "احجز أونلاين"),
        description: L(
          "Pick a time that suits you, day or evening.",
          "اختر الوقت المناسب لك صباحاً أو مساءً.",
        ),
      },
      {
        title: L("First visit", "الزيارة الأولى"),
        description: L(
          "A full check and an unhurried conversation.",
          "فحص كامل وحديث دون استعجال.",
        ),
      },
      {
        title: L("Your plan", "خطتك العلاجية"),
        description: L(
          "A written plan with costs before any treatment.",
          "خطة مكتوبة بالتكلفة قبل أي علاج.",
        ),
      },
      {
        title: L("Follow-up", "المتابعة"),
        description: L(
          "We check in by phone after every visit.",
          "نتابع معك بالهاتف بعد كل زيارة.",
        ),
      },
    ],
    faq: [
      {
        question: L("Do you accept insurance?", "هل تقبلون التأمين الصحي؟"),
        answer: L(
          "Yes, most major insurers. Call us to check yours.",
          "نعم، أغلب شركات التأمين الكبرى. اتصل بنا للتأكد.",
        ),
      },
      {
        question: L("Can I come without booking?", "هل يمكنني الحضور دون حجز؟"),
        answer: L(
          "Yes, but booked patients are seen first.",
          "نعم، لكن الأولوية للمرضى أصحاب الحجز.",
        ),
      },
      {
        question: L("Do you offer home visits?", "هل تقدمون زيارات منزلية؟"),
        answer: L("For older patients, inside the city.", "لكبار السن داخل المدينة."),
      },
    ],
    caseStudy: {
      heading: L("Shorter waits at a busy clinic", "انتظار أقصر في عيادة مزدحمة"),
      summary: L(
        "How a family clinic cut waiting time in half.",
        "كيف خفّضت عيادة عائلية وقت الانتظار إلى النصف.",
      ),
      client: L("Al Amal Family Clinic", "عيادة الأمل العائلية"),
      role: L("Clinic setup and patient care", "تنظيم العيادة ورعاية المرضى"),
      challenge: L(
        "Patients waited over an hour, and many left without being seen.",
        "كان المرضى ينتظرون أكثر من ساعة، ويغادر كثيرون دون كشف.",
      ),
      solution: L(
        "Timed bookings, a reminder message and a nurse for first checks.",
        "حجوزات بمواعيد محددة ورسالة تذكير وممرضة للفحص الأولي.",
      ),
      result: L(
        "Average waiting time fell from 70 to 25 minutes.",
        "انخفض متوسط الانتظار من 70 إلى 25 دقيقة.",
      ),
      stats: [
        { value: "25 min", label: L("average wait", "متوسط الانتظار") },
        { value: "4.8", label: L("patient rating", "تقييم المرضى") },
      ],
    },
  },
  engineering: {
    steps: [
      {
        title: L("Site visit", "زيارة الموقع"),
        description: L(
          "We measure, test and listen to your needs.",
          "نقيس ونختبر ونستمع لاحتياجاتك.",
        ),
      },
      {
        title: L("Design and estimate", "التصميم والتقدير"),
        description: L("Drawings and a priced list of works.", "رسومات وجدول أعمال بالأسعار."),
      },
      {
        title: L("Build", "التنفيذ"),
        description: L(
          "A site engineer on every job, every day.",
          "مهندس موقع في كل مشروع، كل يوم.",
        ),
      },
      {
        title: L("Hand over", "التسليم"),
        description: L(
          "Tests, as-built drawings and a one-year warranty.",
          "اختبارات ورسومات تنفيذية وضمان لمدة سنة.",
        ),
      },
    ],
    faq: [
      {
        question: L("Do you handle permits?", "هل تتولون استخراج التصاريح؟"),
        answer: L("Yes, we prepare and follow every permit.", "نعم، نجهّز ونتابع كل التصاريح."),
      },
      {
        question: L("What if the project runs late?", "ماذا لو تأخر المشروع؟"),
        answer: L(
          "Our contracts include a penalty for every late week.",
          "عقودنا تتضمن غرامة عن كل أسبوع تأخير.",
        ),
      },
      {
        question: L("Do you work outside Cairo?", "هل تعملون خارج القاهرة؟"),
        answer: L("Yes, anywhere in Egypt.", "نعم، في أي مكان في مصر."),
      },
    ],
    caseStudy: {
      heading: L("A factory extension on schedule", "توسعة مصنع في موعدها"),
      summary: L(
        "2,000 square metres built while the factory kept running.",
        "2,000 متر مربع بُنيت والمصنع يعمل.",
      ),
      client: L("Delta Plastics", "دلتا للبلاستيك"),
      role: L("Structural design and site supervision", "التصميم الإنشائي والإشراف على التنفيذ"),
      challenge: L(
        "The new hall had to be built without stopping production.",
        "كان يجب بناء العنبر الجديد دون إيقاف الإنتاج.",
      ),
      solution: L(
        "A steel frame made off site and night work for the connections.",
        "هيكل معدني مصنّع خارج الموقع وعمل ليلي للتوصيلات.",
      ),
      result: L(
        "Finished in seven months, two weeks early, with zero lost-time injuries.",
        "انتهى في سبعة أشهر، قبل الموعد بأسبوعين، دون إصابات عمل.",
      ),
      stats: [
        { value: "7", label: L("months to finish", "أشهر للتنفيذ") },
        { value: "0", label: L("lost-time injuries", "إصابات عمل") },
      ],
    },
  },
  architecture: {
    steps: [
      {
        title: L("Brief", "الاحتياجات"),
        description: L("How you live or work, and the budget.", "طريقة حياتك أو عملك والميزانية."),
      },
      {
        title: L("Concept", "الفكرة"),
        description: L(
          "Two or three ideas with sketches and a model.",
          "فكرتان أو ثلاث برسومات ومجسم.",
        ),
      },
      {
        title: L("Drawings", "الرسومات"),
        description: L(
          "Full drawings for permits and contractors.",
          "رسومات كاملة للتصاريح والمقاولين.",
        ),
      },
      {
        title: L("On site", "في الموقع"),
        description: L(
          "Visits every week until the keys are yours.",
          "زيارات أسبوعية حتى تستلم المفاتيح.",
        ),
      },
    ],
    faq: [
      {
        question: L("How are your fees set?", "كيف تُحدَّد أتعابكم؟"),
        answer: L(
          "A share of the building cost, agreed in writing.",
          "نسبة من تكلفة البناء يُتفق عليها كتابياً.",
        ),
      },
      {
        question: L("Do you do interiors?", "هل تصممون الديكور الداخلي؟"),
        answer: L("Yes, as part of the project or on its own.", "نعم، ضمن المشروع أو بشكل منفصل."),
      },
      {
        question: L("Can you work with my contractor?", "هل تعملون مع مقاولي؟"),
        answer: L("Yes. We supervise any contractor you choose.", "نعم. نشرف على أي مقاول تختاره."),
      },
    ],
    caseStudy: {
      heading: L("A cool house without heavy AC", "بيت بارد دون تكييف مكثف"),
      summary: L(
        "A family home in Fayoum designed for the heat.",
        "بيت عائلي في الفيوم مصمم لمواجهة الحر.",
      ),
      client: L("The Saleh family", "عائلة صالح"),
      role: L("Architecture and interiors", "التصميم المعماري والداخلي"),
      challenge: L(
        "Summer days reach 42°C and electricity bills were rising.",
        "تصل الحرارة صيفاً إلى 42 درجة وفواتير الكهرباء تزيد.",
      ),
      solution: L(
        "Thick walls, a shaded courtyard and windows that pull air through.",
        "جدران سميكة وفناء مظلل ونوافذ تسحب الهواء.",
      ),
      result: L(
        "Indoor rooms stay 8°C cooler and the power bill fell by 40%.",
        "الغرف أبرد بـ8 درجات وانخفضت فاتورة الكهرباء 40%.",
      ),
      stats: [
        { value: "-8°C", label: L("indoors in summer", "داخل البيت صيفاً") },
        { value: "-40%", label: L("power bill", "فاتورة الكهرباء") },
      ],
    },
  },
  photography: {
    steps: [
      {
        title: L("Tell us the day", "أخبرنا بالموعد"),
        description: L(
          "Date, place and the kind of photos you want.",
          "التاريخ والمكان ونوع الصور التي تريدها.",
        ),
      },
      {
        title: L("Plan the shoot", "تخطيط التصوير"),
        description: L(
          "A short shot list and timing for the day.",
          "قائمة لقطات قصيرة وتوقيت لليوم.",
        ),
      },
      {
        title: L("The shoot", "التصوير"),
        description: L(
          "We work quietly so people stay natural.",
          "نعمل بهدوء ليبقى الناس على طبيعتهم.",
        ),
      },
      {
        title: L("Your gallery", "معرض صورك"),
        description: L("Edited photos online within two weeks.", "صور معدّلة أونلاين خلال أسبوعين."),
      },
    ],
    faq: [
      {
        question: L("How many photos will I get?", "كم صورة سأستلم؟"),
        answer: L(
          "Around 60 edited photos for every hour of shooting.",
          "حوالي 60 صورة معدّلة لكل ساعة تصوير.",
        ),
      },
      {
        question: L("Do you travel?", "هل تسافرون للتصوير؟"),
        answer: L(
          "Yes. Travel outside the city is added at cost.",
          "نعم. تُضاف تكلفة السفر خارج المدينة.",
        ),
      },
      {
        question: L("Can I get the raw files?", "هل يمكنني الحصول على الملفات الخام؟"),
        answer: L(
          "We deliver edited photos only, in full size.",
          "نسلّم الصور المعدّلة فقط وبالحجم الكامل.",
        ),
      },
    ],
    caseStudy: {
      heading: L("A new menu, photographed", "قائمة جديدة مصوّرة"),
      summary: L(
        "Food photos that sold the dishes before people tasted them.",
        "صور طعام باعت الأطباق قبل أن يتذوقها الناس.",
      ),
      client: L("Bait El Kebda", "بيت الكبدة"),
      role: L("Food photography", "تصوير الطعام"),
      challenge: L(
        "Delivery app photos were dark phone shots and sales were flat.",
        "كانت صور تطبيق التوصيل مظلمة من الهاتف والمبيعات ثابتة.",
      ),
      solution: L(
        "One day in the kitchen, 40 dishes in daylight, styled simply.",
        "يوم واحد في المطبخ، 40 طبقاً في ضوء النهار بتنسيق بسيط.",
      ),
      result: L(
        "Delivery orders rose by 35% in the next month.",
        "زادت طلبات التوصيل 35% في الشهر التالي.",
      ),
      stats: [
        { value: "40", label: L("dishes in one day", "طبقاً في يوم واحد") },
        { value: "+35%", label: L("delivery orders", "طلبات التوصيل") },
      ],
    },
  },
  education: {
    steps: [
      {
        title: L("Free placement test", "اختبار تحديد مستوى مجاني"),
        description: L(
          "Twenty minutes to find the right level.",
          "عشرون دقيقة لمعرفة المستوى المناسب.",
        ),
      },
      {
        title: L("Choose a group", "اختر مجموعة"),
        description: L("Small classes, morning or evening.", "فصول صغيرة صباحاً أو مساءً."),
      },
      {
        title: L("Learn and practise", "تعلّم وتدرّب"),
        description: L(
          "Lessons, homework and feedback every week.",
          "دروس وواجبات وملاحظات كل أسبوع.",
        ),
      },
      {
        title: L("Get your certificate", "احصل على شهادتك"),
        description: L(
          "A final test and a certificate at the end.",
          "اختبار نهائي وشهادة في النهاية.",
        ),
      },
    ],
    faq: [
      {
        question: L("How big are the classes?", "كم عدد الطلاب في الفصل؟"),
        answer: L("Eight students at most.", "ثمانية طلاب كحد أقصى."),
      },
      {
        question: L("Are lessons online?", "هل الدروس أونلاين؟"),
        answer: L("Both. Every class has an online option.", "الاثنان. لكل فصل خيار أونلاين."),
      },
      {
        question: L("What if I miss a lesson?", "ماذا لو فاتني درس؟"),
        answer: L("Every lesson is recorded for you.", "كل درس مسجّل لك."),
      },
    ],
    caseStudy: {
      heading: L("Better exam results in one term", "نتائج أفضل في فصل دراسي واحد"),
      summary: L(
        "A school that changed how maths is taught in year 9.",
        "مدرسة غيّرت طريقة تدريس الرياضيات للصف الثالث الإعدادي.",
      ),
      client: L("Green Valley School", "مدرسة الوادي الأخضر"),
      role: L("Curriculum and teacher training", "المناهج وتدريب المعلمين"),
      challenge: L(
        "Only half the students passed the term maths exam.",
        "نصف الطلاب فقط نجحوا في امتحان الرياضيات.",
      ),
      solution: L(
        "Short weekly quizzes, small groups and help sessions after school.",
        "اختبارات أسبوعية قصيرة ومجموعات صغيرة وحصص دعم بعد المدرسة.",
      ),
      result: L(
        "The pass rate rose to 84% in one term.",
        "ارتفعت نسبة النجاح إلى 84% في فصل واحد.",
      ),
      stats: [
        { value: "84%", label: L("pass rate", "نسبة النجاح") },
        { value: "12", label: L("teachers trained", "معلماً مدرَّباً") },
      ],
    },
  },
  finance: {
    steps: [
      {
        title: L("First meeting", "الاجتماع الأول"),
        description: L("We look at your books and your goals.", "نراجع دفاترك وأهدافك."),
      },
      {
        title: L("Clean up", "التنظيم"),
        description: L("Accounts brought up to date and checked.", "تحديث الحسابات ومراجعتها."),
      },
      {
        title: L("Monthly work", "العمل الشهري"),
        description: L(
          "Bookkeeping, payroll and tax filings.",
          "مسك الدفاتر والرواتب والإقرارات الضريبية.",
        ),
      },
      {
        title: L("Monthly report", "التقرير الشهري"),
        description: L(
          "Profit, cash and what to watch, on one page.",
          "الربح والسيولة وما يجب الانتباه له في صفحة واحدة.",
        ),
      },
    ],
    faq: [
      {
        question: L("Do you file VAT returns?", "هل تقدّمون إقرارات ضريبة القيمة المضافة؟"),
        answer: L("Yes, every month, on time.", "نعم، كل شهر في موعدها."),
      },
      {
        question: L("Which software do you use?", "ما البرنامج المحاسبي الذي تستخدمونه؟"),
        answer: L("We work in yours, or set one up for you.", "نعمل على برنامجك أو نجهّز لك واحداً."),
      },
      {
        question: L("Is my data safe?", "هل بياناتي آمنة؟"),
        answer: L(
          "Files are kept encrypted and shared only with you.",
          "تُحفظ الملفات مشفرة ولا يطّلع عليها غيرك.",
        ),
      },
    ],
    caseStudy: {
      heading: L("From late filings to clear numbers", "من إقرارات متأخرة إلى أرقام واضحة"),
      summary: L(
        "An online shop that finally knew its real profit.",
        "متجر إلكتروني عرف ربحه الحقيقي أخيراً.",
      ),
      client: L("Lamsa Home", "لمسة هوم"),
      role: L("Accounting and tax", "المحاسبة والضرائب"),
      challenge: L(
        "Two years of unfiled returns and no idea which products made money.",
        "سنتان من الإقرارات غير المقدمة ولا معرفة بالمنتجات الرابحة.",
      ),
      solution: L(
        "Books rebuilt, penalties settled and a monthly profit report by product.",
        "إعادة بناء الدفاتر وتسوية الغرامات وتقرير ربح شهري لكل منتج.",
      ),
      result: L(
        "All filings current in three months and margins up 9 points.",
        "كل الإقرارات محدّثة خلال ثلاثة أشهر وهامش الربح زاد 9 نقاط.",
      ),
      stats: [
        { value: "3", label: L("months to catch up", "أشهر للانتظام") },
        { value: "+9", label: L("points of margin", "نقاط في هامش الربح") },
      ],
    },
  },
  food: {
    steps: [
      {
        title: L("Tell us the occasion", "أخبرنا بالمناسبة"),
        description: L(
          "Date, guests and any dietary needs.",
          "التاريخ وعدد الضيوف وأي احتياجات غذائية.",
        ),
      },
      {
        title: L("Tasting", "التذوق"),
        description: L("Try the menu before you decide.", "جرّب القائمة قبل أن تقرر."),
      },
      {
        title: L("We cook", "نطبخ"),
        description: L(
          "Fresh on the day, served by our team.",
          "طازج في اليوم نفسه ويقدّمه فريقنا.",
        ),
      },
      {
        title: L("We clean up", "نرتّب بعدها"),
        description: L(
          "You enjoy the evening; we leave the kitchen clean.",
          "استمتع بالأمسية ونترك المطبخ نظيفاً.",
        ),
      },
    ],
    faq: [
      {
        question: L("How early should I book?", "متى يجب أن أحجز؟"),
        answer: L("Two weeks ahead, or a month for weddings.", "قبلها بأسبوعين، أو شهر للأفراح."),
      },
      {
        question: L("Can you cook vegetarian?", "هل تطبخون أكلاً نباتياً؟"),
        answer: L("Yes, and gluten-free on request.", "نعم، وخالٍ من الجلوتين عند الطلب."),
      },
      {
        question: L("Is service included?", "هل الخدمة مشمولة؟"),
        answer: L(
          "Yes, waiters are included for groups over 20.",
          "نعم، يشمل السعر النُّدُل للمجموعات فوق 20 فرداً.",
        ),
      },
    ],
    caseStudy: {
      heading: L("A new menu for a busy café", "قائمة جديدة لمقهى مزدحم"),
      summary: L("Fewer dishes, faster service, better profit.", "أطباق أقل وخدمة أسرع وربح أفضل."),
      client: L("Café Riad", "كافيه رياض"),
      role: L("Menu design and kitchen training", "تصميم القائمة وتدريب المطبخ"),
      challenge: L(
        "A 60-item menu, long waits and a lot of wasted food.",
        "قائمة من 60 صنفاً وانتظار طويل وهدر كبير في الطعام.",
      ),
      solution: L(
        "A 22-item menu built on shared ingredients, costed dish by dish.",
        "قائمة من 22 صنفاً بمكونات مشتركة ومحسوبة التكلفة طبقاً طبقاً.",
      ),
      result: L(
        "Orders out in 9 minutes instead of 20, and waste cut by a third.",
        "تخرج الطلبات في 9 دقائق بدلاً من 20، وقلّ الهدر بمقدار الثلث.",
      ),
      stats: [
        { value: "9 min", label: L("per order", "لكل طلب") },
        { value: "-33%", label: L("food waste", "هدر الطعام") },
      ],
    },
  },
};

export function getBusiness(id: string | null): BusinessPack | null {
  return (id && BUSINESS[id]) || null;
}
