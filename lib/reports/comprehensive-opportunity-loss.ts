import { prisma } from '@/lib/db'
import {
  addDays,
  differenceInDays,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  format,
  max,
  parseISO,
} from 'date-fns'

// The data structure for the final output, unchanged.
export interface OpportunityLossData {
  summary: {
    totalMonthlyLoss: number
    totalAnnualLoss: number
    totalVacantUnits: number
    totalVacantArea: number
    avgVacancyDuration: number
    longestVacancy: number
    occupancyRate: number
  }
  monthlyTrends: Array<{
    month: string
    loss: number
    vacantUnits: number
    vacantArea: number
  }>
  vacancyDistribution: Array<{
    range: string
    count: number
  }>
  vacantUnits: Array<{
    id: string
    unitNumber: string
    propertyName: string
    unitArea: number
    rentAmount: number
    vacancyStartDate: Date
    vacancyDuration: number
    monthlyLoss: number
    annualLoss: number
    status: string
  }>
  occupancyHistory: Array<{
    id: string
    unitNumber: string
    propertyName: string
    unitArea: number
    rentAmount: number
    occupancyPeriods: Array<{
      startDate: Date
      endDate: Date | null
      duration: number
      tenantName: string
    }>
    vacancyPeriods: Array<{
      startDate: Date
      endDate: Date | null
      duration: number
    }>
    yearlyStats: {
      totalOccupiedDays: number
      totalVacantDays: number
      occupancyRate: number
      lostRevenue: number
    }
  }>
}

/**
 * Analyzes property data to calculate opportunity loss from vacant units.
 * @param filters - Optional filters for the analysis.
 * @returns A detailed report on opportunity loss.
 */
export async function getOpportunityLossData(
  filters: {
    propertyId?: string
    unitStatus?: string
    vacancyDuration?: string
    dateRange?: string // Expects a string like "YYYY-MM-DD to YYYY-MM-DD"
  } = {}
): Promise<OpportunityLossData> {
  // --- 1. SETUP: Define analysis window and Prisma query conditions ---

  const now = new Date()
  // Define the analysis period. Use the filter if provided, otherwise default to the current year.
  const analysisStart = filters.dateRange
    ? parseISO(filters.dateRange.split(' to ')[0])
    : startOfYear(now)
  const analysisEnd = filters.dateRange
    ? parseISO(filters.dateRange.split(' to ')[1])
    : endOfYear(now)

  // Build Prisma WHERE conditions based on filters.
  const whereConditions: any = {
    // We analyze units created before the end of our analysis period.
    createdAt: {
      lte: analysisEnd,
    },
  }
  if (filters.propertyId) {
    whereConditions.propertyId = filters.propertyId
  }
  if (filters.unitStatus) {
    whereConditions.status = filters.unitStatus
  }

  // --- 2. DATA FETCHING: Get all relevant units and their lease history ---

  const allUnits = await prisma.unit.findMany({
    where: whereConditions,
    include: {
      property: true,
      // FIX: Correctly include leases through the LeaseUnit junction table.
      leaseUnits: {
        include: {
          lease: {
            include: {
              tenant: true,
            },
          },
        },
        // We only need leases that overlap with our analysis period.
        where: {
          lease: {
            OR: [
              { startDate: { lte: analysisEnd } },
              { endDate: { gte: analysisStart } },
            ],
          },
        },
      },
    },
  })

  // --- 3. CORE ANALYSIS: Calculate occupancy and vacancy timelines for each unit ---

  const unitAnalysis = allUnits.map(unit => {
    const occupancyPeriods = []
    const vacancyPeriods = []

    // Map LeaseUnit data to a simpler, sorted lease structure.
    const sortedLeases = unit.leaseUnits
      .map(lu => lu.lease)
      .sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )

    // Start tracking time from the unit's creation date or the analysis start, whichever is later.
    let lastEventDate = max([new Date(unit.createdAt), analysisStart])

    for (const lease of sortedLeases) {
      const leaseStart = new Date(lease.startDate)
      const leaseEnd = new Date(lease.endDate)

      // A) Calculate vacancy period before this lease starts.
      if (leaseStart > lastEventDate) {
        vacancyPeriods.push({
          startDate: lastEventDate,
          endDate: leaseStart,
          duration: differenceInDays(leaseStart, lastEventDate),
        })
      }

      // B) Calculate occupancy period for the duration of this lease.
      // We clamp the period to be within our analysis window.
      const effectiveStart = max([leaseStart, lastEventDate, analysisStart])
      const effectiveEnd = leaseEnd < analysisEnd ? leaseEnd : analysisEnd

      if (effectiveEnd > effectiveStart) {
        occupancyPeriods.push({
          startDate: effectiveStart,
          endDate: effectiveEnd,
          duration: differenceInDays(effectiveEnd, effectiveStart) + 1, // Inclusive
          tenantName: `${lease.tenant.firstName ?? ''} ${lease.tenant.lastName ?? ''}`.trim(),
        })
      }
      
      // Move our time tracker to the end of this lease.
      lastEventDate = addDays(leaseEnd, 1)
    }

    // C) Calculate final vacancy period from the last lease end to the analysis end.
    if (lastEventDate < analysisEnd) {
      vacancyPeriods.push({
        startDate: lastEventDate,
        endDate: analysisEnd,
        duration: differenceInDays(analysisEnd, lastEventDate) + 1, // Inclusive
      })
    }

    // Calculate yearly stats for this specific unit.
    const totalOccupiedDays = occupancyPeriods.reduce((sum, p) => sum + p.duration, 0)
    const totalVacantDays = vacancyPeriods.reduce((sum, p) => sum + p.duration, 0)
    const totalDaysInPeriod = differenceInDays(analysisEnd, analysisStart) + 1
    const occupancyRate = totalDaysInPeriod > 0 ? (totalOccupiedDays / totalDaysInPeriod) * 100 : 0
    // FIX: Use `totalRent` for loss calculation and calculate daily rate.
    const dailyRent = (unit.totalRent || 0) / 30.44 // Average days in a month
    const lostRevenue = totalVacantDays * dailyRent

    return {
      unit,
      occupancyPeriods,
      vacancyPeriods,
      yearlyStats: {
        totalOccupiedDays,
        totalVacantDays,
        occupancyRate,
        lostRevenue,
      },
    }
  })

  // --- 4. VACANT UNIT ANALYSIS: Detail currently vacant units ---

  const vacantUnitsWithDetails = unitAnalysis
    .filter(ua => ua.unit.status === 'VACANT')
    .map(ua => {
      // Find the end date of the very last lease, or fall back to unit creation date.
      const lastLeaseEnd = ua.vacancyPeriods.length > 0
        ? ua.vacancyPeriods[ua.vacancyPeriods.length - 1].startDate
        : new Date(ua.unit.createdAt);

      const vacancyStartDate = lastLeaseEnd;
      const vacancyDuration = differenceInDays(now, vacancyStartDate)
      
      // FIX: Use correct field names from schema (`totalRent`, `totalArea`).
      const monthlyLoss = ua.unit.totalRent ?? 0
      const annualLoss = monthlyLoss * 12

      return {
        id: ua.unit.id,
        unitNumber: ua.unit.unitNumber,
        propertyName: ua.unit.property.propertyName,
        unitArea: ua.unit.totalArea ?? 0,
        rentAmount: ua.unit.totalRent ?? 0,
        vacancyStartDate,
        vacancyDuration,
        monthlyLoss,
        annualLoss,
        status: ua.unit.status,
      }
    })

  // Apply the vacancy duration filter if provided.
  let filteredVacantUnits = vacantUnitsWithDetails
  if (filters.vacancyDuration) {
    const [min, max] = filters.vacancyDuration.includes('+')
      ? [parseInt(filters.vacancyDuration, 10), Infinity]
      : filters.vacancyDuration.split('-').map(Number)

    filteredVacantUnits = vacantUnitsWithDetails.filter(unit => {
      if (max === Infinity) return unit.vacancyDuration >= min
      return unit.vacancyDuration >= min && unit.vacancyDuration <= max
    })
  }

  // --- 5. AGGREGATION & SUMMARY: Calculate final metrics ---

  const totalVacantUnits = filteredVacantUnits.length
  const totalVacantArea = filteredVacantUnits.reduce((sum, u) => sum + u.unitArea, 0)
  const totalMonthlyLoss = filteredVacantUnits.reduce((sum, u) => sum + u.monthlyLoss, 0)
  const totalAnnualLoss = totalMonthlyLoss * 12
  const totalVacancyDuration = filteredVacantUnits.reduce((sum, u) => sum + u.vacancyDuration, 0)
  const avgVacancyDuration = totalVacantUnits > 0 ? Math.round(totalVacancyDuration / totalVacantUnits) : 0
  const longestVacancy = Math.max(0, ...filteredVacantUnits.map(u => u.vacancyDuration))
  
  const totalUnitsCount = allUnits.length
  const occupancyRate = totalUnitsCount > 0 ? ((totalUnitsCount - totalVacantUnits) / totalUnitsCount) * 100 : 0

  // --- 6. TRENDS & DISTRIBUTION: Format data for charts ---

  // Monthly trends based on historical vacancy periods.
  const monthlyTrends = eachMonthOfInterval({ start: analysisStart, end: analysisEnd }).map(month => {
    const monthStart = startOfYear(month)
    const monthEnd = endOfYear(month)

    let monthlyLoss = 0
    let vacantInMonthCount = 0
    let vacantAreaInMonth = 0

    unitAnalysis.forEach(({ unit, vacancyPeriods }) => {
      const isVacantThisMonth = vacancyPeriods.some(
        p => new Date(p.startDate) <= monthEnd && new Date(p.endDate) >= monthStart
      )
      if (isVacantThisMonth) {
        monthlyLoss += unit.totalRent ?? 0
        vacantInMonthCount++
        vacantAreaInMonth += unit.totalArea ?? 0
      }
    })

    return {
      month: format(month, 'MMM yyyy'),
      loss: monthlyLoss,
      vacantUnits: vacantInMonthCount,
      vacantArea: vacantAreaInMonth,
    }
  })

  // Vacancy duration distribution for currently vacant units.
  const vacancyDistribution = [
    { range: '0-30 days', count: 0 },
    { range: '31-60 days', count: 0 },
    { range: '61-90 days', count: 0 },
    { range: '91-180 days', count: 0 },
    { range: '181+ days', count: 0 },
  ]
  filteredVacantUnits.forEach(unit => {
    const d = unit.vacancyDuration
    if (d <= 30) vacancyDistribution[0].count++
    else if (d <= 60) vacancyDistribution[1].count++
    else if (d <= 90) vacancyDistribution[2].count++
    else if (d <= 180) vacancyDistribution[3].count++
    else vacancyDistribution[4].count++
  })

  // Format the final occupancy history structure.
  const occupancyHistory = unitAnalysis.map(ua => ({
    id: ua.unit.id,
    unitNumber: ua.unit.unitNumber,
    propertyName: ua.unit.property.propertyName,
    unitArea: ua.unit.totalArea ?? 0,
    rentAmount: ua.unit.totalRent ?? 0,
    occupancyPeriods: ua.occupancyPeriods,
    vacancyPeriods: ua.vacancyPeriods,
    yearlyStats: ua.yearlyStats,
  }))

  // --- 7. RETURN: Assemble the final data object ---

  return {
    summary: {
      totalMonthlyLoss,
      totalAnnualLoss,
      totalVacantUnits,
      totalVacantArea,
      avgVacancyDuration,
      longestVacancy,
      occupancyRate,
    },
    monthlyTrends,
    vacancyDistribution,
    vacantUnits: filteredVacantUnits,
    occupancyHistory,
  }
}
