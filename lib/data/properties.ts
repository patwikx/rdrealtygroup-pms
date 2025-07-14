import { prisma } from "@/lib/db";
import { cache } from "react";

export const revalidate = 0;

export const getProperties = cache(async () => {
  return prisma.property.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      units: {
        include: {
          propertyTitle: true, // Include propertyTitle here
          unitFloors: true, // Include unitFloors for each unit
        },
      },
      documents: true,
      utilities: true,
      titleMovements: true,
      titles: {
        orderBy: { createdAt: "desc" },
        include: {
          propertyTaxes: true, // Include propertyTaxes here
        },
      },
    },
  });
});
export const getPropertyById = cache(async (id: string) => {
  return prisma.property.findUnique({
    where: { id },
    include: {
      units: {
        include: {
          propertyTitle: true,
        },
      },
      documents: true,
      utilities: true,
      titleMovements: true,
      titles: {
        orderBy: { createdAt: "desc" },
        include: {
          propertyTaxes: true,
        },
      },
    },
  });
});