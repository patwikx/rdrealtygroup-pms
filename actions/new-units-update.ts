'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db'; // Your prisma client instance
import { FloorType } from '@prisma/client';

// Define the shape of the floor data coming from the client
type FloorData = {
    floorType: FloorType;
    area: number;
    rate: number;
    rent: number;
};

export async function updateUnitAndFloors(unitId: string, floorsData: FloorData[]) {
    if (!unitId) {
        throw new Error('Unit ID is required.');
    }

    // Calculate the new totals from the submitted floor data
    const totalArea = floorsData.reduce((acc, floor) => acc + (floor.area || 0), 0);
    const totalRent = floorsData.reduce((acc, floor) => acc + (floor.rent || 0), 0);

    try {
        await prisma.$transaction(async (prisma) => {
            // 1. Delete all existing UnitFloor records for this unit
            await prisma.unitFloor.deleteMany({
                where: {
                    unitId: unitId,
                },
            });

            // 2. Create new UnitFloor records if there is data to create
            if (floorsData.length > 0) {
                await prisma.unitFloor.createMany({
                    data: floorsData.map(floor => ({
                        unitId: unitId,
                        floorType: floor.floorType,
                        area: floor.area,
                        rate: floor.rate,
                        rent: floor.rent,
                    })),
                });
            }

            // 3. Update the parent Unit with the new totals
            await prisma.unit.update({
                where: {
                    id: unitId,
                },
                data: {
                    totalArea: totalArea,
                    totalRent: totalRent,
                },
            });
        });

        // Revalidate the path to ensure the UI shows the updated data.
        // Replace '/properties/...' with the actual path you want to revalidate.
        revalidatePath(`/properties/`); // Adjust this path as needed

        return { success: true, message: 'Unit updated successfully.' };

    } catch (error) {
        console.error('Failed to update unit and floors:', error);
        throw new Error('A database error occurred while updating the unit.');
    }
}
