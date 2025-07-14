"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type PDC = {
  id: string
  amount: number
  status: "Open" | "Deposited" | "RETURNED" | "Bounced" | "Cancelled"
  dueDate: Date
}

interface PDCStatsProps {
  pdcs: PDC[]
}

export function PDCStats({ pdcs }: PDCStatsProps) {
  const stats = pdcs.reduce(
    (acc, pdc) => {
      acc.total += pdc.amount
      acc.count += 1
      
      switch (pdc.status) {
        case "Open":
          acc.open += pdc.amount
          acc.openCount += 1
          break
        case "Deposited":
          acc.deposited += pdc.amount
          acc.depositedCount += 1
          break
        case "RETURNED":
          acc.returned += pdc.amount
          acc.returnedCount += 1
          break
        case "Bounced":
          acc.bounced += pdc.amount
          acc.bouncedCount += 1
          break
        case "Cancelled":
          acc.cancelled += pdc.amount
          acc.cancelledCount += 1
          break
      }

      // Check if due within 30 days
      const daysUntilDue = Math.ceil(
        (new Date(pdc.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysUntilDue <= 30 && daysUntilDue >= 0 && pdc.status === "Open") {
        acc.dueSoon += pdc.amount
        acc.dueSoonCount += 1
      }

      return acc
    },
    {
      total: 0,
      count: 0,
      open: 0,
      openCount: 0,
      deposited: 0,
      depositedCount: 0,
      returned: 0,
      returnedCount: 0,
      bounced: 0,
      bouncedCount: 0,
      cancelled: 0,
      cancelledCount: 0,
      dueSoon: 0,
      dueSoonCount: 0,
    }
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total PDCs</CardTitle>
          <Badge variant="secondary">{stats.count}</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
          <p className="text-xs text-muted-foreground">
            All post-dated checks
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open PDCs</CardTitle>
          <Badge className="bg-blue-100 text-blue-800">{stats.openCount}</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.open)}</div>
          <p className="text-xs text-muted-foreground">
            Pending collection
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
          <Badge className="bg-yellow-100 text-yellow-800">{stats.dueSoonCount}</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.dueSoon)}</div>
          <p className="text-xs text-muted-foreground">
            Due within 30 days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deposited</CardTitle>
          <Badge className="bg-green-100 text-green-800">{stats.depositedCount}</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.deposited)}</div>
          <p className="text-xs text-muted-foreground">
            Successfully collected
          </p>
        </CardContent>
      </Card>
    </div>
  )
}