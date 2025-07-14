"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DoorClosed, DoorOpen, Home } from "lucide-react"

interface OccupancyTrendChartProps {
  data: {
    month: string
    occupied: number
    vacant: number
    total: number
  }[]
}

export default function CompactOccupancyTrendChart({ data }: OccupancyTrendChartProps) {
  const latestData = data[data.length - 1]

  return (
    <Card className="col-span-4">
      <CardHeader className="p-4">
        <CardTitle className="text-lg">Space Occupancy Trend</CardTitle>
        <CardDescription>Monthly occupied vs. vacant spaces</CardDescription>
      </CardHeader>
      <CardContent className="p-0 pl-2">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
          >
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
              }}
              labelStyle={{ fontWeight: 'bold' }}
              formatter={(value: number, name: string) => {
                const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
                return [value.toLocaleString(), capitalizedName];
              }}
            />
            <Line type="monotone" dataKey="total" stroke="#6b7280" strokeWidth={2} dot={false} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="occupied" stroke="#16a34a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="vacant" stroke="#dc2626" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-2 grid grid-cols-3 gap-2 px-4 pb-4">
          <div className="flex items-center space-x-2 rounded-lg border bg-secondary/30 p-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total</p>
              <p className="text-base font-bold">
                {latestData?.total.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 rounded-lg border bg-emerald-50 p-2">
            <DoorOpen className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs font-medium text-emerald-600">Occupied</p>
              <p className="text-base font-bold text-emerald-600">
                {latestData?.occupied.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 rounded-lg border bg-red-50 p-2">
            <DoorClosed className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-xs font-medium text-red-600">Vacant</p>
              <p className="text-base font-bold text-red-600">
                {latestData?.vacant.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}