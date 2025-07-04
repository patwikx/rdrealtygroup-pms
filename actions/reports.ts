{/*

"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/auth"

export interface FinancialReport {
  revenue: {
    total: number
    byType: Record<string, number>
  }
  expenses: {
    taxes: number
    utilities: number
  }
  netIncome: number
}

export async function getFinancialReports(): Promise<FinancialReport> {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  // Get all properties with their financial data
  const properties = await prisma.property.findMany({
    include: {
      units: {
        include: {
          leases: {
            include: {
              payments: true,
            },
          },
          unitTaxes: true,
          utilityAccounts: {
            include: {
              bills: true,
            },
          },
        },
      },
      propertyTaxes: true,
      utilities: {
        include: {
          bills: true,
        },
      },
    },
  })

  // Calculate total revenue
  const revenue = properties.reduce(
    (acc, property) => {
      const propertyRevenue = property.units.reduce((unitAcc, unit) => {
        const unitRevenue = unit.leases.reduce((leaseAcc, lease) => {
          const leaseRevenue = lease.payments.reduce(
            (paymentAcc, payment) => paymentAcc + payment.amount,
            0
          )
          return {
            total: leaseAcc.total + leaseRevenue,
            byType: {
              ...leaseAcc.byType,
              [lease.status]: (leaseAcc.byType[lease.status] || 0) + leaseRevenue,
            },
          }
        }, { total: 0, byType: {} as Record<string, number> })
        return {
          total: unitAcc.total + unitRevenue.total,
          byType: {
            ...unitAcc.byType,
            ...unitRevenue.byType,
          },
        }
      }, { total: 0, byType: {} as Record<string, number> })
      return {
        total: acc.total + propertyRevenue.total,
        byType: {
          ...acc.byType,
          ...propertyRevenue.byType,
        },
      }
    },
    { total: 0, byType: {} as Record<string, number> }
  )

  // Calculate total expenses
  const expenses = properties.reduce(
    (acc, property) => {
      // Property taxes
      const propertyTaxes = property.propertyTaxes.reduce(
        (sum, tax) => sum + tax.taxAmount,
        0
      )

      // Unit taxes
      const unitTaxes = property.units.reduce(
        (sum, unit) =>
          sum +
          unit.unitTaxes.reduce((taxSum, tax) => taxSum + tax.taxAmount, 0),
        0
      )

      // Property utilities
      const propertyUtilities = property.utilities.reduce(
        (sum, utility) =>
          sum +
          utility.bills.reduce((billSum, bill) => billSum + bill.amount, 0),
        0
      )

      // Unit utilities
      const unitUtilities = property.units.reduce(
        (sum, unit) =>
          sum +
          unit.utilityAccounts.reduce(
            (accSum, account) =>
              accSum +
              account.bills.reduce(
                (billSum, bill) => billSum + bill.amount,
                0
              ),
            0
          ),
        0
      )

      return {
        taxes: acc.taxes + propertyTaxes + unitTaxes,
        utilities: acc.utilities + propertyUtilities + unitUtilities,
      }
    },
    { taxes: 0, utilities: 0 }
  )

  return {
    revenue,
    expenses,
    netIncome: revenue.total - (expenses.taxes + expenses.utilities),
  }
}

export async function getPropertyReports() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const properties = await prisma.property.findMany({
    include: {
      units: {
        include: {
          leases: {
            include: {
              tenant: true,
              payments: true,
            },
          },
          maintenanceRequests: {
            include: {
              tenant: true,
              assignedTo: true,
            },
          },
          documents: true,
          unitTaxes: true,
          utilityAccounts: {
            include: {
              bills: true,
            },
          },
        },
      },
      documents: true,
      propertyTaxes: true,
      utilities: {
        include: {
          bills: true,
        },
      },
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  return properties.map(property => ({
    // Property Details
    id: property.id,
    propertyCode: property.propertyCode,
    propertyName: property.propertyName,
    titleNo: property.titleNo,
    lotNo: property.lotNo,
    registeredOwner: property.registeredOwner,
    leasableArea: property.leasableArea,
    address: property.address,
    propertyType: property.propertyType,
    totalUnits: property.totalUnits,
    createdBy: `${property.createdBy.firstName} ${property.createdBy.lastName}`,
    createdAt: property.createdAt,

    // Financial Summary
    totalPropertyTaxes: property.propertyTaxes.reduce((sum, tax) => sum + tax.taxAmount, 0),
    totalUtilityBills: property.utilities.reduce((sum, utility) => 
      sum + utility.bills.reduce((billSum, bill) => billSum + bill.amount, 0), 0),
    
    // Units Summary
    units: property.units.map(unit => ({
      unitNumber: unit.unitNumber,
      unitArea: unit.unitArea,
      unitRate: unit.unitRate,
      rentAmount: unit.rentAmount,
      status: unit.status,
      floor: {
        isFirstFloor: unit.isFirstFloor,
        isSecondFloor: unit.isSecondFloor,
        isThirdFloor: unit.isThirdFloor,
        isRoofTop: unit.isRoofTop,
        isMezzanine: unit.isMezzanine,
      },
      
      // Leases
      leases: unit.leases.map(lease => ({
        startDate: lease.startDate,
        endDate: lease.endDate,
        rentAmount: lease.rentAmount,
        securityDeposit: lease.securityDeposit,
        status: lease.status,
        tenant: {
          name: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
          company: lease.tenant.company,
          email: lease.tenant.email,
          phone: lease.tenant.phone,
        },
        payments: lease.payments.map(payment => ({
          amount: payment.amount,
          paymentType: payment.paymentType,
          paymentMethod: payment.paymentMethod,
          paymentStatus: payment.paymentStatus,
          paymentDate: payment.paymentDate,
        })),
      })),

      // Maintenance
      maintenanceRequests: unit.maintenanceRequests.map(request => ({
        category: request.category,
        priority: request.priority,
        description: request.description,
        status: request.status,
        tenant: `${request.tenant.firstName} ${request.tenant.lastName}`,
        assignedTo: request.assignedTo ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}` : null,
        createdAt: request.createdAt,
        completedAt: request.completedAt,
      })),

      // Documents
      documents: unit.documents.map(doc => ({
        name: doc.name,
        description: doc.description,
        documentType: doc.documentType,
        createdAt: doc.createdAt,
      })),

      // Taxes and Utilities
      taxes: unit.unitTaxes.map(tax => ({
        taxYear: tax.taxYear,
        taxDecNo: tax.taxDecNo,
        taxAmount: tax.taxAmount,
        dueDate: tax.dueDate,
        isPaid: tax.isPaid,
        paidDate: tax.paidDate,
      })),
      utilities: unit.utilityAccounts.map(account => ({
        utilityType: account.utilityType,
        accountNumber: account.accountNumber,
        meterNumber: account.meterNumber,
        bills: account.bills.map(bill => ({
          billingPeriodStart: bill.billingPeriodStart,
          billingPeriodEnd: bill.billingPeriodEnd,
          amount: bill.amount,
          consumption: bill.consumption,
          isPaid: bill.isPaid,
          paidDate: bill.paidDate,
        })),
      })),
    })),

    // Property Documents
    documents: property.documents.map(doc => ({
      name: doc.name,
      description: doc.description,
      documentType: doc.documentType,
      createdAt: doc.createdAt,
    })),

    // Property Taxes
    propertyTaxes: property.propertyTaxes.map(tax => ({
      taxYear: tax.taxYear,
      taxDecNo: tax.TaxDecNo,
      taxAmount: tax.taxAmount,
      dueDate: tax.dueDate,
      isPaid: tax.isPaid,
      paidDate: tax.paidDate,
    })),

    // Property Utilities
    utilities: property.utilities.map(utility => ({
      utilityType: utility.utilityType,
      provider: utility.provider,
      accountNumber: utility.accountNumber,
      meterNumber: utility.meterNumber,
      isActive: utility.isActive,
      bills: utility.bills.map(bill => ({
        billingPeriodStart: bill.billingPeriodStart,
        billingPeriodEnd: bill.billingPeriodEnd,
        amount: bill.amount,
        consumption: bill.consumption,
        isPaid: bill.isPaid,
        paidDate: bill.paidDate,
      })),
    })),
  }))
}

export async function getTenantReports() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const tenants = await prisma.tenant.findMany({
    include: {
      leases: {
        include: {
          unit: {
            include: {
              property: true,
            },
          },
          payments: true,
        },
      },
      maintenanceRequests: {
        include: {
          unit: {
            include: {
              property: true,
            },
          },
          assignedTo: true,
        },
      },
      documents: true,
    },
  })

  return tenants.map(tenant => ({
    // Tenant Details
    id: tenant.id,
    bpCode: tenant.bpCode,
    name: `${tenant.firstName} ${tenant.lastName}`,
    email: tenant.email,
    phone: tenant.phone,
    company: tenant.company,
    status: tenant.status,
    emergencyContact: {
      name: tenant.emergencyContactName,
      phone: tenant.emergencyContactPhone,
    },
    createdAt: tenant.createdAt,

    // Leases
    leases: tenant.leases.map(lease => ({
      property: lease.unit.property.propertyName,
      unit: lease.unit.unitNumber,
      startDate: lease.startDate,
      endDate: lease.endDate,
      rentAmount: lease.rentAmount,
      securityDeposit: lease.securityDeposit,
      status: lease.status,
      terminationDate: lease.terminationDate,
      terminationReason: lease.terminationReason,
      payments: lease.payments.map(payment => ({
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        paymentDate: payment.paymentDate,
      })),
    })),

    // Maintenance Requests
    maintenanceRequests: tenant.maintenanceRequests.map(request => ({
      property: request.unit.property.propertyName,
      unit: request.unit.unitNumber,
      category: request.category,
      priority: request.priority,
      description: request.description,
      status: request.status,
      assignedTo: request.assignedTo ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}` : null,
      createdAt: request.createdAt,
      completedAt: request.completedAt,
    })),

    // Documents
    documents: tenant.documents.map(doc => ({
      name: doc.name,
      description: doc.description,
      documentType: doc.documentType,
      createdAt: doc.createdAt,
    })),

    // Financial Summary
    totalRentPaid: tenant.leases.reduce((sum, lease) => 
      sum + lease.payments.reduce((pSum, payment) => 
        payment.paymentStatus === 'COMPLETED' ? pSum + payment.amount : pSum, 0), 0),
    activeLeases: tenant.leases.filter(lease => lease.status === 'ACTIVE').length,
    totalLeases: tenant.leases.length,
    totalMaintenanceRequests: tenant.maintenanceRequests.length,
  }))
}

export async function getUnitReports() {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const units = await prisma.unit.findMany({
    include: {
      property: true,
      leases: {
        include: {
          tenant: true,
          payments: true,
        },
      },
      maintenanceRequests: {
        include: {
          tenant: true,
          assignedTo: true,
        },
      },
      documents: true,
      unitTaxes: true,
      utilityAccounts: {
        include: {
          bills: true,
        },
      },
    },
  })

  return units.map(unit => ({
    // Unit Details
    id: unit.id,
    unitNumber: unit.unitNumber,
    property: unit.property.propertyName,
    unitArea: unit.unitArea,
    unitRate: unit.unitRate,
    rentAmount: unit.rentAmount,
    status: unit.status,
    floor: {
      isFirstFloor: unit.isFirstFloor,
      isSecondFloor: unit.isSecondFloor,
      isThirdFloor: unit.isThirdFloor,
      isRoofTop: unit.isRoofTop,
      isMezzanine: unit.isMezzanine,
    },

    // Leases
    leases: unit.leases.map(lease => ({
      tenant: {
        name: `${lease.tenant.firstName} ${lease.tenant.lastName}`,
        company: lease.tenant.company,
        email: lease.tenant.email,
        phone: lease.tenant.phone,
      },
      startDate: lease.startDate,
      endDate: lease.endDate,
      rentAmount: lease.rentAmount,
      securityDeposit: lease.securityDeposit,
      status: lease.status,
      terminationDate: lease.terminationDate,
      terminationReason: lease.terminationReason,
      payments: lease.payments.map(payment => ({
        amount: payment.amount,
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        paymentDate: payment.paymentDate,
      })),
    })),

    // Maintenance
    maintenanceRequests: unit.maintenanceRequests.map(request => ({
      tenant: `${request.tenant.firstName} ${request.tenant.lastName}`,
      category: request.category,
      priority: request.priority,
      description: request.description,
      status: request.status,
      assignedTo: request.assignedTo ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}` : null,
      createdAt: request.createdAt,
      completedAt: request.completedAt,
    })),

    // Documents
    documents: unit.documents.map(doc => ({
      name: doc.name,
      description: doc.description,
      documentType: doc.documentType,
      createdAt: doc.createdAt,
    })),

    // Taxes
    taxes: unit.unitTaxes.map(tax => ({
      taxYear: tax.taxYear,
      taxDecNo: tax.taxDecNo,
      taxAmount: tax.taxAmount,
      dueDate: tax.dueDate,
      isPaid: tax.isPaid,
      paidDate: tax.paidDate,
    })),

    // Utilities
    utilities: unit.utilityAccounts.map(account => ({
      utilityType: account.utilityType,
      accountNumber: account.accountNumber,
      meterNumber: account.meterNumber,
      bills: account.bills.map(bill => ({
        billingPeriodStart: bill.billingPeriodStart,
        billingPeriodEnd: bill.billingPeriodEnd,
        amount: bill.amount,
        consumption: bill.consumption,
        isPaid: bill.isPaid,
        paidDate: bill.paidDate,
      })),
    })),

    // Financial Summary
    totalRevenue: unit.leases.reduce((sum, lease) => 
      sum + lease.payments.reduce((pSum, payment) => 
        payment.paymentStatus === 'COMPLETED' ? pSum + payment.amount : pSum, 0), 0),
    totalTaxes: unit.unitTaxes.reduce((sum, tax) => sum + tax.taxAmount, 0),
    totalUtilities: unit.utilityAccounts.reduce((sum, account) => 
      sum + account.bills.reduce((billSum, bill) => billSum + bill.amount, 0), 0),
  }))
}

*/}