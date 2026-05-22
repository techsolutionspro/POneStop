import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = (pw: string) => bcrypt.hashSync(pw, 10);
const PASSWORD = hash('Test1234!');

async function main() {
  console.log('Seeding marketplace data...');

  // ============================================================
  // 1. NEW PHARMACIES (add 4 more to existing 4 active ones)
  // ============================================================

  const newPharmacies = [
    {
      name: 'Greenfield Pharmacy',
      slug: 'greenfield-pharmacy',
      primaryColor: '#059669',
      gphcNumber: 'GPhC-9012345',
      companyNumber: '09876543',
      city: 'Birmingham',
      postcode: 'B1 1BB',
      address: '45 New Street, Birmingham',
      lat: 52.4862, lng: -1.8904,
      ownerFirst: 'Yasmin', ownerLast: 'Shah', ownerEmail: 'yasmin@greenfieldpharmacy.co.uk',
      deliveryRadius: 8, deliveryFee: 2.99, minOrder: 15,
      rating: 4.8, reviewCount: 127,
    },
    {
      name: 'City Health Pharmacy',
      slug: 'city-health-pharmacy',
      primaryColor: '#2563eb',
      gphcNumber: 'GPhC-3456789',
      companyNumber: '11234567',
      city: 'Leeds',
      postcode: 'LS1 5DL',
      address: '12 The Headrow, Leeds',
      lat: 53.7997, lng: -1.5491,
      ownerFirst: 'Tom', ownerLast: 'Walker', ownerEmail: 'tom@cityhealthpharmacy.co.uk',
      deliveryRadius: 10, deliveryFee: 0, minOrder: 20,
      rating: 4.6, reviewCount: 89,
    },
    {
      name: 'Rose Lane Pharmacy',
      slug: 'rose-lane-pharmacy',
      primaryColor: '#e11d48',
      gphcNumber: 'GPhC-5678901',
      companyNumber: '12345678',
      city: 'Liverpool',
      postcode: 'L1 1JQ',
      address: '78 Bold Street, Liverpool',
      lat: 53.4039, lng: -2.9779,
      ownerFirst: 'Grace', ownerLast: 'Murphy', ownerEmail: 'grace@roselanepharmacy.co.uk',
      deliveryRadius: 6, deliveryFee: 1.99, minOrder: 10,
      rating: 4.9, reviewCount: 203,
    },
    {
      name: 'Noor Pharmacy',
      slug: 'noor-pharmacy',
      primaryColor: '#7c3aed',
      gphcNumber: 'GPhC-6789012',
      companyNumber: '13456789',
      city: 'Bradford',
      postcode: 'BD1 1HJ',
      address: '34 Darley Street, Bradford',
      lat: 53.7960, lng: -1.7594,
      ownerFirst: 'Bilal', ownerLast: 'Mahmood', ownerEmail: 'bilal@noorpharmacy.co.uk',
      deliveryRadius: 12, deliveryFee: 0, minOrder: 25,
      rating: 4.7, reviewCount: 156,
    },
  ];

  const createdTenants: string[] = [];

  for (const p of newPharmacies) {
    // Skip if already exists
    const exists = await prisma.tenant.findUnique({ where: { slug: p.slug } });
    if (exists) { createdTenants.push(exists.id); continue; }

    const tenant = await prisma.tenant.create({
      data: {
        name: p.name, slug: p.slug, status: 'ACTIVE', tier: 'PROFESSIONAL',
        primaryColor: p.primaryColor, secondaryColor: '#6366f1',
        gphcNumber: p.gphcNumber, companyNumber: p.companyNumber,
        dspStatus: 'VERIFIED', dspVerifiedAt: new Date(),
        commissionRate: 10, rating: p.rating, reviewCount: p.reviewCount,
        deliveryRadius: p.deliveryRadius, deliveryFee: p.deliveryFee, minOrderAmount: p.minOrder,
        latitude: p.lat, longitude: p.lng, isMarketplaceListed: true,
      },
    });
    createdTenants.push(tenant.id);

    // Create owner
    await prisma.user.create({
      data: {
        email: p.ownerEmail, passwordHash: PASSWORD,
        firstName: p.ownerFirst, lastName: p.ownerLast,
        role: 'TENANT_OWNER', tenantId: tenant.id, emailVerified: true,
      },
    });

    // Create branch
    await prisma.branch.create({
      data: {
        tenantId: tenant.id, name: `${p.name} - Main`,
        address: p.address, city: p.city, postcode: p.postcode,
        phone: '0' + Math.floor(1000000000 + Math.random() * 9000000000).toString().slice(0, 10),
        latitude: p.lat, longitude: p.lng, isActive: true,
        openingHours: { mon: { open: '09:00', close: '18:00' }, tue: { open: '09:00', close: '18:00' }, wed: { open: '09:00', close: '18:00' }, thu: { open: '09:00', close: '18:00' }, fri: { open: '09:00', close: '17:00' }, sat: { open: '09:00', close: '13:00' }, sun: { open: null, close: null } },
      },
    });

    // Create wallet
    const earnings = Math.floor(Math.random() * 5000) + 500;
    const commission = Math.round(earnings * 0.1 * 100) / 100;
    await prisma.pharmacyWallet.create({
      data: {
        tenantId: tenant.id,
        totalEarnings: earnings,
        totalCommission: commission,
        totalPayouts: Math.floor(earnings * 0.6),
        availableBalance: Math.round((earnings - commission - Math.floor(earnings * 0.6)) * 100) / 100,
        pendingPayouts: 0,
      },
    });
  }

  // Also update existing tenants to have marketplace fields
  const existingTenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' } });
  for (const t of existingTenants) {
    if (!t.rating) {
      await prisma.tenant.update({
        where: { id: t.id },
        data: {
          rating: Math.round((4 + Math.random()) * 10) / 10,
          reviewCount: Math.floor(Math.random() * 200) + 20,
          deliveryRadius: Math.floor(Math.random() * 10) + 5,
          deliveryFee: Math.random() > 0.5 ? 0 : Math.round(Math.random() * 4 * 100) / 100,
          minOrderAmount: Math.floor(Math.random() * 20) + 5,
          isMarketplaceListed: true,
          dspStatus: 'VERIFIED',
          dspVerifiedAt: new Date(),
        },
      });
    }
    // Ensure wallet exists
    const wallet = await prisma.pharmacyWallet.findUnique({ where: { tenantId: t.id } });
    if (!wallet) {
      const e = Math.floor(Math.random() * 8000) + 1000;
      await prisma.pharmacyWallet.create({
        data: {
          tenantId: t.id,
          totalEarnings: e, totalCommission: Math.round(e * 0.1), totalPayouts: Math.floor(e * 0.5),
          availableBalance: Math.round(e * 0.4), pendingPayouts: 0,
        },
      });
    }
  }

  // ============================================================
  // 2. SERVICES / PRODUCTS for all active tenants
  // ============================================================

  const products = [
    // OTC Products
    { name: 'Hay Fever Relief (Cetirizine 10mg)', category: 'OTC', price: 4.99, description: 'One-a-day antihistamine tablets for hay fever and allergy relief. 30 tablets.', duration: null, online: true },
    { name: 'Paracetamol 500mg (32 Tablets)', category: 'OTC', price: 1.99, description: 'Pain relief and fever reduction. Suitable for adults and children over 12.', duration: null, online: true },
    { name: 'Ibuprofen 400mg (24 Tablets)', category: 'OTC', price: 2.49, description: 'Anti-inflammatory pain relief for headaches, dental pain, and period pain.', duration: null, online: true },
    { name: 'Vitamin D3 4000 IU (90 Capsules)', category: 'OTC', price: 8.99, description: 'High-strength vitamin D supplement. Supports bone health and immunity.', duration: null, online: true },
    { name: 'Omega-3 Fish Oil 1000mg (60 Capsules)', category: 'OTC', price: 6.49, description: 'Heart and brain health. High EPA & DHA. Sustainably sourced.', duration: null, online: true },
    { name: 'First Aid Kit', category: 'OTC', price: 12.99, description: 'Comprehensive first aid kit with 100 pieces. Plasters, bandages, antiseptic wipes.', duration: null, online: true },
    { name: 'Digital Thermometer', category: 'OTC', price: 7.99, description: 'Fast-read digital thermometer. Accurate to 0.1°C. Battery included.', duration: null, online: true },
    { name: 'Nicotine Patches (Step 1 - 21mg)', category: 'OTC', price: 18.99, description: '7-day supply nicotine replacement therapy. 24-hour patch for heavy smokers.', duration: null, online: true },

    // Pharmacy Medicines (P)
    { name: 'Chloramphenicol Eye Drops', category: 'PHARMACY_MEDICINE', price: 5.99, description: 'Antibiotic eye drops for bacterial conjunctivitis. 10ml bottle.', duration: null, online: true },
    { name: 'Omeprazole 10mg (28 Capsules)', category: 'PHARMACY_MEDICINE', price: 6.99, description: 'For heartburn and acid reflux. Short-term treatment.', duration: null, online: true },
    { name: 'Naproxen 250mg (24 Tablets)', category: 'PHARMACY_MEDICINE', price: 4.99, description: 'For period pain relief. Stronger than ibuprofen.', duration: null, online: true },
    { name: 'Sumatriptan 50mg (2 Tablets)', category: 'PHARMACY_MEDICINE', price: 8.99, description: 'Migraine relief tablets. Previously diagnosed migraines only.', duration: null, online: true },
    { name: 'Emergency Contraception (Levonorgestrel)', category: 'PHARMACY_MEDICINE', price: 14.99, description: 'Morning after pill. Must be taken within 72 hours. Private consultation included.', duration: 15, online: true },

    // Consultations
    { name: 'Blood Pressure Check', category: 'BASIC_CONSULTATION', price: 0, description: 'Free NHS blood pressure check. Walk-in or book an appointment.', duration: 10, online: false },
    { name: 'Flu Vaccination (Private)', category: 'BASIC_CONSULTATION', price: 14.99, description: 'Annual flu jab. Protect yourself and your family this winter.', duration: 10, online: false },
    { name: 'Travel Health Consultation', category: 'BASIC_CONSULTATION', price: 25.00, description: 'Pre-travel health assessment. Malaria tablets, vaccinations, travel kit.', duration: 20, online: false },
    { name: 'Smoking Cessation Consultation', category: 'BASIC_CONSULTATION', price: 0, description: 'Free NHS stop smoking service. NRT, Champix, and behavioural support.', duration: 30, online: false },
    { name: 'New Medicine Service (NMS)', category: 'BASIC_CONSULTATION', price: 0, description: 'Free NHS follow-up for patients starting a new medicine.', duration: 15, online: false },
    { name: 'Health Check (BMI, Blood Sugar, Cholesterol)', category: 'BASIC_CONSULTATION', price: 35.00, description: 'Comprehensive health MOT. Includes BMI, blood pressure, blood glucose, and cholesterol.', duration: 30, online: false },
    { name: 'Ear Wax Removal (Microsuction)', category: 'BASIC_CONSULTATION', price: 45.00, description: 'Professional ear wax removal using microsuction. Both ears included.', duration: 20, online: false },

    // POM Prescribing
    { name: 'Weight Management (Wegovy)', category: 'POM_PRESCRIBING', price: 189.99, description: 'Semaglutide 0.25mg-2.4mg weekly injection for weight management. BMI 30+ or 27+ with comorbidities. Includes prescriber consultation.', duration: 15, online: true },
    { name: 'Weight Management (Mounjaro)', category: 'POM_PRESCRIBING', price: 199.99, description: 'Tirzepatide weekly injection for weight management. Prescriber review included. Monthly or quarterly subscription available.', duration: 15, online: true },
    { name: 'Erectile Dysfunction (Sildenafil 50mg)', category: 'POM_PRESCRIBING', price: 19.99, description: 'Sildenafil tablets for ED. Prescriber consultation included. Discreet packaging.', duration: null, online: true },
    { name: 'Erectile Dysfunction (Tadalafil 10mg)', category: 'POM_PRESCRIBING', price: 24.99, description: 'Tadalafil for ED. Lasts up to 36 hours. Prescriber review included.', duration: null, online: true },
    { name: 'Hair Loss Treatment (Finasteride 1mg)', category: 'POM_PRESCRIBING', price: 29.99, description: '28-day supply. For male pattern hair loss. Monthly subscription available.', duration: null, online: true },
    { name: 'Acid Reflux (Lansoprazole 30mg)', category: 'POM_PRESCRIBING', price: 12.99, description: '28-day supply. For persistent acid reflux not controlled by OTC treatments.', duration: null, online: true },
  ];

  const allTenants = await prisma.tenant.findMany({ where: { status: 'ACTIVE' }, include: { branches: true } });

  for (const tenant of allTenants) {
    const branch = tenant.branches[0];
    if (!branch) continue;

    // Each pharmacy gets a random selection of 8-15 products
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.floor(Math.random() * 8) + 8);

    for (const product of selected) {
      // Check if service already exists
      const exists = await prisma.tenantService.findFirst({ where: { tenantId: tenant.id, name: product.name } });
      if (exists) continue;

      // Slight price variation per pharmacy
      const priceVariation = product.price > 0 ? product.price + (Math.random() * 4 - 2) : 0;
      const finalPrice = Math.max(0, Math.round(priceVariation * 100) / 100);

      const svc = await prisma.tenantService.create({
        data: {
          tenantId: tenant.id,
          name: product.name,
          description: product.description,
          category: product.category as any,
          price: finalPrice,
          duration: product.duration,
          capacity: 1,
          bufferTime: 5,
          fulfilmentModes: product.online ? (product.duration ? ['IN_BRANCH', 'ONLINE_DELIVERY'] : ['ONLINE_DELIVERY', 'CLICK_AND_COLLECT']) : ['IN_BRANCH'],
          isActive: true,
          isDiscreet: product.name.includes('Erectile') || product.name.includes('Contraception'),
          requiresIdv: product.category === 'POM_PRESCRIBING',
          requiresPrescriberReview: product.category === 'POM_PRESCRIBING',
          requiresQuestionnaire: product.category === 'POM_PRESCRIBING',
        },
      });

      // Create BranchService
      await prisma.branchService.create({
        data: { branchId: branch.id, serviceId: svc.id, isActive: true },
      });
    }
  }

  // ============================================================
  // 3. PATIENTS (10 test patients)
  // ============================================================

  const patients = [
    { first: 'James', last: 'Davies', email: 'james.davies@email.com', dob: '1988-05-15', postcode: 'M1 4BT', gender: 'Male' },
    { first: 'Sophie', last: 'Williams', email: 'sophie.williams@email.com', dob: '1995-08-22', postcode: 'B2 5TF', gender: 'Female' },
    { first: 'Mohammed', last: 'Ali', email: 'mohammed.ali@email.com', dob: '1992-03-10', postcode: 'LS2 7EQ', gender: 'Male' },
    { first: 'Emily', last: 'Brown', email: 'emily.brown@email.com', dob: '1990-11-30', postcode: 'L1 8JQ', gender: 'Female' },
    { first: 'Jack', last: 'Taylor', email: 'jack.taylor@email.com', dob: '1985-07-03', postcode: 'BD1 2SU', gender: 'Male' },
    { first: 'Priya', last: 'Sharma', email: 'priya.sharma@email.com', dob: '1998-01-25', postcode: 'M4 1HN', gender: 'Female' },
    { first: 'Daniel', last: 'Wilson', email: 'daniel.wilson@email.com', dob: '1982-09-18', postcode: 'LS1 4BA', gender: 'Male' },
    { first: 'Amara', last: 'Okafor', email: 'amara.okafor@email.com', dob: '1993-06-12', postcode: 'B5 4HQ', gender: 'Female' },
    { first: 'Ryan', last: 'O\'Connor', email: 'ryan.oconnor@email.com', dob: '1987-12-08', postcode: 'L3 9SJ', gender: 'Male' },
    { first: 'Zara', last: 'Khan', email: 'zara.khan@email.com', dob: '1996-04-20', postcode: 'BD5 0BQ', gender: 'Female' },
  ];

  for (const p of patients) {
    const exists = await prisma.user.findUnique({ where: { email: p.email } });
    if (exists) continue;

    // Assign to a random active tenant
    const randomTenant = allTenants[Math.floor(Math.random() * allTenants.length)];

    const user = await prisma.user.create({
      data: {
        email: p.email, passwordHash: PASSWORD,
        firstName: p.first, lastName: p.last,
        role: 'PATIENT', tenantId: randomTenant.id, emailVerified: true,
        phone: '07' + Math.floor(100000000 + Math.random() * 900000000).toString(),
      },
    });

    await prisma.patientProfile.create({
      data: {
        userId: user.id, tenantId: randomTenant.id,
        dateOfBirth: new Date(p.dob), gender: p.gender,
        postcode: p.postcode,
        address: `${Math.floor(Math.random() * 100) + 1} Test Street, ${p.postcode}`,
        idvStatus: Math.random() > 0.3 ? 'PASSED' : 'PENDING',
        idvCompletedAt: Math.random() > 0.3 ? new Date() : null,
        gpPractice: 'Test GP Practice',
        gpSharingConsent: Math.random() > 0.5,
      },
    });
  }

  // ============================================================
  // 4. ONLINE ORDERS (30 realistic orders across pharmacies)
  // ============================================================

  const statuses = ['RECEIVED', 'AWAITING_REVIEW', 'APPROVED', 'DISPENSING', 'DISPATCHED', 'DELIVERED', 'DELIVERED', 'DELIVERED'];
  const allPatients = await prisma.patientProfile.findMany({ include: { user: true } });
  const allServices = await prisma.tenantService.findMany({ where: { isActive: true, fulfilmentModes: { has: 'ONLINE_DELIVERY' } }, include: { tenant: { include: { branches: true } } } });

  let orderCount = 0;
  for (let i = 0; i < 30; i++) {
    const service = allServices[Math.floor(Math.random() * allServices.length)];
    if (!service) continue;
    const patient = allPatients[Math.floor(Math.random() * allPatients.length)];
    if (!patient) continue;
    const branch = service.tenant.branches[0];
    if (!branch) continue;

    const status = statuses[Math.floor(Math.random() * statuses.length)] as any;
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(Date.now() - daysAgo * 86400000);
    const ref = `ORD-${10000 + i + Math.floor(Math.random() * 1000)}`;

    // Check ref doesn't exist
    const refExists = await prisma.onlineOrder.findUnique({ where: { reference: ref } });
    if (refExists) continue;

    const deliveryFee = service.tenant.deliveryFee || 0;
    const total = service.price + deliveryFee;
    const commRate = service.tenant.commissionRate || 10;

    await prisma.onlineOrder.create({
      data: {
        reference: ref,
        tenantId: service.tenantId,
        branchId: branch.id,
        serviceId: service.id,
        patientId: patient.id,
        status,
        productName: service.name,
        productStrength: service.name.match(/\d+mg/) ? service.name.match(/\d+mg/)![0] : null,
        quantity: Math.floor(Math.random() * 3) + 1,
        isRepeat: Math.random() > 0.8,
        isColdChain: service.name.includes('Wegovy') || service.name.includes('Mounjaro'),
        isDiscreet: service.isDiscreet,
        questionnaireAnswers: service.requiresQuestionnaire ? { height: 175, weight: 82, bmi: 26.8, medications: 'None', allergies: 'None' } : null,
        idvPassed: service.requiresIdv ? (status !== 'RECEIVED') : false,
        consentClinical: true, consentRemote: true, consentDelivery: true,
        paymentStatus: ['DISPATCHED', 'DELIVERED'].includes(status) ? 'CAPTURED' : 'AUTHORISED',
        subtotal: service.price,
        deliveryFee,
        totalAmount: total,
        commissionAmount: Math.round(total * commRate / 100 * 100) / 100,
        commissionRate: commRate,
        platformFee: Math.round(total * commRate / 100 * 100) / 100,
        createdAt,
        slaDeadline: new Date(createdAt.getTime() + 4 * 3600000),
      },
    });
    orderCount++;
  }

  // ============================================================
  // 5. BOOKINGS (20 in-branch bookings)
  // ============================================================

  const inBranchServices = await prisma.tenantService.findMany({
    where: { isActive: true, fulfilmentModes: { has: 'IN_BRANCH' } },
    include: { tenant: { include: { branches: true } } },
  });

  let bookingCount = 0;
  for (let i = 0; i < 20; i++) {
    const service = inBranchServices[Math.floor(Math.random() * inBranchServices.length)];
    if (!service) continue;
    const patient = allPatients[Math.floor(Math.random() * allPatients.length)];
    if (!patient) continue;
    const branch = service.tenant.branches[0];
    if (!branch) continue;

    const daysFromNow = Math.floor(Math.random() * 14) - 7; // -7 to +7 days
    const date = new Date(Date.now() + daysFromNow * 86400000);
    date.setHours(0, 0, 0, 0);
    const hour = 9 + Math.floor(Math.random() * 8); // 9am - 4pm
    const ref = `BK-${20000 + i + Math.floor(Math.random() * 1000)}`;

    const refExists = await prisma.booking.findUnique({ where: { reference: ref } });
    if (refExists) continue;

    const bookingStatus = daysFromNow < 0
      ? (Math.random() > 0.2 ? 'COMPLETED' : 'NO_SHOW')
      : (Math.random() > 0.3 ? 'CONFIRMED' : 'PENDING');

    await prisma.booking.create({
      data: {
        reference: ref,
        tenantId: service.tenantId,
        branchId: branch.id,
        serviceId: service.id,
        patientId: patient.id,
        status: bookingStatus as any,
        date,
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${hour.toString().padStart(2, '0')}:${service.duration || 30}`,
        source: Math.random() > 0.3 ? 'ONLINE' : 'PHONE',
        consentGiven: true, consentAt: new Date(),
        paymentStatus: service.price > 0 ? 'CAPTURED' : null,
        paymentAmount: service.price > 0 ? service.price : null,
        notes: null,
      },
    });
    bookingCount++;
  }

  // ============================================================
  // 6. ADS (Sponsored listings)
  // ============================================================

  const adTenants = allTenants.slice(0, 4);
  for (const t of adTenants) {
    const exists = await prisma.ad.findFirst({ where: { tenantId: t.id } });
    if (exists) continue;

    await prisma.ad.create({
      data: {
        tenantId: t.id,
        title: `${t.name} — Featured Listing`,
        description: `Get your pharmacy products delivered from ${t.name}. Fast, reliable, trusted.`,
        budget: 100,
        spent: Math.round(Math.random() * 50 * 100) / 100,
        cpc: 0.50,
        status: 'ACTIVE',
        impressions: Math.floor(Math.random() * 5000) + 500,
        clicks: Math.floor(Math.random() * 200) + 20,
        conversions: Math.floor(Math.random() * 30) + 5,
        startDate: new Date(Date.now() - 14 * 86400000),
        endDate: new Date(Date.now() + 30 * 86400000),
      },
    });
  }

  // ============================================================
  // 7. PACKAGES (if not already set)
  // ============================================================

  const pkgCount = await prisma.package.count();
  if (pkgCount === 0) {
    await prisma.package.createMany({
      data: [
        {
          tier: 'EARLY_BIRD', name: 'Early Bird', description: 'First 100 pharmacies — best value',
          price: 50, annualPrice: 480, isPopular: false, isActive: true, sortOrder: 0,
          maxBranches: 1, maxPgds: 999, maxStaff: 10, ctaText: 'Claim Your Spot',
          onlineOrdering: true, customDomain: false, videoConsults: false, marketingTools: false,
          consultationFee: 0.50, dispatchFee: 1.50, smsFee: 0.05, paymentUplift: 0.5,
          features: ['1 branch', 'Marketplace listing', 'Online ordering', 'Commission tracking', 'Weekly payouts', 'Email support'],
        },
        {
          tier: 'STARTER', name: 'Starter', description: 'For pharmacies getting started',
          price: 99, annualPrice: 948, isPopular: false, isActive: true, sortOrder: 1,
          maxBranches: 1, maxPgds: 999, maxStaff: 10, ctaText: 'Start Free Trial',
          onlineOrdering: true, customDomain: false, videoConsults: false, marketingTools: false,
          consultationFee: 0.50, dispatchFee: 1.50, smsFee: 0.05, paymentUplift: 0.5,
          features: ['1 branch', 'Template website', 'Up to 20 services', 'Booking engine + payments', 'SMS & email reminders', 'Commission tracking'],
        },
        {
          tier: 'PROFESSIONAL', name: 'Professional', description: 'Full platform with online ordering',
          price: 199, annualPrice: 1908, isPopular: true, isActive: true, sortOrder: 2,
          maxBranches: 3, maxPgds: 999, maxStaff: 50, ctaText: 'Start Free Trial',
          onlineOrdering: true, customDomain: true, customMailbox: true, videoConsults: false, marketingTools: true,
          consultationFee: 0.30, dispatchFee: 1.00, smsFee: 0.04, paymentUplift: 0.3,
          features: ['Up to 3 branches', 'Full service library', 'Online ordering + delivery', 'Custom domain + mailbox', 'Marketing tools + reports', 'Priority support'],
        },
        {
          tier: 'ENTERPRISE', name: 'Enterprise', description: 'For pharmacy groups',
          price: 399, annualPrice: 3828, isPopular: false, isActive: true, sortOrder: 3,
          maxBranches: 999, maxPgds: 999, maxStaff: 999, ctaText: 'Book a Demo',
          onlineOrdering: true, customDomain: true, customMailbox: true, videoConsults: true, marketingTools: true, apiAccess: true, dedicatedSupport: true, groupManagement: true, customWebsite: true,
          consultationFee: 0.20, dispatchFee: 0.75, smsFee: 0.03, paymentUplift: 0.2,
          features: ['Unlimited branches', 'Custom website design', 'Video consultations', 'Group benchmarking', 'API access', 'Dedicated account manager'],
        },
      ],
    });
  }

  console.log(`\nSeed complete!`);
  console.log(`  Pharmacies: ${allTenants.length} active`);
  console.log(`  Products/Services: ${allServices.length}+ listed`);
  console.log(`  Patients: ${allPatients.length}`);
  console.log(`  Orders: ${orderCount} new`);
  console.log(`  Bookings: ${bookingCount} new`);
  console.log(`\n============================================`);
  console.log(`TEST LOGINS (Password for all: Test1234!)`);
  console.log(`============================================`);
  console.log(`\nPLATFORM ADMIN:`);
  console.log(`  admin@pharmacyonestop.co.uk / SuperAdmin1!`);
  console.log(`  support@pharmacyonestop.co.uk / Support1!`);
  console.log(`\nPHARMACY OWNERS:`);
  console.log(`  owner@wellnesspharmacy.co.uk / Owner123!`);
  console.log(`  owner@medicarepharmacy.co.uk / Owner123!`);
  console.log(`  owner@quickscript.co.uk / Owner123!`);
  console.log(`  amir@highstreetpharmacy.co.uk / Owner123!`);
  console.log(`  yasmin@greenfieldpharmacy.co.uk / Test1234!`);
  console.log(`  tom@cityhealthpharmacy.co.uk / Test1234!`);
  console.log(`  grace@roselanepharmacy.co.uk / Test1234!`);
  console.log(`  bilal@noorpharmacy.co.uk / Test1234!`);
  console.log(`\nPRESCRIBERS:`);
  console.log(`  prescriber@quickscript.co.uk / Pharma123!`);
  console.log(`  sarah.chen@highstreetpharmacy.co.uk / Pharma123!`);
  console.log(`\nPATIENTS (all use password: Test1234!):`);
  console.log(`  james.davies@email.com`);
  console.log(`  sophie.williams@email.com`);
  console.log(`  mohammed.ali@email.com`);
  console.log(`  emily.brown@email.com`);
  console.log(`  jack.taylor@email.com`);
  console.log(`  priya.sharma@email.com`);
  console.log(`  daniel.wilson@email.com`);
  console.log(`  amara.okafor@email.com`);
  console.log(`  ryan.oconnor@email.com`);
  console.log(`  zara.khan@email.com`);
  console.log(`\n============================================\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
