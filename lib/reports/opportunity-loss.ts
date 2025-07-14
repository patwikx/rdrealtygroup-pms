import { prisma } from '@/lib/db';

export async function calculateOpportunityLoss() {
  // 1. Fetch the detailed list of vacant units
  const vacantUnits = await prisma.unit.findMany({
    where: {
      status: 'VACANT',
    },
    select: {
      id: true,
      unitNumber: true,
      totalArea: true,
      totalRent: true,
      property: {
        select: {
          propertyName: true,
        },
      },
    },
  });

  // 2. Calculate summary aggregations directly in the database
  const aggregation = await prisma.unit.aggregate({
    where: {
      status: 'VACANT',
    },
    _count: {
      id: true, // Count all vacant units
    },
    _sum: {
      totalArea: true, // Sum of all vacant area
      totalRent: true, // Sum of all monthly rent
    },
  });

  const totalMonthlyLoss = aggregation._sum.totalRent ?? 0;

  // 3. Construct the final summary and details
  const summary = {
    totalVacantUnits: aggregation._count.id,
    totalVacantArea: aggregation._sum.totalArea ?? 0,
    totalMonthlyLoss: totalMonthlyLoss,
    totalAnnualLoss: totalMonthlyLoss * 12,
  };

  const details = vacantUnits.map((unit) => ({
    id: unit.id,
    unitNumber: unit.unitNumber,
    propertyName: unit.property.propertyName,
    unitArea: unit.totalArea,
    rentAmount: unit.totalRent, // Use rentAmount for consistency in the final object
    monthlyLoss: unit.totalRent,
    annualLoss: unit.totalRent * 12,
  }));

  return {
    summary,
    details,
  };
}