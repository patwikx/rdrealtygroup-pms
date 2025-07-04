import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    
    if (!query) {
      return NextResponse.json([]);
    }

    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Search across multiple entities
    const [properties, spaces, tenants] = await Promise.all([
      // Search properties
      prisma.property.findMany({
        where: {
          OR: [
            { propertyName: { contains: query, mode: 'insensitive' } },
            { propertyCode: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          propertyName: true,
          propertyCode: true,
          address: true,
        },
      }),
      // Search units/spaces
      prisma.unit.findMany({
        where: {
          OR: [
            { unitNumber: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          unitNumber: true,
          property: {
            select: {
              propertyName: true,
            },
          },
        },
      }),
      // Search tenants
      prisma.tenant.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { company: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
        },
      }),
    ]);

    return NextResponse.json({
      properties: properties.map(p => ({
        id: p.id,
        title: p.propertyName,
        subtitle: p.propertyCode,
        type: 'property',
        href: `/dashboard/properties?selected=${p.id}`,
      })),
      spaces: spaces.map(s => ({
        id: s.id,
        title: s.unitNumber,
        subtitle: s.property.propertyName,
        type: 'space',
        href: `/dashboard/spaces/${s.id}`,
      })),
      tenants: tenants.map(t => ({
        id: t.id,
        title: `${t.firstName} ${t.lastName}`,
        subtitle: t.company || 'No company',
        type: 'tenant',
        href: `/dashboard/tenants?selected=${t.id}`,
      })),
    });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
} 