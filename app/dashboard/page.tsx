import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import { 
  Building2, 
  Users, 
  ClipboardList, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Home,
  PartyPopper
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OccupancyTrendChart } from '@/components/occupancy-trend-chart'
import { calculateOpportunityLoss } from '@/lib/reports/opportunity-loss'
import { formatCurrency } from '@/lib/utils'
import { OpportunityLossCard } from '@/components/opportunity-loss-card'

// Server Actions
async function getOverviewStats() {
  const [
    totalProperties,
    totalUnits,
    totalTenants,
    totalMaintenanceRequests,
    vacantUnits,
    overduePayments,
    upcomingLeaseRenewals,
    recentMaintenanceRequests,
    occupancyMetrics,
    opportunityLoss
  ] = await Promise.all([
    prisma.property.count(),
    prisma.unit.count(),
    prisma.tenant.count(),
    prisma.maintenanceRequest.count({
      where: {
        status: {
          in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS']
        }
      }
    }),
    prisma.unit.count({
      where: {
        status: 'VACANT'
      }
    }),
    prisma.payment.count({
      where: {
        paymentStatus: 'PENDING',
        paymentDate: {
          lt: new Date()
        }
      }
    }),
    prisma.lease.count({
      where: {
        endDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        }
      }
    }),
    prisma.maintenanceRequest.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        unit: true,
        tenant: true
      }
    }),
    // Query to get total leasable area and occupied area
    prisma.$transaction([
      prisma.property.aggregate({
        _sum: {
          leasableArea: true
        }
      }),
      prisma.unit.aggregate({
        where: {
          status: 'OCCUPIED'
        },
        _sum: {
          unitArea: true
        }
      })
    ]),
    // Get opportunity loss data
    calculateOpportunityLoss()
  ])

  const totalLeasableArea = Number(occupancyMetrics[0]._sum.leasableArea) || 0
  const totalOccupiedArea = Number(occupancyMetrics[1]._sum.unitArea) || 0

  return {
    totalProperties,
    totalUnits,
    totalTenants,
    totalMaintenanceRequests,
    vacantUnits,
    overduePayments,
    upcomingLeaseRenewals,
    recentMaintenanceRequests,
    totalLeasableArea,
    totalOccupiedArea,
    opportunityLoss: {
      vacantUnits: opportunityLoss.summary.totalVacantUnits,
      vacantArea: opportunityLoss.summary.totalVacantArea,
      monthlyLoss: opportunityLoss.summary.totalMonthlyLoss,
      annualLoss: opportunityLoss.summary.totalAnnualLoss
    }
  }
}

async function getRevenueMetrics() {
  const currentMonth = new Date()
  const lastMonth = new Date(currentMonth)
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  const [currentMonthRevenue, lastMonthRevenue, totalOutstandingAmount] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        paymentStatus: 'COMPLETED',
        paymentDate: {
          gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
          lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
        }
      },
      _sum: {
        amount: true
      }
    }),
    prisma.payment.aggregate({
      where: {
        paymentStatus: 'COMPLETED',
        paymentDate: {
          gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        }
      },
      _sum: {
        amount: true
      }
    }),
    prisma.payment.aggregate({
      where: {
        paymentStatus: 'PENDING'
      },
      _sum: {
        amount: true
      }
    })
  ])

  return {
    currentMonthRevenue: currentMonthRevenue._sum.amount || 0,
    lastMonthRevenue: lastMonthRevenue._sum.amount || 0,
    totalOutstandingAmount: totalOutstandingAmount._sum.amount || 0
  }
}

async function getOccupancyTrends() {
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date;
  }).reverse();

  const occupancyData = await Promise.all(
    months.map(async (date) => {
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const [occupiedUnits, vacantUnits] = await Promise.all([
        // Get occupied units count
        prisma.unit.count({
          where: {
            status: 'OCCUPIED',
            createdAt: {
              lte: endOfMonth
            }
          }
        }),
        // Get vacant units count
        prisma.unit.count({
          where: {
            status: 'VACANT',
            createdAt: {
              lte: endOfMonth
            }
          }
        })
      ]);

      return {
        month: date.toLocaleString('default', { month: 'short' }),
        occupied: occupiedUnits,
        vacant: vacantUnits,
        total: occupiedUnits + vacantUnits
      };
    })
  );

  return occupancyData;
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  trend,
  trendValue 
}: { 
  title: string
  value: number | string
  description?: string
  icon: any
  trend?: 'up' | 'down'
  trendValue?: string
}) {


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(trend || description) && (
          <p className="text-xs text-muted-foreground">
            {trend && (
              <span className={`inline-flex items-center mr-2 ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                {trendValue}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function MaintenanceRequestTable({ requests }: { requests: any[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Property/Unit</TableHead>
          <TableHead>Tenant</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              {request.unit.unitNumber}
            </TableCell>
            <TableCell>
              {request.tenant.firstName} {request.tenant.lastName}
            </TableCell>
            <TableCell>{request.category}</TableCell>
            <TableCell>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                request.priority === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                request.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                request.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {request.priority}
              </span>
            </TableCell>
            <TableCell>{request.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default async function DashboardPage() {
  const stats = await getOverviewStats()
  const revenue = await getRevenueMetrics()
  const occupancyTrends = await getOccupancyTrends()
  
  const revenueChange = revenue.currentMonthRevenue > revenue.lastMonthRevenue
  const revenueChangePercentage = revenue.lastMonthRevenue 
    ? Math.abs(((Number(revenue.currentMonthRevenue) - Number(revenue.lastMonthRevenue)) / Number(revenue.lastMonthRevenue)) * 100).toFixed(1)
    : '0'

  // Calculate occupancy rate based on area
  const occupancyRate = stats.totalLeasableArea > 0
    ? ((stats.totalOccupiedArea / stats.totalLeasableArea) * 100).toFixed(1)
    : '0'

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      {/* Revenue Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Outstanding Payments"
          value={formatCurrency(revenue.totalOutstandingAmount)}
          icon={AlertTriangle}
          description={`${stats.overduePayments} overdue payments`}
        />
        <StatCard
          title="Total Properties"
          value={stats.totalProperties}
          icon={Building2}
          description={`${stats.totalUnits} total spaces`}
        />
        
        <StatCard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          icon={Home}
          description={`${stats.totalOccupiedArea} / ${stats.totalLeasableArea} sqm occupied`}
        />
        <OpportunityLossCard summary={stats.opportunityLoss} />
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tenants"
          value={stats.totalTenants}
          icon={Users}
          description="Active tenants"
        />
        <StatCard
          title="Maintenance Requests"
          value={stats.totalMaintenanceRequests}
          icon={ClipboardList}
          description="Open requests"
        />
        <StatCard
          title="Upcoming Renewals"
          value={stats.upcomingLeaseRenewals}
          icon={ClipboardList}
          description="Next 30 days"
        />
        <StatCard
          title="Tenant Anniversaries"
          value={stats.upcomingLeaseRenewals}
          icon={PartyPopper}
          description="Next 30 days"
        />
      </div>

      {/* Occupancy Trend Chart */}
      <OccupancyTrendChart 
        data={occupancyTrends.map(trend => ({
          month: trend.month,
          total: trend.total,
          occupied: trend.occupied,
          vacant: trend.total - trend.occupied
        }))}
      />
    </div>
  )
}