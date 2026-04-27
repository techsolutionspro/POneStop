import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const hash = (pw: string) => bcrypt.hashSync(pw, 12);

async function main() {
  console.log('Seeding database...\n');

  // ============================================================
  // PLATFORM USERS
  // ============================================================
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@pharmacyonestop.co.uk' },
    update: {},
    create: { email: 'admin@pharmacyonestop.co.uk', passwordHash: hash('SuperAdmin1!'), firstName: 'Hamza', lastName: 'Admin', role: 'SUPER_ADMIN', emailVerified: true },
  });
  await prisma.user.upsert({
    where: { email: 'support@pharmacyonestop.co.uk' },
    update: {},
    create: { email: 'support@pharmacyonestop.co.uk', passwordHash: hash('Support1!'), firstName: 'Sarah', lastName: 'Support', role: 'SUPPORT_AGENT', emailVerified: true },
  });

  // ============================================================
  // PGDs (for PGD-based pharmacies)
  // ============================================================
  const pgdWeightMgmt = await prisma.pgd.upsert({
    where: { id: 'pgd-weight-mgmt' },
    update: {},
    create: {
      id: 'pgd-weight-mgmt', title: 'Weight Management', version: 'v3.2', status: 'PUBLISHED',
      therapyArea: 'Weight Management', indication: 'Obesity (BMI >= 30) or overweight (BMI >= 27) with comorbidities',
      inclusionCriteria: ['BMI >= 30', 'Age 18+'], exclusionCriteria: ['Pregnancy', 'Type 1 diabetes', 'MTC history'],
      redFlags: ['Suicidal ideation', 'Severe abdominal pain'], doseRegimen: { startDose: '0.25mg weekly' },
      authorisedProducts: [{ name: 'Wegovy', strengths: ['0.25mg','0.5mg','1mg','1.7mg','2.4mg'], coldChain: true }, { name: 'Mounjaro', strengths: ['2.5mg','5mg','7.5mg'], coldChain: true }],
      fulfilmentModes: ['IN_BRANCH', 'ONLINE_DELIVERY'], authorId: superAdmin.id, clinicalLeadId: superAdmin.id, publishedAt: new Date(), reviewDate: new Date('2026-09-15'),
    },
  });
  const pgdTravel = await prisma.pgd.upsert({
    where: { id: 'pgd-travel-health' },
    update: {},
    create: {
      id: 'pgd-travel-health', title: 'Travel Health - Vaccinations', version: 'v2.1', status: 'PUBLISHED',
      therapyArea: 'Travel Health', indication: 'Pre-travel vaccination and antimalarial prophylaxis',
      inclusionCriteria: ['Travelling to endemic areas'], exclusionCriteria: ['Severe egg allergy (some vaccines)'],
      redFlags: ['Severe allergic reaction'], doseRegimen: { schedule: 'Per NaTHNaC guidelines' },
      authorisedProducts: [{ name: 'Hepatitis A Vaccine', coldChain: true }, { name: 'Doxycycline 100mg' }, { name: 'Malarone' }],
      fulfilmentModes: ['IN_BRANCH'], authorId: superAdmin.id, clinicalLeadId: superAdmin.id, publishedAt: new Date(), reviewDate: new Date('2026-12-01'),
    },
  });
  const pgdFlu = await prisma.pgd.upsert({
    where: { id: 'pgd-flu-vaccine' },
    update: {},
    create: {
      id: 'pgd-flu-vaccine', title: 'Seasonal Influenza Vaccination', version: 'v4.0', status: 'PUBLISHED',
      therapyArea: 'Seasonal Vaccination', indication: 'Annual flu vaccination',
      inclusionCriteria: ['Age 18+'], exclusionCriteria: ['Previous anaphylaxis to flu vaccine'],
      redFlags: ['Anaphylaxis'], doseRegimen: { dose: 'Single 0.5ml IM injection' },
      authorisedProducts: [{ name: 'Quadrivalent Influenza Vaccine', coldChain: true }],
      fulfilmentModes: ['IN_BRANCH'], authorId: superAdmin.id, clinicalLeadId: superAdmin.id, publishedAt: new Date(),
    },
  });
  const pgdSexualHealth = await prisma.pgd.upsert({
    where: { id: 'pgd-sexual-health' },
    update: {},
    create: {
      id: 'pgd-sexual-health', title: 'Sexual Health - Chlamydia Treatment', version: 'v2.0', status: 'PUBLISHED',
      therapyArea: 'Sexual Health', indication: 'Uncomplicated genital chlamydia',
      inclusionCriteria: ['Age 16+', 'Positive test or contact tracing'], exclusionCriteria: ['Pregnancy', 'Allergy to macrolides'],
      redFlags: ['PID symptoms'], doseRegimen: { primary: 'Doxycycline 100mg BD 7 days' },
      authorisedProducts: [{ name: 'Doxycycline 100mg' }, { name: 'Azithromycin 500mg' }],
      fulfilmentModes: ['IN_BRANCH', 'ONLINE_DELIVERY'], authorId: superAdmin.id, clinicalLeadId: superAdmin.id, publishedAt: new Date(),
    },
  });
  const pgdSkincare = await prisma.pgd.upsert({
    where: { id: 'pgd-skincare' },
    update: {},
    create: {
      id: 'pgd-skincare', title: 'Skincare - Acne Treatment', version: 'v1.5', status: 'PUBLISHED',
      therapyArea: 'Skincare', indication: 'Mild to moderate acne vulgaris',
      inclusionCriteria: ['Age 16+', 'Failed OTC'], exclusionCriteria: ['Pregnancy (retinoids)'],
      redFlags: ['Severe scarring'], doseRegimen: { dose: 'Apply thin layer once daily at night' },
      authorisedProducts: [{ name: 'Tretinoin 0.025%' }, { name: 'Adapalene 0.1%' }],
      fulfilmentModes: ['ONLINE_DELIVERY'], authorId: superAdmin.id, clinicalLeadId: superAdmin.id, publishedAt: new Date(),
    },
  });

  console.log('Created 5 PGDs');

  // ============================================================
  // PHARMACY 1: BASIC SITE (Starter — just website + booking)
  // ============================================================
  console.log('\n--- Pharmacy 1: Basic Site (Starter) ---');
  const t1 = await prisma.tenant.create({
    data: {
      name: 'Wellness Pharmacy', slug: 'wellness-pharmacy', status: 'ACTIVE', tier: 'STARTER',
      primaryColor: '#3b82f6', secondaryColor: '#8b5cf6', gphcNumber: '1111111',
      subdomain: 'wellness-pharmacy', onboardingStep: 7, goLiveAt: new Date(),
    },
  });
  const owner1 = await prisma.user.create({
    data: { email: 'owner@wellnesspharmacy.co.uk', passwordHash: hash('Owner123!'), firstName: 'Emma', lastName: 'Clark', role: 'TENANT_OWNER', tenantId: t1.id, emailVerified: true },
  });
  const branch1 = await prisma.branch.create({
    data: { tenantId: t1.id, name: 'Wellness Pharmacy', address: '45 Park Lane', city: 'Birmingham', postcode: 'B1 2AA', phone: '0121 456 7890' },
  });
  // Basic services — no PGD, just consultations and health checks
  await prisma.tenantService.createMany({
    data: [
      { tenantId: t1.id, category: 'BASIC_CONSULTATION', name: 'General Health Check', description: 'A 20-minute health check including blood pressure, BMI, and lifestyle advice.', price: 25, duration: 20, fulfilmentModes: ['IN_BRANCH'], requiresQuestionnaire: false, requiresIdv: false },
      { tenantId: t1.id, category: 'BASIC_CONSULTATION', name: 'Blood Pressure Check', description: 'Quick blood pressure measurement and advice.', price: 5, duration: 10, fulfilmentModes: ['IN_BRANCH'], requiresQuestionnaire: false, requiresIdv: false },
      { tenantId: t1.id, category: 'BASIC_CONSULTATION', name: 'Flu Vaccination', description: 'Seasonal flu jab. Walk-in or book online.', price: 14.99, duration: 10, capacity: 4, fulfilmentModes: ['IN_BRANCH'], pgdId: pgdFlu.id, requiresQuestionnaire: true, requiresIdv: false },
    ],
  });
  console.log(`  ${t1.name}: ${owner1.email} / Owner123!`);
  console.log('  Services: Health Check, BP Check, Flu Jab');
  console.log('  Type: Basic site — bookings only, no online sales');

  // ============================================================
  // PHARMACY 2: OTC + P MEDICINES (Professional — sells online)
  // ============================================================
  console.log('\n--- Pharmacy 2: OTC + P Medicines (Professional) ---');
  const t2 = await prisma.tenant.create({
    data: {
      name: 'MediCare Pharmacy', slug: 'medicare-pharmacy', status: 'ACTIVE', tier: 'PROFESSIONAL',
      primaryColor: '#059669', secondaryColor: '#0d9488', gphcNumber: '2222222',
      subdomain: 'medicare-pharmacy', onboardingStep: 7, goLiveAt: new Date(),
    },
  });
  const owner2 = await prisma.user.create({
    data: { email: 'owner@medicarepharmacy.co.uk', passwordHash: hash('Owner123!'), firstName: 'Raj', lastName: 'Patel', role: 'TENANT_OWNER', tenantId: t2.id, emailVerified: true },
  });
  const branch2 = await prisma.branch.create({
    data: { tenantId: t2.id, name: 'MediCare Central', address: '12 Queen Street', city: 'Leeds', postcode: 'LS1 3AA', phone: '0113 789 0123' },
  });
  await prisma.tenantService.createMany({
    data: [
      { tenantId: t2.id, category: 'OTC', name: 'Hay Fever Relief Pack', description: 'Cetirizine 30 tablets + nasal spray + eye drops bundle.', price: 8.99, fulfilmentModes: ['IN_BRANCH', 'ONLINE_DELIVERY', 'CLICK_AND_COLLECT'], requiresQuestionnaire: false, requiresIdv: false },
      { tenantId: t2.id, category: 'OTC', name: 'Pain Relief Bundle', description: 'Ibuprofen 400mg x 24 + Paracetamol 500mg x 32. General pain relief.', price: 5.99, fulfilmentModes: ['IN_BRANCH', 'ONLINE_DELIVERY'], requiresQuestionnaire: false, requiresIdv: false },
      { tenantId: t2.id, category: 'OTC', name: 'Cold & Flu Kit', description: 'Lemsip sachets, throat lozenges, nasal decongestant.', price: 12.99, fulfilmentModes: ['IN_BRANCH', 'ONLINE_DELIVERY'], requiresQuestionnaire: false, requiresIdv: false },
      { tenantId: t2.id, category: 'PHARMACY_MEDICINE', name: 'Emergency Contraception (Levonelle)', description: 'Emergency hormonal contraception. Requires pharmacist consultation.', price: 24.99, fulfilmentModes: ['IN_BRANCH'], requiresQuestionnaire: true, requiresIdv: false, isDiscreet: true },
      { tenantId: t2.id, category: 'PHARMACY_MEDICINE', name: 'Chloramphenicol Eye Drops', description: 'For bacterial conjunctivitis. Pharmacy medicine — pharmacist must approve.', price: 7.49, fulfilmentModes: ['IN_BRANCH', 'CLICK_AND_COLLECT'], requiresQuestionnaire: true, requiresIdv: false },
      { tenantId: t2.id, category: 'PHARMACY_MEDICINE', name: 'Omeprazole 20mg (14 tablets)', description: 'For short-term heartburn/acid reflux. Pharmacy medicine.', price: 9.99, fulfilmentModes: ['IN_BRANCH', 'ONLINE_DELIVERY'], requiresQuestionnaire: true, requiresIdv: false },
      { tenantId: t2.id, category: 'BASIC_CONSULTATION', name: 'Flu Vaccination', description: 'Seasonal flu jab.', price: 14.99, duration: 10, fulfilmentModes: ['IN_BRANCH'], pgdId: pgdFlu.id, requiresQuestionnaire: true, requiresIdv: false },
    ],
  });
  console.log(`  ${t2.name}: ${owner2.email} / Owner123!`);
  console.log('  Services: Hay Fever, Pain Relief, Cold Kit (OTC) + Emergency Contraception, Eye Drops, Omeprazole (P)');
  console.log('  Type: OTC + P medicines — online sales, no prescriber needed');

  // ============================================================
  // PHARMACY 3: POM PRESCRIBING (Professional + DSP — full online)
  // ============================================================
  console.log('\n--- Pharmacy 3: POM Prescribing (Professional + DSP) ---');
  const t3 = await prisma.tenant.create({
    data: {
      name: 'QuickScript Pharmacy', slug: 'quickscript-pharmacy', status: 'ACTIVE', tier: 'PROFESSIONAL',
      primaryColor: '#7c3aed', secondaryColor: '#6366f1', gphcNumber: '3333333',
      dspStatus: 'VERIFIED', dspNumber: 'DSP-3333333', dspVerifiedAt: new Date(), dspNextReviewDate: new Date('2027-01-01'),
      subdomain: 'quickscript-pharmacy', onboardingStep: 7, goLiveAt: new Date(),
    },
  });
  const owner3 = await prisma.user.create({
    data: { email: 'owner@quickscript.co.uk', passwordHash: hash('Owner123!'), firstName: 'David', lastName: 'Ahmed', role: 'TENANT_OWNER', tenantId: t3.id, emailVerified: true },
  });
  const prescriber3 = await prisma.user.create({
    data: {
      email: 'prescriber@quickscript.co.uk', passwordHash: hash('Pharma123!'), firstName: 'Dr. Nadia', lastName: 'Hussain',
      role: 'PRESCRIBER', tenantId: t3.id, emailVerified: true,
      staffProfile: { create: { gphcNumber: '3087654', prescribingCategory: 'Independent Prescriber' } },
    },
  });
  const branch3 = await prisma.branch.create({
    data: { tenantId: t3.id, name: 'QuickScript HQ', address: '88 Victoria Road', city: 'Manchester', postcode: 'M3 5BB', phone: '0161 555 8888' },
  });
  await prisma.user.update({ where: { id: prescriber3.id }, data: { staffProfile: { update: { branchId: branch3.id } } } });
  await prisma.tenantService.createMany({
    data: [
      { tenantId: t3.id, category: 'POM_PRESCRIBING', name: 'Erectile Dysfunction Treatment', description: 'Sildenafil or Tadalafil prescribed by our independent prescriber after online consultation.', price: 29.99, fulfilmentModes: ['ONLINE_DELIVERY'], requiresQuestionnaire: true, requiresIdv: true, requiresPrescriberReview: true, isDiscreet: true },
      { tenantId: t3.id, category: 'POM_PRESCRIBING', name: 'Hair Loss Treatment (Finasteride)', description: 'Finasteride 1mg daily — requires prescriber review.', price: 24.99, fulfilmentModes: ['ONLINE_DELIVERY'], requiresQuestionnaire: true, requiresIdv: true, requiresPrescriberReview: true },
      { tenantId: t3.id, category: 'POM_PRESCRIBING', name: 'Acid Reflux (Lansoprazole 30mg)', description: 'POM-strength acid reflux treatment. 28-day supply.', price: 12.99, fulfilmentModes: ['ONLINE_DELIVERY', 'CLICK_AND_COLLECT'], requiresQuestionnaire: true, requiresIdv: true, requiresPrescriberReview: true },
      { tenantId: t3.id, category: 'POM_PRESCRIBING', name: 'Migraine Treatment (Sumatriptan)', description: 'Prescription triptan for acute migraine relief.', price: 19.99, fulfilmentModes: ['ONLINE_DELIVERY'], requiresQuestionnaire: true, requiresIdv: true, requiresPrescriberReview: true },
      { tenantId: t3.id, category: 'OTC', name: 'Migraine Relief OTC Pack', description: 'Ibuprofen + anti-nausea + cold compress.', price: 9.99, fulfilmentModes: ['ONLINE_DELIVERY'], requiresQuestionnaire: false, requiresIdv: false },
    ],
  });
  console.log(`  ${t3.name}: ${owner3.email} / Owner123!`);
  console.log(`  Prescriber: ${prescriber3.email} / Pharma123!`);
  console.log('  Services: ED, Hair Loss, Acid Reflux, Migraine (POM) + OTC packs');
  console.log('  Type: POM prescribing — online ordering, IDV, prescriber review, DSP verified');

  // ============================================================
  // PHARMACY 4: PGD CLINICAL SERVICES (Enterprise — full platform)
  // ============================================================
  console.log('\n--- Pharmacy 4: PGD Clinical Services (Enterprise) ---');
  const t4 = await prisma.tenant.create({
    data: {
      name: 'High Street Pharmacy', slug: 'high-street-pharmacy', status: 'ACTIVE', tier: 'ENTERPRISE',
      primaryColor: '#0d9488', secondaryColor: '#6366f1', gphcNumber: '4444444',
      dspStatus: 'VERIFIED', dspNumber: 'DSP-4444444', dspVerifiedAt: new Date(), dspNextReviewDate: new Date('2026-10-24'),
      subdomain: 'high-street-pharmacy', onboardingStep: 7, goLiveAt: new Date('2026-03-01'),
    },
  });
  const owner4 = await prisma.user.create({
    data: { email: 'amir@highstreetpharmacy.co.uk', passwordHash: hash('Owner123!'), firstName: 'Amir', lastName: 'Hussain', role: 'TENANT_OWNER', tenantId: t4.id, emailVerified: true },
  });
  const pharmacist4 = await prisma.user.create({
    data: {
      email: 'sarah.chen@highstreetpharmacy.co.uk', passwordHash: hash('Pharma123!'), firstName: 'Sarah', lastName: 'Chen',
      role: 'PRESCRIBER', tenantId: t4.id, emailVerified: true,
      staffProfile: { create: { gphcNumber: '4087654', prescribingCategory: 'Independent Prescriber' } },
    },
  });
  const branch4 = await prisma.branch.create({
    data: { tenantId: t4.id, name: 'Manchester Central', address: '123 High Street', city: 'Manchester', postcode: 'M1 1AA', phone: '0161 123 4567', email: 'info@highstreetpharmacy.co.uk',
      openingHours: { mon: { open: '09:00', close: '18:00' }, tue: { open: '09:00', close: '18:00' }, wed: { open: '09:00', close: '18:00' }, thu: { open: '09:00', close: '18:00' }, fri: { open: '09:00', close: '18:00' }, sat: { open: '09:00', close: '14:00' } },
    },
  });
  await prisma.branch.create({
    data: { tenantId: t4.id, name: 'Salford Branch', address: '56 Chapel Street', city: 'Salford', postcode: 'M3 6EP', phone: '0161 987 6543' },
  });
  await prisma.user.update({ where: { id: pharmacist4.id }, data: { staffProfile: { update: { branchId: branch4.id } } } });

  // Full PGD clinical services
  await prisma.tenantService.createMany({
    data: [
      { tenantId: t4.id, category: 'POM_PGD', pgdId: pgdWeightMgmt.id, name: 'Weight Management Clinic', description: 'Clinically-proven GLP-1 treatments including Wegovy and Mounjaro with ongoing pharmacist support.', price: 199, depositAmount: 50, duration: 30, fulfilmentModes: ['IN_BRANCH', 'ONLINE_DELIVERY'], requiresQuestionnaire: true, requiresIdv: true },
      { tenantId: t4.id, category: 'POM_PGD', pgdId: pgdTravel.id, name: 'Travel Health Clinic', description: 'Vaccinations, antimalarials, and travel health advice for your destination.', price: 35, duration: 20, fulfilmentModes: ['IN_BRANCH'], requiresQuestionnaire: true, requiresIdv: false },
      { tenantId: t4.id, category: 'POM_PGD', pgdId: pgdFlu.id, name: 'Flu Vaccination', description: 'Seasonal flu jab. Walk-in or book your preferred time.', price: 14.99, duration: 10, capacity: 4, fulfilmentModes: ['IN_BRANCH'], requiresQuestionnaire: true, requiresIdv: false },
      { tenantId: t4.id, category: 'POM_PGD', pgdId: pgdSexualHealth.id, name: 'Sexual Health Clinic', description: 'Discreet consultations and treatments. Fully confidential.', price: 29, fulfilmentModes: ['IN_BRANCH', 'ONLINE_DELIVERY'], requiresQuestionnaire: true, requiresIdv: true, isDiscreet: true },
      { tenantId: t4.id, category: 'POM_PGD', pgdId: pgdSkincare.id, name: 'Prescription Skincare', description: 'Tretinoin and adapalene for acne and anti-ageing. Clinician-reviewed.', price: 39, fulfilmentModes: ['ONLINE_DELIVERY'], requiresQuestionnaire: true, requiresIdv: true },
      { tenantId: t4.id, category: 'OTC', name: 'Weight Loss Support Pack', description: 'Protein shakes, meal replacement bars, and diet guide — no prescription needed.', price: 29.99, fulfilmentModes: ['IN_BRANCH', 'ONLINE_DELIVERY'], requiresQuestionnaire: false, requiresIdv: false },
      { tenantId: t4.id, category: 'BASIC_CONSULTATION', name: 'Health Check', description: 'Blood pressure, BMI, cholesterol check with pharmacist advice.', price: 25, duration: 20, fulfilmentModes: ['IN_BRANCH'], requiresQuestionnaire: false, requiresIdv: false },
    ],
  });

  // Sample patient
  const patient = await prisma.user.create({
    data: {
      email: 'james.davies@email.com', passwordHash: hash('Patient123!'), firstName: 'James', lastName: 'Davies',
      role: 'PATIENT', tenantId: t4.id, emailVerified: true,
      patientProfile: {
        create: {
          tenantId: t4.id, dateOfBirth: new Date('1990-03-15'), gender: 'Male',
          address: '45 Oak Avenue', city: 'Manchester', postcode: 'M20 3BG',
          idvStatus: 'PASSED', idvProvider: 'Onfido', idvCompletedAt: new Date(),
          idvExpiresAt: new Date(Date.now() + 365 * 86400000), idvDocumentType: 'UK Driving Licence',
        },
      },
    },
  });

  console.log(`  ${t4.name}: ${owner4.email} / Owner123!`);
  console.log(`  Prescriber: ${pharmacist4.email} / Pharma123!`);
  console.log(`  Patient: ${patient.email} / Patient123!`);
  console.log('  Services: Weight Mgmt, Travel, Flu, Sexual Health, Skincare (PGD) + OTC + Health Check');
  console.log('  Type: Full PGD clinical services — enterprise, 2 branches, DSP verified');

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n=== SEED COMPLETE ===\n');
  console.log('PLATFORM ACCOUNTS:');
  console.log('  Super Admin:   admin@pharmacyonestop.co.uk / SuperAdmin1!');
  console.log('  Support Agent: support@pharmacyonestop.co.uk / Support1!');
  console.log('');
  console.log('PHARMACY 1 — BASIC SITE (Starter):');
  console.log('  Owner:  owner@wellnesspharmacy.co.uk / Owner123!');
  console.log('  URL:    wellness-pharmacy.pharmacyonestop.co.uk');
  console.log('  Offers: Health checks, BP check, flu jab (bookings only, no online sales)');
  console.log('');
  console.log('PHARMACY 2 — OTC + P MEDICINES (Professional):');
  console.log('  Owner:  owner@medicarepharmacy.co.uk / Owner123!');
  console.log('  URL:    medicare-pharmacy.pharmacyonestop.co.uk');
  console.log('  Offers: Hay Fever, Pain Relief, Cold Kit (OTC) + Contraception, Eye Drops, Omeprazole (P meds)');
  console.log('');
  console.log('PHARMACY 3 — POM PRESCRIBING (Professional + DSP):');
  console.log('  Owner:      owner@quickscript.co.uk / Owner123!');
  console.log('  Prescriber: prescriber@quickscript.co.uk / Pharma123!');
  console.log('  URL:        quickscript-pharmacy.pharmacyonestop.co.uk');
  console.log('  Offers: ED, Hair Loss, Acid Reflux, Migraine (POM — requires IDV + prescriber review)');
  console.log('');
  console.log('PHARMACY 4 — PGD CLINICAL SERVICES (Enterprise):');
  console.log('  Owner:      amir@highstreetpharmacy.co.uk / Owner123!');
  console.log('  Prescriber: sarah.chen@highstreetpharmacy.co.uk / Pharma123!');
  console.log('  Patient:    james.davies@email.com / Patient123!');
  console.log('  URL:        high-street-pharmacy.pharmacyonestop.co.uk');
  console.log('  Offers: Weight Mgmt, Travel, Flu, Sexual Health, Skincare (PGD) + OTC + Health Checks');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
