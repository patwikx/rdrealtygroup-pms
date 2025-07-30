import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // --- 1. Clean up existing data ---
  // The order is important to avoid foreign key constraint errors
  await prisma.leaseUnit.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.unitFloor.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.propertyTitles.deleteMany();
  await prisma.property.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();
  console.log('Cleaned up existing data.');

  // --- 2. Seed Users ---
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      firstName: 'Maria',
      lastName: 'Manager',
      email: 'manager@example.com',
      password: hashedPassword,
      role: 'MANAGER',
    },
  });

  const tenantUser = await prisma.user.create({
    data: {
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: 'tenant@example.com',
      password: hashedPassword,
      role: 'TENANT',
    },
  });
  console.log('Created users:', { adminUser, managerUser, tenantUser });

  // --- 3. Seed Tenants ---
  const tenant1 = await prisma.tenant.create({
    data: {
      userId: tenantUser.id,
      bpCode: 'T-0001',
      firstName: tenantUser.firstName,
      lastName: tenantUser.lastName,
      email: tenantUser.email,
      phone: faker.phone.number(),
      company: 'Cruz Enterprises',
      businessName: 'Cruz Sari-Sari Store',
      status: 'ACTIVE',
      createdById: adminUser.id,
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      bpCode: 'T-0002',
      email: faker.internet.email(),
      phone: faker.phone.number(),
      company: 'Santos Group Inc.',
      businessName: 'Santos Hardware',
      status: 'ACTIVE',
      createdById: managerUser.id,
    },
  });
  console.log('Created tenants:', { tenant1, tenant2 });

  // --- 4. Seed Properties ---
  const property1 = await prisma.property.create({
    data: {
      propertyCode: 'GSC-001',
      propertyName: 'Lagao Commercial Complex',
      leasableArea: 5000.0,
      address: 'J. Catolico Avenue, General Santos City',
      propertyType: 'COMMERCIAL',
      totalUnits: 10,
      createdById: adminUser.id,
    },
  });

  const property2 = await prisma.property.create({
    data: {
      propertyCode: 'GSC-002',
      propertyName: 'Agan Homes',
      leasableArea: 10000.0,
      address: 'Agan Road, General Santos City',
      propertyType: 'RESIDENTIAL',
      totalUnits: 20,
      createdById: managerUser.id,
    },
  });
  console.log('Created properties:', { property1, property2 });

  // --- 5. Seed Property Titles ---
  const propertyTitle1 = await prisma.propertyTitles.create({
    data: {
      propertyId: property1.id,
      titleNo: `TCT-${faker.string.alphanumeric(6).toUpperCase()}`,
      lotNo: `LOT-${faker.number.int({ min: 100, max: 999 })}`,
      lotArea: 5000.0,
      registeredOwner: 'Property Corp.',
    },
  });
  console.log('Created property titles:', { propertyTitle1 });

  // --- 6. Seed Units ---
  const unit1 = await prisma.unit.create({
    data: {
      propertyId: property1.id,
      propertyTitleId: propertyTitle1.id,
      unitNumber: '101',
      totalArea: 150.0,
      totalRent: 25000.0,
      status: 'OCCUPIED',
    },
  });

  const unit2 = await prisma.unit.create({
    data: {
      propertyId: property1.id,
      propertyTitleId: propertyTitle1.id,
      unitNumber: '102',
      totalArea: 200.0,
      totalRent: 35000.0,
      status: 'VACANT',
    },
  });
  console.log('Created units:', { unit1, unit2 });

  // --- 7. Seed Leases & LeaseUnits ---
  const lease1 = await prisma.lease.create({
    data: {
      tenantId: tenant1.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      totalRentAmount: 25000.0,
      securityDeposit: 50000.0,
      status: 'ACTIVE',
      leaseUnits: {
        create: [
          {
            unitId: unit1.id,
            rentAmount: 25000.0,
          },
        ],
      },
    },
  });
  console.log('Created leases:', { lease1 });

  // --- 9. Seed Maintenance Requests ---
  await prisma.maintenanceRequest.create({
    data: {
      unitId: unit1.id,
      tenantId: tenant1.id,
      category: 'ELECTRICAL',
      priority: 'HIGH',
      description: 'Main light fixture in the shop is flickering.',
      status: 'PENDING',
    },
  });
  console.log('Created a maintenance request.');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
