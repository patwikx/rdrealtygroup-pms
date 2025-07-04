import { prisma } from '@/lib/db'
import { addDays, differenceInDays, startOfYear, endOfYear, eachMonthOfInterval, format } from 'date-fns'

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

export async function getOpportunityLossData(filters: {
  propertyId?: string
  unitStatus?: string
  vacancyDuration?: string
  dateRange?: string
} = {}): Promise<OpportunityLossData> {
  const currentYear = new Date().getFullYear()
  const yearStart = startOfYear(new Date(currentYear, 0, 1))
  const yearEnd = endOfYear(new Date(currentYear, 11, 31))
  
  // Build where conditions based on filters
  const whereConditions: any = {}
  
  if (filters.propertyId) {
    whereConditions.propertyId = filters.propertyId
  }
  
  if (filters.unitStatus) {
    whereConditions.status = filters.unitStatus
  }

  // Get all units with their properties
  const units = await prisma.unit.findMany({
    where: whereConditions,
    include: {
      property: true,
      leases: {
        orderBy: {
          startDate: 'asc'
        },
        include: {
          tenant: true
        }
      }
    }
  })

  // Calculate vacancy and occupancy periods for each unit
  const unitAnalysis = await Promise.all(
    units.map(async (unit) => {
      const occupancyPeriods = []
      const vacancyPeriods = []
      
      // Sort leases by start date
      const sortedLeases = unit.leases.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )
      
      let currentDate = yearStart
      
      for (const lease of sortedLeases) {
        const leaseStart = new Date(lease.startDate)
        const leaseEnd = new Date(lease.endDate)
        
        // If there's a gap before this lease, it's a vacancy period
        if (leaseStart > currentDate) {
          vacancyPeriods.push({
            startDate: currentDate,
            endDate: leaseStart,
            duration: differenceInDays(leaseStart, currentDate)
          })
        }
        
        // Add the occupancy period
        if (leaseEnd >= yearStart && leaseStart <= yearEnd) {
          const periodStart = leaseStart < yearStart ? yearStart : leaseStart
          const periodEnd = leaseEnd > yearEnd ? yearEnd : leaseEnd
          
          occupancyPeriods.push({
            startDate: periodStart,
            endDate: periodEnd,
            duration: differenceInDays(periodEnd, periodStart),
            tenantName: `${lease.tenant.firstName} ${lease.tenant.lastName}`
          })
        }
        
        currentDate = leaseEnd > currentDate ? leaseEnd : currentDate
      }
      
      // If there's time remaining after all leases, it's a vacancy period
      if (currentDate < yearEnd) {
        vacancyPeriods.push({
          startDate: currentDate,
          endDate: yearEnd,
          duration: differenceInDays(yearEnd, currentDate)
        })
      }
      
      // Calculate yearly stats
      const totalOccupiedDays = occupancyPeriods.reduce((sum, period) => sum + period.duration, 0)
      const totalVacantDays = vacancyPeriods.reduce((sum, period) => sum + period.duration, 0)
      const totalDaysInYear = differenceInDays(yearEnd, yearStart)
      const occupancyRate = totalDaysInYear > 0 ? (totalOccupiedDays / totalDaysInYear) * 100 : 0
      const lostRevenue = (totalVacantDays / 30) * Number(unit.rentAmount)
      
      return {
        unit,
        occupancyPeriods,
        vacancyPeriods,
        yearlyStats: {
          totalOccupiedDays,
          totalVacantDays,
          occupancyRate,
          lostRevenue
        }
      }
    })
  )

  // Get currently vacant units
  const vacantUnits = units.filter(unit => unit.status === 'VACANT')
  
  // Calculate vacancy duration for currently vacant units
  const vacantUnitsWithDuration = await Promise.all(
    vacantUnits.map(async (unit) => {
      // Find the last lease end date or creation date if no leases
      const lastLease = unit.leases
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0]
      
      const vacancyStartDate = lastLease ? new Date(lastLease.endDate) : new Date(unit.createdAt)
      const vacancyDuration = differenceInDays(new Date(), vacancyStartDate)
      const monthlyLoss = Number(unit.rentAmount)
      const annualLoss = monthlyLoss * 12
      
      return {
        id: unit.id,
        unitNumber: unit.unitNumber,
        propertyName: unit.property.propertyName,
        unitArea: Number(unit.unitArea),
        rentAmount: Number(unit.rentAmount),
        vacancyStartDate,
        vacancyDuration,
        monthlyLoss,
        annualLoss,
        status: unit.status
      }
    })
  )

  // Apply vacancy duration filter
  let filteredVacantUnits = vacantUnitsWithDuration
  if (filters.vacancyDuration) {
    const [min, max] = filters.vacancyDuration.includes('+') 
      ? [parseInt(filters.vacancyDuration), Infinity]
      : filters.vacancyDuration.split('-').map(Number)
    
    filteredVacantUnits = vacantUnitsWithDuration.filter(unit => {
      if (max === Infinity) return unit.vacancyDuration >= min
      return unit.vacancyDuration >= min && unit.vacancyDuration <= max
    })
  }

  // Calculate summary statistics
  const totalVacantUnits = filteredVacantUnits.length
  const totalVacantArea = filteredVacantUnits.reduce((sum, unit) => sum + unit.unitArea, 0)
  const totalMonthlyLoss = filteredVacantUnits.reduce((sum, unit) => sum + unit.monthlyLoss, 0)
  const totalAnnualLoss = totalMonthlyLoss * 12
  const avgVacancyDuration = totalVacantUnits > 0 
    ? Math.round(filteredVacantUnits.reduce((sum, unit) => sum + unit.vacancyDuration, 0) / totalVacantUnits)
    : 0
  const longestVacancy = filteredVacantUnits.length > 0
    ? Math.max(...filteredVacantUnits.map(unit => unit.vacancyDuration))
    : 0
  
  const totalUnits = units.length
  const occupancyRate = totalUnits > 0 
    ? ((totalUnits - totalVacantUnits) / totalUnits) * 100
    : 0

  // Generate monthly trends
  const monthlyTrends = eachMonthOfInterval({
    start: yearStart,
    end: new Date()
  }).map(month => {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    
    // Calculate vacancy for this month
    const vacantInMonth = unitAnalysis.filter(({ unit, vacancyPeriods }) => 
      vacancyPeriods.some(period => 
        period.startDate <= monthEnd && 
        (period.endDate === null || period.endDate >= monthStart)
      )
    )
    
    const monthlyLoss = vacantInMonth.reduce((sum, { unit }) => sum + Number(unit.rentAmount), 0)
    const vacantArea = vacantInMonth.reduce((sum, { unit }) => sum + Number(unit.unitArea), 0)
    
    return {
      month: format(month, 'MMM yyyy'),
      loss: monthlyLoss,
      vacantUnits: vacantInMonth.length,
      vacantArea
    }
  })

  // Generate vacancy distribution
  const vacancyDistribution = [
    { range: '0-30 days', count: 0 },
    { range: '31-60 days', count: 0 },
    { range: '61-90 days', count: 0 },
    { range: '91-180 days', count: 0 },
    { range: '181+ days', count: 0 }
  ]
  
  filteredVacantUnits.forEach(unit => {
    if (unit.vacancyDuration <= 30) {
      vacancyDistribution[0].count++
    } else if (unit.vacancyDuration <= 60) {
      vacancyDistribution[1].count++
    } else if (unit.vacancyDuration <= 90) {
      vacancyDistribution[2].count++
    } else if (unit.vacancyDuration <= 180) {
      vacancyDistribution[3].count++
    } else {
      vacancyDistribution[4].count++
    }
  })

  // Format occupancy history
  const occupancyHistory = unitAnalysis.map(({ unit, occupancyPeriods, vacancyPeriods, yearlyStats }) => ({
    id: unit.id,
    unitNumber: unit.unitNumber,
    propertyName: unit.property.propertyName,
    unitArea: Number(unit.unitArea),
    rentAmount: Number(unit.rentAmount),
    occupancyPeriods,
    vacancyPeriods,
    yearlyStats
  }))

  return {
    summary: {
      totalMonthlyLoss,
      totalAnnualLoss,
      totalVacantUnits,
      totalVacantArea,
      avgVacancyDuration,
      longestVacancy,
      occupancyRate
    },
    monthlyTrends,
    vacancyDistribution,
    vacantUnits: filteredVacantUnits,
    occupancyHistory
  }
}