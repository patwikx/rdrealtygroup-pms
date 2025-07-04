import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        propertyName: true,
        propertyCode: true,
        propertyType: true,
        totalUnits: true,
        leasableArea: true,
      },
      orderBy: {
        propertyName: 'asc'
      }
    })

    return NextResponse.json(properties.map(property => ({
      id: property.id,
      name: property.propertyName,
      code: property.propertyCode,
      type: property.propertyType,
      totalUnits: property.totalUnits,
      leasableArea: property.leasableArea,
    })))
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}