"use server"

import { prisma } from "@/lib/db"

export async function searchItems(query: string) {
  console.log("Search query:", query) // Debug log

  if (!query) return { properties: [], spaces: [], tenants: [] }

  try {
    // Normalize the search query
    const searchTerm = query.trim().toLowerCase()

    const [properties, spaces, tenants] = await Promise.all([
      prisma.property.findMany({
        where: {
          OR: [
            { propertyName: { contains: searchTerm, mode: "insensitive" } },
            { propertyCode: { contains: searchTerm, mode: "insensitive" } },
            // Add a more flexible search using startsWith
            { propertyName: { startsWith: searchTerm, mode: "insensitive" } },
            { propertyCode: { startsWith: searchTerm, mode: "insensitive" } },
          ],
        },
        take: 5,
        // Add ordering to ensure consistent results
        orderBy: {
          propertyName: "asc",
        },
      }),
      prisma.unit.findMany({
        where: {
          OR: [
            { unitNumber: { contains: searchTerm, mode: "insensitive" } },
            { unitNumber: { startsWith: searchTerm, mode: "insensitive" } },
          ],
        },
        include: {
          property: true,
        },
        take: 5,
        orderBy: {
          unitNumber: "asc",
        },
      }),
      prisma.tenant.findMany({
        where: {
          OR: [
            { firstName: { contains: searchTerm, mode: "insensitive" } },
            { lastName: { contains: searchTerm, mode: "insensitive" } },
            { company: { contains: searchTerm, mode: "insensitive" } },
            // Add more flexible search options
            { firstName: { startsWith: searchTerm, mode: "insensitive" } },
            { lastName: { startsWith: searchTerm, mode: "insensitive" } },
            { company: { startsWith: searchTerm, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: {
          firstName: "asc",
        },
      }),
    ])

    // Add detailed logging for debugging
    console.log("Raw search results:", {
      propertiesCount: properties.length,
      spacesCount: spaces.length,
      tenantsCount: tenants.length,
      firstProperty: properties[0],
      firstSpace: spaces[0],
      firstTenant: tenants[0],
    })

    const results = {
      properties: properties.map((p) => ({
        id: p.id,
        title: p.propertyName,
        subtitle: p.propertyCode || "No code",
        href: `/dashboard/properties?selected=${p.id}`,
      })),
      spaces: spaces.map((s) => ({
        id: s.id,
        title: s.unitNumber,
        subtitle: s.property?.propertyName || "Unknown Property",
        href: `/dashboard/spaces/${s.id}`,
      })),
      tenants: tenants.map((t) => ({
        id: t.id,
        title: `${t.firstName} ${t.lastName}`.trim(),
        subtitle: t.company || "No company",
        href: `/dashboard/tenants?selected=${t.id}`,
      })),
    }

    console.log("Formatted search results:", results)
    return results
  } catch (error) {
    // Enhanced error logging
    console.error("Search error details:", {
      error,
      query,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Return empty results instead of throwing
    return { properties: [], spaces: [], tenants: [] }
  }
}

