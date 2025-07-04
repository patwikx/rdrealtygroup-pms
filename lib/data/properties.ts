import { prisma } from "@/lib/db";
import { cache } from "react";

export const getProperties = cache(async () => {
  return prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      units: {
        include: {
          propertyTitle: true, // Include propertyTitle here
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