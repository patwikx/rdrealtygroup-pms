'use server'

import { PrismaClient } from '@prisma/client'
import { addMonths, differenceInDays, differenceInYears, setYear } from 'date-fns'

const prisma = new PrismaClient()

// Interface for the Renewal Report
export interface RenewalReport {
  id: string
  tenantName: string
  email: string
  phone: string
  company: string
  propertyName: string
  unitNumber: string
  rentAmount: number
  leaseStartDate: Date
  leaseEndDate: Date
  daysUntilRenewal: number
  anniversaryDate: Date
  yearsWithUs: number
  status: string
}

// Interface for the Anniversary Report
export interface AnniversaryReport {
  id: string
  tenantName: string
  email: string
  phone: string
  company: string
  propertyName: string
  unitNumber: string
  rentAmount: number
  leaseStartDate: Date
  anniversaryDate: Date
  yearsWithUs: number
  daysUntilAnniversary: number
  status: string
}

/**
 * Fetches lease renewals that are upcoming within a specified number of months.
 * @param months - The number of months to look ahead for upcoming renewals. Defaults to 3.
 * @returns A promise that resolves to an array of RenewalReport objects.
 */
export async function getUpcomingRenewals(months: number = 3): Promise<RenewalReport[]> {
  const today = new Date()
  // Use date-fns for more accurate date calculations
  const futureDate = addMonths(today, months)

  const leases = await prisma.lease.findMany({
    where: {
      endDate: {
        gte: today,
        lte: futureDate,
      },
      status: 'ACTIVE',
    },
    include: {
      tenant: true,
      // FIX: Correctly include leases through the `leaseUnits` junction table.
      // This is necessary because a single lease can span multiple units.
      leaseUnits: {
        include: {
          unit: {
            include: {
              property: true,
            },
          },
        },
      },
    },
    orderBy: {
      endDate: 'asc',
    },
  })

  // FIX: Use `flatMap` to create a separate report for each unit within a lease.
  // This correctly handles the one-to-many relationship.
  return leases.flatMap(lease => {
    return lease.leaseUnits.map(leaseUnit => {
      // Use `differenceInDays` and `differenceInYears` for precise duration calculations.
      const daysUntilRenewal = differenceInDays(lease.endDate, today)
      const yearsWithUs = differenceInYears(today, lease.startDate)

      return {
        id: lease.id,
        tenantName: `${lease.tenant.firstName ?? ''} ${lease.tenant.lastName ?? ''}`.trim(),
        email: lease.tenant.email,
        phone: lease.tenant.phone,
        company: lease.tenant.company,
        // FIX: Access property and unit details from the nested `leaseUnit` object.
        propertyName: leaseUnit.unit.property.propertyName,
        unitNumber: leaseUnit.unit.unitNumber,
        // FIX: Access the rent amount for the specific unit from the `leaseUnit` object.
        rentAmount: leaseUnit.rentAmount,
        leaseStartDate: lease.startDate,
        leaseEndDate: lease.endDate,
        daysUntilRenewal,
        anniversaryDate: lease.startDate, // The start date serves as the base anniversary
        yearsWithUs,
        status: lease.status,
      }
    })
  })
}

/**
 * Fetches tenant anniversaries that are upcoming within a specified number of months.
 * @param months - The number of months to look ahead for upcoming anniversaries. Defaults to 3.
 * @returns A promise that resolves to an array of AnniversaryReport objects.
 */
export async function getUpcomingAnniversaries(months: number = 3): Promise<AnniversaryReport[]> {
  const today = new Date()
  const futureDate = addMonths(today, months)
  const currentYear = today.getFullYear()

  const leases = await prisma.lease.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      tenant: true,
      // FIX: Correctly include the `leaseUnits` relation.
      leaseUnits: {
        include: {
          unit: {
            include: {
              property: true,
            },
          },
        },
      },
    },
  })

  const anniversaryReports = leases
    .flatMap(lease => {
      // Create a report for each unit, as each could be part of the lease anniversary.
      return lease.leaseUnits.map(leaseUnit => {
        const leaseStart = new Date(lease.startDate)
        // Use `setYear` to find the anniversary date in the current year.
        let anniversaryThisYear = setYear(leaseStart, currentYear)

        // If this year's anniversary has already passed, check for next year's.
        if (anniversaryThisYear < today) {
          anniversaryThisYear = setYear(anniversaryThisYear, currentYear + 1)
        }

        const daysUntilAnniversary = differenceInDays(anniversaryThisYear, today)
        const yearsWithUs = differenceInYears(today, leaseStart)

        return {
          id: lease.id,
          tenantName: `${lease.tenant.firstName ?? ''} ${lease.tenant.lastName ?? ''}`.trim(),
          email: lease.tenant.email,
          phone: lease.tenant.phone,
          company: lease.tenant.company,
          propertyName: leaseUnit.unit.property.propertyName,
          unitNumber: leaseUnit.unit.unitNumber,
          rentAmount: leaseUnit.rentAmount,
          leaseStartDate: lease.startDate,
          anniversaryDate: anniversaryThisYear,
          yearsWithUs,
          daysUntilAnniversary,
          status: lease.status,
        }
      })
    })
    // FIX: Filter reports where the anniversary falls within our calculated date range for better accuracy.
    .filter(report => report.anniversaryDate >= today && report.anniversaryDate <= futureDate)
    .sort((a, b) => a.daysUntilAnniversary - b.daysUntilAnniversary)

  return anniversaryReports
}

/**
 * Generates a summary of upcoming renewals and anniversaries.
 * @returns A promise that resolves to a summary object.
 */
export async function getReportsSummary() {
  const [renewals, anniversaries] = await Promise.all([
    getUpcomingRenewals(3),
    getUpcomingAnniversaries(3),
  ])

  return {
    totalRenewals: renewals.length,
    totalAnniversaries: anniversaries.length,
    urgentRenewals: renewals.filter(r => r.daysUntilRenewal <= 30).length,
    urgentAnniversaries: anniversaries.filter(a => a.daysUntilAnniversary <= 30).length,
    nextRenewal: renewals[0] ?? null, // Handle case where array might be empty
    nextAnniversary: anniversaries[0] ?? null, // Handle case where array might be empty
  }
}
