import { NextResponse } from "next/server";
import { auth } from "@/auth"; // Assuming you use NextAuth.js v5
import { prisma } from "@/lib/db"; 

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      // Check for authenticated user
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.id) {
        // Ensure an ID is provided in the URL
        return new NextResponse("Tenant ID is required", { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        // Include all leases associated with this tenant
        leases: {
          orderBy: {
            startDate: 'desc', // Optional: order leases by start date
          },
          include: {
            // **FIXED**: To get units, we now go through the LeaseUnit junction table
            leaseUnits: {
              include: {
                unit: { // From LeaseUnit, we include the actual Unit
                  include: {
                    property: true, // Include the parent property details
                    unitFloors: true, // Include the detailed floor breakdown for the unit
                  },
                },
              }
            },
            // For each lease, include associated payments
            payments: {
                orderBy: {
                    paymentDate: 'desc' // Optional: order payments by date
                }
            },
          },
        },
        // Include Post-Dated Checks (PDCs) associated with the tenant
        pdcs: {
            orderBy: {
                dueDate: 'asc'
            }
        },
        // Include maintenance requests from this tenant
        maintenanceRequests: {
            orderBy: {
                createdAt: 'desc'
            },
          include: {
            unit: {
              include: {
                property: true, // Include property details for the unit under maintenance
              },
            },
          },
        },
        // Include documents uploaded for this tenant
        documents: {
            orderBy: {
                createdAt: 'desc'
            },
          include: {
            // For each document, include the uploader's name
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) {
        return new NextResponse("Tenant not found", { status: 404 });
    }

    // Prisma returns Decimal types for Floats. We need to serialize them for JSON response.
    // This is a common practice to avoid serialization issues on the client.
    const serializedTenant = JSON.parse(JSON.stringify(tenant));


    return NextResponse.json(serializedTenant);

  } catch (error) {
    console.error("[TENANT_GET_ID]", error); // Log the error for debugging
    return new NextResponse("Internal Error", { status: 500 });
  }
}
