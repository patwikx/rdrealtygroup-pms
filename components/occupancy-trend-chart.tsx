"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, DoorClosed, DoorOpen, Home } from "lucide-react"

interface OccupancyTrendChartProps {
  data: {
    month: string
    occupied: number
    vacant: number
    total: number
  }[]
}

export function OccupancyTrendChart({ data }: OccupancyTrendChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Space Occupancy Trend</CardTitle>
        <CardDescription>
          Monthly breakdown of occupied and vacant spaces
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart 
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value.toLocaleString()} spaces`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                const formattedValue = value.toLocaleString();
                switch(name) {
                  case 'occupied':
                    return [`${formattedValue} spaces`, 'Occupied Spaces'];
                  case 'vacant':
                    return [`${formattedValue} spaces`, 'Vacant Spaces'];
                  case 'total':
                    return [`${formattedValue} spaces`, 'Total Spaces'];
                  default:
                    return [formattedValue, name];
                }
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px'
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              formatter={(value) => {
                switch(value) {
                  case 'occupied':
                    return 'Occupied Spaces';
                  case 'vacant':
                    return 'Vacant Spaces';
                  case 'total':
                    return 'Total Spaces';
                  default:
                    return value;
                }
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#6b7280"
              strokeWidth={2}
              dot={{
                stroke: '#6b7280',
                strokeWidth: 2,
                r: 4,
                fill: 'white'
              }}
              strokeDasharray="3 3"
            />
            <Line
              type="monotone"
              dataKey="occupied"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{
                stroke: '#16a34a',
                strokeWidth: 2,
                r: 4,
                fill: 'white'
              }}
            />
            <Line
              type="monotone"
              dataKey="vacant"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{
                stroke: '#dc2626',
                strokeWidth: 2,
                r: 4,
                fill: 'white'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-4 border rounded-lg bg-secondary/5">
            <Home className="h-5 w-5 text-muted-foreground mr-3" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Spaces</p>
              <p className="text-2xl font-bold">
                {data[data.length - 1]?.total.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center p-4 border rounded-lg bg-emerald-50">
            <DoorOpen className="h-5 w-5 text-emerald-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-emerald-600">Occupied Spaces</p>
              <p className="text-2xl font-bold text-emerald-600">
                {data[data.length - 1]?.occupied.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center p-4 border rounded-lg bg-red-50">
            <DoorClosed className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-600">Vacant Spaces</p>
              <p className="text-2xl font-bold text-red-600">
                {data[data.length - 1]?.vacant.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}