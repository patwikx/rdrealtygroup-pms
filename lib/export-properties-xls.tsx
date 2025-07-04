import { Property, Unit, Document, PropertyUtility, PropertyTax } from '@prisma/client';

interface PropertyWithRelations extends Property {
  units: Unit[];
  documents: Document[];
  utilities: PropertyUtility[];
  propertyTaxes: PropertyTax[];
}

export function exportPropertyToCSV(property: PropertyWithRelations) {
  // Format data into CSV rows
  const rows = [
    ['PROPERTY DETAILS'],
    ['Property Code', property.propertyCode],
    ['Property Name', property.propertyName],
    ['Title No.', property.titleNo],
    ['Lot No.', property.lotNo],
    ['Registered Owner', property.registeredOwner],
    ['Leasable Area (sqm)', property.leasableArea],
    ['Address', property.address],
    ['Property Type', property.propertyType],
    ['Total Units', property.totalUnits],
    ['Created At', new Date(property.createdAt).toLocaleDateString()],
    [''],
    
    ['UNITS'],
    ['Unit Number', 'Area (sqm)', 'Status', 'Monthly Rent', 'Floor Level'],
    ...property.units.map(unit => [
      unit.unitNumber,
      unit.unitArea,
      unit.status,
      unit.rentAmount,
      unit.isFirstFloor ? '1st Floor' :
      unit.isSecondFloor ? '2nd Floor' :
      unit.isThirdFloor ? '3rd Floor' :
      unit.isRoofTop ? 'Roof Top' :
      unit.isMezzanine ? 'Mezzanine' :
      'Unknown'
    ]),
    [''],
    
    ['PROPERTY TAXES'],
    ['Tax Year', 'Tax Dec No.', 'Amount', 'Due Date', 'Status'],
    ...property.propertyTaxes.map(tax => [
      tax.taxYear,
      tax.TaxDecNo,
      tax.taxAmount,
      new Date(tax.dueDate).toLocaleDateString(),
      tax.isPaid ? 'Paid' : 'Unpaid'
    ]),
    [''],
    
    ['UTILITIES'],
    ['Type', 'Provider', 'Account No.', 'Meter No.'],
    ...property.utilities.map(utility => [
      utility.utilityType,
      utility.provider,
      utility.accountNumber,
      utility.meterNumber
    ]),
    [''],
    
    ['DOCUMENTS'],
    ['Name', 'Type', 'Description', 'Upload Date'],
    ...property.documents.map(doc => [
      doc.name,
      doc.documentType,
      doc.description || '',
      new Date(doc.createdAt).toLocaleDateString()
    ])
  ];

  // Convert to CSV string
  const csvContent = rows
    .map(row => row.map(cell => {
      if (cell === null || cell === undefined) return '';
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
    .join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${property.propertyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}