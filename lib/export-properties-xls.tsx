import { 
  Property, 
  Unit, 
  Document, 
  PropertyUtility, 
  PropertyTax, 
  PropertyTitles, 
  UnitFloor 
} from '@prisma/client';

// Define a more accurate interface based on your updated schema
interface PropertyWithRelations extends Property {
  units: (Unit & {
    unitFloors: UnitFloor[];
  })[];
  documents: Document[];
  utilities: PropertyUtility[];
  titles: (PropertyTitles & {
    propertyTaxes: PropertyTax[];
  })[];
}

export function exportPropertyToCSV(property: PropertyWithRelations) {
  // Helper function to format floor types from the new structure
  const getUnitFloors = (unitFloors: UnitFloor[]) => {
    if (!unitFloors || unitFloors.length === 0) return 'N/A';
    return unitFloors.map(floor => {
        // A simple formatter for the enum values (e.g., GROUND_FLOOR -> Ground Floor)
        return floor.floorType.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }).join(', ');
  };

  // Use flatMap to flatten the taxes from all property titles into a single array
  const allPropertyTaxes = property.titles.flatMap(title => title.propertyTaxes);

  // Format data into CSV rows
  const rows = [
    ['PROPERTY DETAILS'],
    ['Property Code', property.propertyCode],
    ['Property Name', property.propertyName],
    ['Leasable Area (sqm)', property.leasableArea],
    ['Address', property.address],
    ['Property Type', property.propertyType],
    ['Total Units', property.totalUnits],
    ['Created At', new Date(property.createdAt).toLocaleDateString()],
    [''],
    
    ['UNITS'],
    ['Unit Number', 'Total Area (sqm)', 'Status', 'Total Monthly Rent', 'Floor Level'],
    ...property.units.map(unit => [
      unit.unitNumber,
      unit.totalArea, // Changed from unitArea
      unit.status,
      unit.totalRent, // Changed from rentAmount
      getUnitFloors(unit.unitFloors) // Use the new helper to get floor info
    ]),
    [''],
    
    ['PROPERTY TAXES'],
    ['Tax Year', 'Tax Dec No.', 'Amount', 'Due Date', 'Status'],
    ...allPropertyTaxes.map(tax => [ // Iterate over the flattened array of taxes
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

  // Convert to CSV string (This part of your code was correct and remains unchanged)
  const csvContent = rows
    .map(row => row.map(cell => {
      if (cell === null || cell === undefined) return '';
      const cellStr = String(cell);
      // Escape cell content if it contains comma, double quote, or newline
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
    .join('\n');

  // Create a Blob and trigger the download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  // Sanitize the filename to be URL-friendly
  const safeFilename = property.propertyName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.setAttribute('download', `${safeFilename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}