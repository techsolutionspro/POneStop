import { PrismaClient, UserRole, PgdStatus, SubscriptionTier } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ============================================================
  // 1. SUPER ADMIN + SUPPORT AGENT
  // ============================================================
  const superAdminHash = await bcrypt.hash('SuperAdmin1!', 12);
  const supportHash = await bcrypt.hash('Support1!', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@pharmacyonestop.co.uk' },
    update: {},
    create: {
      email: 'admin@pharmacyonestop.co.uk',
      passwordHash: superAdminHash,
      firstName: 'Hamza',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      emailVerified: true,
      isActive: true,
    },
  });

  const supportAgent = await prisma.user.upsert({
    where: { email: 'support@pharmacyonestop.co.uk' },
    update: {},
    create: {
      email: 'support@pharmacyonestop.co.uk',
      passwordHash: supportHash,
      firstName: 'Sarah',
      lastName: 'Support',
      role: 'SUPPORT_AGENT',
      emailVerified: true,
      isActive: true,
    },
  });

  console.log('Created platform users:', superAdmin.email, supportAgent.email);

  // ============================================================
  // 2. SAMPLE PGDs
  // ============================================================
  const pgds = await Promise.all([
    prisma.pgd.upsert({
      where: { id: 'pgd-weight-mgmt' },
      update: {},
      create: {
        id: 'pgd-weight-mgmt',
        title: 'Weight Management',
        version: 'v3.2',
        status: 'PUBLISHED',
        therapyArea: 'Weight Management',
        indication: 'Obesity (BMI >= 30) or overweight (BMI >= 27) with comorbidities',
        inclusionCriteria: ['BMI >= 30', 'BMI >= 27 with comorbidities', 'Age 18+', 'Committed to lifestyle changes'],
        exclusionCriteria: ['Pregnancy or breastfeeding', 'Type 1 diabetes', 'MTC or MEN 2 history', 'Pancreatitis history', 'Severe renal impairment'],
        redFlags: ['Suicidal ideation', 'Severe abdominal pain', 'Anaphylaxis signs'],
        authorisedProducts: [
          { name: 'Wegovy', strengths: ['0.25mg', '0.5mg', '1mg', '1.7mg', '2.4mg'], form: 'Injection', coldChain: true },
          { name: 'Mounjaro', strengths: ['2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg'], form: 'Injection', coldChain: true },
        ],
        doseRegimen: { startDose: '0.25mg weekly', escalation: 'Monthly dose escalation per protocol', maxDose: '2.4mg weekly (Wegovy) or 15mg weekly (Mounjaro)' },
        counsellingPoints: ['Inject subcutaneously in abdomen, thigh, or upper arm', 'Rotate injection sites', 'Nausea is common in first weeks', 'Store in fridge 2-8C'],
        fulfilmentModes: ['IN_BRANCH', 'ONLINE_DELIVERY'],
        authorId: superAdmin.id,
        clinicalLeadId: superAdmin.id,
        publishedAt: new Date(),
        reviewDate: new Date('2026-09-15'),
      },
    }),
    prisma.pgd.upsert({
      where: { id: 'pgd-travel-health' },
      update: {},
      create: {
        id: 'pgd-travel-health',
        title: 'Travel Health - Vaccinations',
        version: 'v2.1',
        status: 'PUBLISHED',
        therapyArea: 'Travel Health',
        indication: 'Pre-travel vaccination and antimalarial prophylaxis',
        inclusionCriteria: ['Travelling to endemic areas', 'Age appropriate per vaccine', 'No contraindications'],
        exclusionCriteria: ['Severe egg allergy (for some vaccines)', 'Immunocompromised (live vaccines)', 'Pregnancy (some vaccines)'],
        redFlags: ['Severe allergic reaction to previous dose', 'Febrile illness'],
        authorisedProducts: [
          { name: 'Hepatitis A Vaccine', form: 'Injection', coldChain: true },
          { name: 'Typhoid Vaccine', form: 'Injection', coldChain: true },
          { name: 'Doxycycline', strengths: ['100mg'], form: 'Tablet', coldChain: false },
          { name: 'Malarone', form: 'Tablet', coldChain: false },
        ],
        doseRegimen: { schedule: 'Per NaTHNaC guidelines for destination' },
        fulfilmentModes: ['IN_BRANCH'],
        authorId: superAdmin.id,
        clinicalLeadId: superAdmin.id,
        publishedAt: new Date(),
        reviewDate: new Date('2026-12-01'),
      },
    }),
    prisma.pgd.upsert({
      where: { id: 'pgd-flu-vaccine' },
      update: {},
      create: {
        id: 'pgd-flu-vaccine',
        title: 'Seasonal Influenza Vaccination',
        version: 'v4.0',
        status: 'PUBLISHED',
        therapyArea: 'Seasonal Vaccination',
        indication: 'Annual influenza vaccination for at-risk groups and private patients',
        inclusionCriteria: ['Age 18+', 'No severe egg allergy', 'No acute febrile illness'],
        exclusionCriteria: ['Previous anaphylaxis to flu vaccine', 'Under 18 (different pathway)'],
        redFlags: ['Anaphylaxis', 'Guillain-Barre syndrome history'],
        authorisedProducts: [
          { name: 'Quadrivalent Influenza Vaccine', form: 'Injection', coldChain: true },
        ],
        doseRegimen: { dose: 'Single 0.5ml IM injection' },
        fulfilmentModes: ['IN_BRANCH'],
        authorId: superAdmin.id,
        clinicalLeadId: superAdmin.id,
        publishedAt: new Date(),
        reviewDate: new Date('2026-08-01'),
      },
    }),
    prisma.pgd.upsert({
      where: { id: 'pgd-sexual-health' },
      update: {},
      create: {
        id: 'pgd-sexual-health',
        title: 'Sexual Health - Chlamydia Treatment',
        version: 'v2.0',
        status: 'PUBLISHED',
        therapyArea: 'Sexual Health',
        indication: 'Treatment of uncomplicated genital chlamydia',
        inclusionCriteria: ['Age 16+', 'Positive chlamydia test or contact tracing', 'No pregnancy'],
        exclusionCriteria: ['Pregnancy', 'Allergy to macrolides', 'Complicated infection'],
        redFlags: ['PID symptoms', 'Pregnancy', 'Recurrent infections'],
        authorisedProducts: [
          { name: 'Doxycycline', strengths: ['100mg'], form: 'Capsule', coldChain: false },
          { name: 'Azithromycin', strengths: ['500mg'], form: 'Tablet', coldChain: false },
        ],
        doseRegimen: { primary: 'Doxycycline 100mg BD for 7 days', alternative: 'Azithromycin 1g stat then 500mg OD for 2 days' },
        fulfilmentModes: ['IN_BRANCH', 'ONLINE_DELIVERY'],
        authorId: superAdmin.id,
        clinicalLeadId: superAdmin.id,
        publishedAt: new Date(),
        reviewDate: new Date('2027-01-01'),
      },
    }),
    prisma.pgd.upsert({
      where: { id: 'pgd-skincare' },
      update: {},
      create: {
        id: 'pgd-skincare',
        title: 'Skincare - Acne Treatment',
        version: 'v1.5',
        status: 'PUBLISHED',
        therapyArea: 'Skincare',
        indication: 'Mild to moderate acne vulgaris',
        inclusionCriteria: ['Age 16+', 'Mild-moderate acne', 'Failed OTC treatments'],
        exclusionCriteria: ['Pregnancy or planning pregnancy (retinoids)', 'Severe cystic acne', 'Known allergy'],
        redFlags: ['Pregnancy with retinoid use', 'Severe scarring requiring dermatology referral'],
        authorisedProducts: [
          { name: 'Tretinoin Cream', strengths: ['0.025%', '0.05%'], form: 'Cream', coldChain: false },
          { name: 'Adapalene Gel', strengths: ['0.1%'], form: 'Gel', coldChain: false },
        ],
        doseRegimen: { dose: 'Apply thin layer to affected area once daily at night' },
        fulfilmentModes: ['ONLINE_DELIVERY'],
        authorId: superAdmin.id,
        clinicalLeadId: superAdmin.id,
        publishedAt: new Date(),
        reviewDate: new Date('2027-03-01'),
      },
    }),
  ]);

  console.log(`Created ${pgds.length} PGDs`);

  // ============================================================
  // 3. SAMPLE TENANT (High Street Pharmacy)
  // ============================================================
  const ownerHash = await bcrypt.hash('Owner123!', 12);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'high-street-pharmacy' },
    update: {},
    create: {
      name: 'High Street Pharmacy',
      slug: 'high-street-pharmacy',
      status: 'ACTIVE',
      tier: 'PROFESSIONAL',
      primaryColor: '#0d9488',
      secondaryColor: '#6366f1',
      gphcNumber: '1234567',
      dspStatus: 'VERIFIED',
      dspNumber: 'DSP-9876543',
      dspVerifiedAt: new Date(),
      dspNextReviewDate: new Date('2026-10-24'),
      subdomain: 'high-street-pharmacy',
      onboardingStep: 7,
      goLiveAt: new Date('2026-03-01'),
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'amir@highstreetpharmacy.co.uk' },
    update: {},
    create: {
      email: 'amir@highstreetpharmacy.co.uk',
      passwordHash: ownerHash,
      firstName: 'Amir',
      lastName: 'Hussain',
      role: 'TENANT_OWNER',
      tenantId: tenant.id,
      emailVerified: true,
    },
  });

  // Branch
  const branch = await prisma.branch.upsert({
    where: { id: 'branch-manchester' },
    update: {},
    create: {
      id: 'branch-manchester',
      tenantId: tenant.id,
      name: 'Manchester Central',
      address: '123 High Street',
      city: 'Manchester',
      postcode: 'M1 1AA',
      phone: '0161 123 4567',
      email: 'info@highstreetpharmacy.co.uk',
      openingHours: {
        mon: { open: '09:00', close: '18:00' },
        tue: { open: '09:00', close: '18:00' },
        wed: { open: '09:00', close: '18:00' },
        thu: { open: '09:00', close: '18:00' },
        fri: { open: '09:00', close: '18:00' },
        sat: { open: '09:00', close: '14:00' },
        sun: { open: 'closed', close: 'closed' },
      },
    },
  });

  // Staff
  const pharmacistHash = await bcrypt.hash('Pharma123!', 12);
  const pharmacist = await prisma.user.upsert({
    where: { email: 'sarah.chen@highstreetpharmacy.co.uk' },
    update: {},
    create: {
      email: 'sarah.chen@highstreetpharmacy.co.uk',
      passwordHash: pharmacistHash,
      firstName: 'Sarah',
      lastName: 'Chen',
      role: 'PRESCRIBER',
      tenantId: tenant.id,
      emailVerified: true,
      staffProfile: {
        create: {
          branchId: branch.id,
          gphcNumber: '2087654',
          prescribingCategory: 'Independent Prescriber',
        },
      },
    },
  });

  // Activate services
  const weightService = await prisma.tenantService.upsert({
    where: { tenantId_pgdId: { tenantId: tenant.id, pgdId: 'pgd-weight-mgmt' } },
    update: {},
    create: {
      tenantId: tenant.id,
      pgdId: 'pgd-weight-mgmt',
      name: 'Weight Management Clinic',
      description: 'Clinically-proven GLP-1 treatments including Wegovy and Mounjaro with ongoing pharmacist support.',
      price: 199,
      depositAmount: 50,
      duration: 30,
      fulfilmentModes: ['IN_BRANCH', 'ONLINE_DELIVERY'],
      questionnaireSchema: {
        questions: [
          { id: 'height', type: 'number', label: 'Height (cm)', required: true },
          { id: 'weight', type: 'number', label: 'Weight (kg)', required: true },
          { id: 'previous_glp1', type: 'boolean', label: 'Have you used GLP-1 medications before?', required: true },
          { id: 'diabetes', type: 'boolean', label: 'Do you have diabetes?', required: true },
          { id: 'medications', type: 'text', label: 'List current medications', required: true },
          { id: 'allergies', type: 'text', label: 'Any known allergies?', required: true },
          { id: 'bp_reading', type: 'text', label: 'Recent blood pressure reading', required: false },
        ],
      },
    },
  });

  await prisma.tenantService.upsert({
    where: { tenantId_pgdId: { tenantId: tenant.id, pgdId: 'pgd-travel-health' } },
    update: {},
    create: {
      tenantId: tenant.id,
      pgdId: 'pgd-travel-health',
      name: 'Travel Health Clinic',
      description: 'Vaccinations, antimalarials, and travel health advice tailored to your destination.',
      price: 35,
      duration: 20,
      fulfilmentModes: ['IN_BRANCH'],
    },
  });

  await prisma.tenantService.upsert({
    where: { tenantId_pgdId: { tenantId: tenant.id, pgdId: 'pgd-flu-vaccine' } },
    update: {},
    create: {
      tenantId: tenant.id,
      pgdId: 'pgd-flu-vaccine',
      name: 'Flu Vaccination',
      description: 'Seasonal flu jab. Walk-in or book your preferred time. Quick and easy.',
      price: 14.99,
      duration: 10,
      capacity: 4,
      fulfilmentModes: ['IN_BRANCH'],
    },
  });

  // Sample patient
  const patientHash = await bcrypt.hash('Patient123!', 12);
  const patientUser = await prisma.user.upsert({
    where: { email: 'james.davies@email.com' },
    update: {},
    create: {
      email: 'james.davies@email.com',
      passwordHash: patientHash,
      firstName: 'James',
      lastName: 'Davies',
      role: 'PATIENT',
      tenantId: tenant.id,
      emailVerified: true,
      patientProfile: {
        create: {
          tenantId: tenant.id,
          dateOfBirth: new Date('1990-03-15'),
          gender: 'Male',
          address: '45 Oak Avenue',
          city: 'Manchester',
          postcode: 'M20 3BG',
          idvStatus: 'PASSED',
          idvProvider: 'Onfido',
          idvCompletedAt: new Date(),
          idvExpiresAt: new Date(Date.now() + 365 * 86400000),
          idvDocumentType: 'UK Driving Licence',
        },
      },
    },
  });

  console.log('Created sample tenant:', tenant.name);
  console.log('  Owner:', owner.email);
  console.log('  Pharmacist:', pharmacist.email);
  console.log('  Patient:', patientUser.email);

  console.log('\n=== SEED COMPLETE ===');
  console.log('\nLogin credentials:');
  console.log('  Super Admin: admin@pharmacyonestop.co.uk / SuperAdmin1!');
  console.log('  Support:     support@pharmacyonestop.co.uk / Support1!');
  console.log('  Owner:       amir@highstreetpharmacy.co.uk / Owner123!');
  console.log('  Prescriber:  sarah.chen@highstreetpharmacy.co.uk / Pharma123!');
  console.log('  Patient:     james.davies@email.com / Patient123!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
