'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ChartProps {
  data: Array<any>
  type?: 'line' | 'bar'
  xKey?: string
  yKey?: string
}

export function OpportunityLossChart({ data, type = 'line', xKey = 'month', yKey = 'loss' }: ChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((item: any, index: number) => (
            <p
              key={index}
              className={`text-sm ${item.color ? `text-[${item.color}]` : ''}`}
            >
              {item.name}: {yKey === 'loss' ? formatCurrency(item.value) : item.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xKey} 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={yKey} fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey={xKey} 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey={yKey} 
          stroke="#ef4444" 
          strokeWidth={2}
          dot={{ fill: '#ef4444' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}