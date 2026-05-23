import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CITIES = ['ירושלים', 'גבעת זאב', 'בית שמש', 'מודיעין', 'תל אביב', 'רמת גן', 'חיפה', 'באר שבע'];
const PROJECT_TYPES = ['בניה חדשה', 'תוספת בניה', 'שיפוץ כללי', 'שיפוץ מטבח', 'שיפוץ אמבטיה', 'פרגולה', 'מרפסת'];
const SOURCES = ['אתר', 'פייסבוק', 'אינסטגרם', 'המלצה', 'גוגל', 'טלפוני'];
const UNITS = ['מ"ר', 'יח\'', 'מ"א', 'יום עבודה', 'קומפלט'];
const PAYMENT_METHODS = ['מזומן', 'העברה בנקאית', 'אשראי', 'צ\'ק', 'ביט'];
const PIPELINE_STAGES = [
  { name: 'התעניינות', color: '#94a3b8' },
  { name: 'ביקור באתר', color: '#60a5fa' },
  { name: 'הצעה', color: '#fbbf24' },
  { name: 'משא ומתן', color: '#fb923c' },
  { name: 'חתימה', color: '#a78bfa' },
  { name: 'סגירה', color: '#34d399' },
];

const CHECKLIST_TEMPLATES = [
  {
    projectType: 'שיפוץ אמבטיה',
    name: 'צ\'ק-ליסט שיפוץ אמבטיה',
    items: ['פירוק קיים', 'אינסטלציה', 'איטום', 'ניקוז', 'ריצוף', 'חיפוי קירות', 'התקנת סניטריה', 'גמר וניקיון'],
  },
  {
    projectType: 'שיפוץ מטבח',
    name: 'צ\'ק-ליסט שיפוץ מטבח',
    items: ['פירוק קיים', 'נקודות חשמל', 'אינסטלציה', 'ריצוף', 'התקנת ארונות', 'התקנת משטח', 'חיבור מכשירים'],
  },
  {
    projectType: 'בניה חדשה',
    name: 'צ\'ק-ליסט בניה חדשה',
    items: ['חפירה ויסודות', 'שלד', 'גג', 'אינסטלציה', 'חשמל', 'טיח', 'ריצוף', 'גמרים', 'מסירה'],
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Company settings
  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'בנייני אבן בע"מ',
      businessId: '514999888',
      address: 'רחוב הבנאים 12, ירושלים',
      phone: '02-1234567',
      email: 'info@binyaney-even.co.il',
      vatRate: 18,
      quoteStartNumber: 1,
    },
  });

  // Admin user
  const adminHash = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.local' },
    update: {},
    create: { name: 'מנהל מערכת', email: 'admin@crm.local', passwordHash: adminHash, role: 'ADMIN' },
  });

  // A sales user
  const salesHash = await bcrypt.hash('Sales123!', 12);
  const sales = await prisma.user.upsert({
    where: { email: 'sales@crm.local' },
    update: {},
    create: { name: 'ליאור כהן', email: 'sales@crm.local', passwordHash: salesHash, role: 'SALES' },
  });

  // Dropdown lists
  const lists: { listType: string; values: string[] }[] = [
    { listType: 'city', values: CITIES },
    { listType: 'projectType', values: PROJECT_TYPES },
    { listType: 'leadSource', values: SOURCES },
    { listType: 'unit', values: UNITS },
    { listType: 'paymentMethod', values: PAYMENT_METHODS },
    { listType: 'taskType', values: ['משימה', 'פגישה', 'שיחת טלפון', 'ביקור באתר', 'תזכורת'] },
    { listType: 'expenseCategory', values: ['חומרי גלם', 'שכר עבודה', 'ציוד', 'רישוי', 'הובלות', 'אחר'] },
    { listType: 'documentCategory', values: ['חוזה', 'תוכנית', 'היתר', 'תמונה', 'אחר'] },
  ];
  const existingLists = await prisma.settingsListItem.count();
  if (existingLists === 0) {
    for (const { listType, values } of lists) {
      await prisma.settingsListItem.createMany({
        data: values.map((value, order) => ({ listType, value, order })),
      });
    }
  }

  // Pipeline stages
  if ((await prisma.pipelineStage.count()) === 0) {
    for (let i = 0; i < PIPELINE_STAGES.length; i++) {
      await prisma.pipelineStage.create({ data: { ...PIPELINE_STAGES[i], order: i } });
    }
  }

  // Checklist templates
  if ((await prisma.checklistTemplate.count()) === 0) {
    for (const t of CHECKLIST_TEMPLATES) {
      await prisma.checklistTemplate.create({
        data: { projectType: t.projectType, name: t.name, itemsJson: JSON.stringify(t.items) },
      });
    }
  }

  // Tags
  if ((await prisma.tag.count()) === 0) {
    await prisma.tag.createMany({
      data: [
        { name: 'VIP', color: '#f59e0b', entityType: 'contact' },
        { name: 'דחוף', color: '#ef4444', entityType: 'contact' },
        { name: 'ממליץ', color: '#10b981', entityType: 'contact' },
        { name: 'בעייתי', color: '#6b7280', entityType: 'contact' },
      ],
    });
  }

  // Sample contacts
  if ((await prisma.contact.count()) === 0) {
    const sampleContacts = [
      { fullName: 'דוד לוי', phone: '0541234567', city: 'ירושלים', projectType: 'שיפוץ כללי', budget: 250000, leadType: 'HOT', status: 'LEAD', source: 'המלצה' },
      { fullName: 'שרה כהן', phone: '0529876543', city: 'בית שמש', projectType: 'שיפוץ מטבח', budget: 80000, leadType: 'NEW', status: 'LEAD', source: 'פייסבוק' },
      { fullName: 'משה פרידמן', phone: '0501112233', city: 'מודיעין', projectType: 'תוספת בניה', budget: 450000, leadType: 'HOT', status: 'CUSTOMER', source: 'אתר' },
      { fullName: 'רחל אברהם', phone: '0537778899', city: 'גבעת זאב', projectType: 'שיפוץ אמבטיה', budget: 45000, leadType: 'COLD', status: 'LEAD', source: 'גוגל' },
      { fullName: 'יוסי מזרחי', phone: '0544445566', city: 'תל אביב', projectType: 'פרגולה', budget: 30000, leadType: 'NEW', status: 'LEAD', source: 'אינסטגרם' },
      { fullName: 'מרים גולן', phone: '0526667788', city: 'רמת גן', projectType: 'בניה חדשה', budget: 1200000, leadType: 'HOT', status: 'CUSTOMER', source: 'המלצה' },
      { fullName: 'אבי שטרן', phone: '0509990011', city: 'חיפה', projectType: 'שיפוץ כללי', budget: 180000, leadType: 'NEW', status: 'LEAD', source: 'אתר' },
      { fullName: 'נעמה דהן', phone: '0532223344', city: 'באר שבע', projectType: 'מרפסת', budget: 25000, leadType: 'COLD', status: 'LEAD', source: 'טלפוני' },
      { fullName: 'חיים ביטון', phone: '0545556677', city: 'ירושלים', projectType: 'תוספת בניה', budget: 380000, leadType: 'HOT', status: 'CUSTOMER', source: 'פייסבוק' },
      { fullName: 'אסתר וייס', phone: '0528889900', city: 'בית שמש', projectType: 'שיפוץ מטבח', budget: 95000, leadType: 'NEW', status: 'LEAD', source: 'המלצה' },
    ];
    for (const c of sampleContacts) {
      await prisma.contact.create({
        data: { ...c, assignedToId: Math.random() > 0.5 ? sales.id : admin.id },
      });
    }
  }

  // Sample projects (linked to customers)
  if ((await prisma.project.count()) === 0) {
    const customers = await prisma.contact.findMany({ where: { status: 'CUSTOMER' }, take: 3 });
    const projData = [
      { name: 'תוספת קומה - משפ׳ פרידמן', status: 'IN_PROGRESS', budget: 450000, progress: 40 },
      { name: 'בניית בית פרטי - משפ׳ גולן', status: 'PLANNING', budget: 1200000, progress: 10 },
      { name: 'תוספת בניה - משפ׳ ביטון', status: 'APPROVED', budget: 380000, progress: 0 },
    ];
    for (let i = 0; i < customers.length && i < projData.length; i++) {
      await prisma.project.create({
        data: {
          ...projData[i],
          contactId: customers[i].id,
          city: customers[i].city,
          projectType: customers[i].projectType,
          managerId: admin.id,
          startDatePlanned: new Date(),
        },
      });
    }
  }

  // Sample quotes
  if ((await prisma.quote.count()) === 0) {
    const customers = await prisma.contact.findMany({ where: { status: 'CUSTOMER' }, take: 2 });
    const year = new Date().getFullYear();
    let seq = 1;
    for (const c of customers) {
      const items = [
        { section: 'פירוק והכנה', description: 'פירוק קיים ופינוי פסולת', quantity: 1, unit: 'קומפלט', unitPrice: 8000 },
        { section: 'שלד', description: 'יציקת בטון מזוין', quantity: 25, unit: 'מ"ר', unitPrice: 1200 },
        { section: 'גמרים', description: 'טיח וצבע', quantity: 120, unit: 'מ"ר', unitPrice: 90 },
      ];
      const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
      const vatAmount = Math.round(subtotal * 0.18);
      await prisma.quote.create({
        data: {
          quoteNumber: `QT-${year}-${String(seq++).padStart(3, '0')}`,
          contactId: c.id,
          status: 'SENT',
          vatRate: 18,
          subtotal,
          vatAmount,
          total: subtotal + vatAmount,
          validUntil: new Date(Date.now() + 30 * 86400000),
          items: { create: items.map((it, idx) => ({ ...it, total: it.quantity * it.unitPrice, order: idx })) },
        },
      });
    }
  }

  // Price catalog
  if ((await prisma.priceCatalogItem.count()) === 0) {
    await prisma.priceCatalogItem.createMany({
      data: [
        { name: 'מ"ר בלוקים', unit: 'מ"ר', defaultPrice: 180, category: 'שלד' },
        { name: 'מ"ר טיח', unit: 'מ"ר', defaultPrice: 90, category: 'גמרים' },
        { name: 'נקודת חשמל', unit: 'יח\'', defaultPrice: 250, category: 'חשמל' },
        { name: 'מ"ר ריצוף', unit: 'מ"ר', defaultPrice: 220, category: 'גמרים' },
        { name: 'יציקת בטון', unit: 'מ"ק', defaultPrice: 950, category: 'שלד' },
      ],
    });
  }

  console.log('✅ Seed complete.');
  console.log('   Admin:  admin@crm.local / Admin123!');
  console.log('   Sales:  sales@crm.local / Sales123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
