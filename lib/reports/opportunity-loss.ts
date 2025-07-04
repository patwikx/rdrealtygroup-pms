import { prisma } from '@/lib/db'

export async function calculateOpportunityLoss() {
  const vacantUnits = await prisma.unit.findMany({
    where: {
      status: 'VACANT'
    },
    include: {
      property: true
    }
  })

  const summary = {
    totalVacantUnits: vacantUnits.length,
    totalVacantArea: vacantUnits.reduce((sum, unit) => sum + Number(unit.unitArea), 0),
    totalMonthlyLoss: vacantUnits.reduce((sum, unit) => sum + Number(unit.rentAmount), 0),
    totalAnnualLoss: vacantUnits.reduce((sum, unit) => sum + Number(unit.rentAmount), 0) * 12
  }

  return {
    summary,
    details: vacantUnits.map(unit => ({
      id: unit.id,
      unitNumber: unit.unitNumber,
      propertyName: unit.property.propertyName,
      unitArea: Number(unit.unitArea),
      rentAmount: Number(unit.rentAmount),
      monthlyLoss: Number(unit.rentAmount),
      annualLoss: Number(unit.rentAmount) * 12
    }))
  }
}