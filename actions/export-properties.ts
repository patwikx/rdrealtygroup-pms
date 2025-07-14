'use server'
import { PropertyWithRelations } from "@/types";
import { 
  formatCurrency, 
  formatDate, 
  formatNumber,
  EnhancedWorksheetData,
  createHeaderStyle,
  createSectionHeaderStyle,
  createDataCellStyle,
  createCurrencyCellStyle,
  createNumberCellStyle,
  createDateCellStyle,
  createStatusCellStyle,
  createTotalRowStyle,
  getCellReference,
  sanitizeSheetName,
  COLORS
} from "@/lib/data/excel-export-properties-utils";
import { prisma } from "@/lib/db";

// Function to get users data
async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });
}

// Helper function to create safe sheet names
function createSafeSheetName(propertyName: string, suffix: string = ''): string {
  // Remove emojis and special characters, keep only alphanumeric and basic punctuation
  let safeName = propertyName.replace(/[^\w\s-]/g, '').trim();
  
  // Add suffix if provided
  if (suffix) {
    safeName = `${safeName} ${suffix}`;
  }
  
  // Use sanitizeSheetName to ensure Excel compatibility
  return sanitizeSheetName(safeName);
}

export async function exportPropertyDataEnhanced(property: PropertyWithRelations): Promise<EnhancedWorksheetData[]> {
  const worksheets: EnhancedWorksheetData[] = [];
  const users = await getUsers();

  // Calculate totals for overview
  const totalLotArea = property.titles?.reduce((sum, title) => sum + Number(title.lotArea), 0) || 0;
  const totalUnitArea = property.units.reduce((sum, unit) => sum + Number(unit.totalArea), 0);
  const totalRentAmount = property.units.reduce((sum, unit) => sum + Number(unit.totalRent), 0);
  const allPropertyTaxes = property.titles?.flatMap(title => title.propertyTaxes || []) || [];
  const totalTaxAmount = allPropertyTaxes.reduce((sum, tax) => sum + Number(tax.taxAmount), 0);
  const paidTaxAmount = allPropertyTaxes.filter(tax => tax.isPaid).reduce((sum, tax) => sum + Number(tax.taxAmount), 0);

  // WATERFALL FORMAT - ALL DATA IN ONE SHEET
  const waterfallData: any[] = [];
  const waterfallStyles: { [cell: string]: any } = {};
  let currentRow = 1;

  // Helper function to add section header
  const addSectionHeader = (title: string) => {
    waterfallData.push({
      'A': title,
      'B': '',
      'C': '',
      'D': '',
      'E': ''
    });
    waterfallStyles[`A${currentRow}`] = {
      ...createSectionHeaderStyle(),
      font: { ...createSectionHeaderStyle().font, size: 14, bold: true }
    };
    currentRow++;
  };

  // Helper function to add data row
  const addDataRow = (label: string, value: any, additionalInfo: string = '', notes: string = '', isEven: boolean = false) => {
    waterfallData.push({
      'A': label,
      'B': value,
      'C': additionalInfo,
      'D': notes,
      'E': ''
    });
    
    // Style label column
    waterfallStyles[`A${currentRow}`] = {
      ...createDataCellStyle(isEven),
      font: { ...createDataCellStyle(isEven).font, bold: true },
      fill: { fgColor: COLORS.lightBlue, patternType: 'solid' }
    };
    
    // Style value column
    waterfallStyles[`B${currentRow}`] = createDataCellStyle(isEven);
    waterfallStyles[`C${currentRow}`] = createDataCellStyle(isEven);
    waterfallStyles[`D${currentRow}`] = createDataCellStyle(isEven);
    waterfallStyles[`E${currentRow}`] = createDataCellStyle(isEven);
    
    currentRow++;
  };

  // Helper function to add empty row
  const addEmptyRow = () => {
    waterfallData.push({
      'A': '',
      'B': '',
      'C': '',
      'D': '',
      'E': ''
    });
    currentRow++;
  };

  // 1. PROPERTY OVERVIEW SECTION
  addSectionHeader('PROPERTY OVERVIEW');
  addDataRow('Property Name', property.propertyName);
  addDataRow('Property Code', property.propertyCode, '', '', true);
  addDataRow('Property Type', property.propertyType);
  addDataRow('Address', property.address, '', '', true);
  addDataRow('Leasable Area', `${formatNumber(property.leasableArea)} sqm`);
  addDataRow('Total Lot Area', `${formatNumber(totalLotArea)} sqm`, `From ${property.titles?.length || 0} title(s)`, '', true);
  addDataRow('Total Spaces', `${property.totalUnits || 0}`, `${property.units.length} spaces created`);
  addDataRow('Monthly Revenue Potential', formatCurrency(totalRentAmount), '', '', true);
  addDataRow('Total Tax Amount', formatCurrency(totalTaxAmount), `${formatCurrency(paidTaxAmount)} paid`);
  addDataRow('Created Date', formatDate(property.createdAt), '', '', true);
  
  addEmptyRow();

  // 2. PROPERTY TITLES SECTION
  if (property.titles?.length) {
    addSectionHeader('PROPERTY TITLES');
    
    // Add headers for titles
    waterfallData.push({
      'A': 'Title No.',
      'B': 'Lot No.',
      'C': 'Lot Area (sqm)',
      'D': 'Registered Owner',
      'E': 'Encumbrance Status'
    });
    
    ['A', 'B', 'C', 'D', 'E'].forEach(col => {
      waterfallStyles[`${col}${currentRow}`] = createHeaderStyle();
    });
    currentRow++;

    property.titles.forEach((title, index) => {
      const isEven = index % 2 === 1;
      waterfallData.push({
        'A': title.titleNo,
        'B': title.lotNo,
        'C': Number(title.lotArea),
        'D': title.registeredOwner,
        'E': title.isEncumbered ? 'Encumbered' : 'Clear'
      });

      waterfallStyles[`A${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`B${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`C${currentRow}`] = createNumberCellStyle(isEven);
      waterfallStyles[`D${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`E${currentRow}`] = createStatusCellStyle(title.isEncumbered ? 'Encumbered' : 'Clear', isEven);
      currentRow++;

      // Add encumbrance details if any
      if (title.encumbranceDetails) {
        waterfallData.push({
          'A': '  Encumbrance Details',
          'B': title.encumbranceDetails,
          'C': '',
          'D': '',
          'E': ''
        });
        waterfallStyles[`A${currentRow}`] = { ...createDataCellStyle(isEven), font: { ...createDataCellStyle(isEven).font, italic: true } };
        waterfallStyles[`B${currentRow}`] = { ...createDataCellStyle(isEven), font: { ...createDataCellStyle(isEven).font, italic: true } };
        waterfallStyles[`C${currentRow}`] = createDataCellStyle(isEven);
        waterfallStyles[`D${currentRow}`] = createDataCellStyle(isEven);
        waterfallStyles[`E${currentRow}`] = createDataCellStyle(isEven);
        currentRow++;
      }
    });

    addEmptyRow();
  }

  // 3. UNITS/SPACES SECTION
  if (property.units?.length) {
    addSectionHeader('UNITS & SPACES');
    
    // Add headers for units
    waterfallData.push({
      'A': 'Unit Number',
      'B': 'Total Area (sqm)',
      'C': 'Total Rent (PHP)',
      'D': 'Status',
      'E': 'Property Title'
    });
    
    ['A', 'B', 'C', 'D', 'E'].forEach(col => {
      waterfallStyles[`${col}${currentRow}`] = createHeaderStyle();
    });
    currentRow++;

    property.units.forEach((unit, index) => {
      const isEven = index % 2 === 1;
      const propertyTitle = unit.propertyTitle ? unit.propertyTitle.titleNo : 'Not assigned';
      
      waterfallData.push({
        'A': unit.unitNumber,
        'B': Number(unit.totalArea),
        'C': Number(unit.totalRent),
        'D': unit.status,
        'E': propertyTitle
      });

      waterfallStyles[`A${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`B${currentRow}`] = createNumberCellStyle(isEven);
      waterfallStyles[`C${currentRow}`] = createCurrencyCellStyle(isEven);
      waterfallStyles[`D${currentRow}`] = createStatusCellStyle(unit.status, isEven);
      waterfallStyles[`E${currentRow}`] = createDataCellStyle(isEven);
      currentRow++;

      // Add floor details if available
      if (unit.unitFloors && unit.unitFloors.length > 0) {
        const floorDetails = unit.unitFloors.map(floor => 
          `${floor.floorType.replace('_', ' ')}: ${formatNumber(floor.area)} sqm @ ${formatCurrency(floor.rate)}/sqm = ${formatCurrency(floor.rent)}`
        ).join(', ');
        
        waterfallData.push({
          'A': '  Floor Details',
          'B': floorDetails,
          'C': '',
          'D': '',
          'E': ''
        });
        waterfallStyles[`A${currentRow}`] = { ...createDataCellStyle(isEven), font: { ...createDataCellStyle(isEven).font, italic: true } };
        waterfallStyles[`B${currentRow}`] = { ...createDataCellStyle(isEven), font: { ...createDataCellStyle(isEven).font, italic: true } };
        waterfallStyles[`C${currentRow}`] = createDataCellStyle(isEven);
        waterfallStyles[`D${currentRow}`] = createDataCellStyle(isEven);
        waterfallStyles[`E${currentRow}`] = createDataCellStyle(isEven);
        currentRow++;
      }
    });

    // Add totals
    const totalUnitAreaSum = property.units.reduce((sum, unit) => sum + Number(unit.totalArea), 0);
    const totalRentAmountSum = property.units.reduce((sum, unit) => sum + Number(unit.totalRent), 0);
    
    waterfallData.push({
      'A': 'TOTALS',
      'B': totalUnitAreaSum,
      'C': totalRentAmountSum,
      'D': '',
      'E': ''
    });

    waterfallStyles[`A${currentRow}`] = createTotalRowStyle();
    waterfallStyles[`B${currentRow}`] = { ...createTotalRowStyle(), numFmt: '#,##0' };
    waterfallStyles[`C${currentRow}`] = { ...createTotalRowStyle(), numFmt: '₱#,##0.00' };
    waterfallStyles[`D${currentRow}`] = createTotalRowStyle();
    waterfallStyles[`E${currentRow}`] = createTotalRowStyle();
    currentRow++;

    addEmptyRow();
  }

  // 4. PROPERTY TAXES SECTION
  if (allPropertyTaxes.length) {
    addSectionHeader('PROPERTY TAXES');
    
    // Add headers for taxes
    waterfallData.push({
      'A': 'Tax Year',
      'B': 'Tax Declaration No.',
      'C': 'Tax Amount (PHP)',
      'D': 'Status',
      'E': 'Payment Date'
    });
    
    ['A', 'B', 'C', 'D', 'E'].forEach(col => {
      waterfallStyles[`${col}${currentRow}`] = createHeaderStyle();
    });
    currentRow++;

    allPropertyTaxes.forEach((tax, index) => {
      const title = property.titles?.find(t => t.id === tax.propertyTitleId);
      const processedByUser = tax.processedBy ? users.find(u => u.id === tax.processedBy) : null;
      const processedByName = processedByUser ? `${processedByUser.firstName} ${processedByUser.lastName}` : '-';
      const isEven = index % 2 === 1;
      
      waterfallData.push({
        'A': tax.taxYear,
        'B': tax.TaxDecNo,
        'C': Number(tax.taxAmount),
        'D': tax.isPaid ? 'Paid' : 'Unpaid',
        'E': tax.paidDate ? formatDate(tax.paidDate) : '-'
      });

      waterfallStyles[`A${currentRow}`] = createNumberCellStyle(isEven);
      waterfallStyles[`B${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`C${currentRow}`] = createCurrencyCellStyle(isEven);
      waterfallStyles[`D${currentRow}`] = createStatusCellStyle(tax.isPaid ? 'Paid' : 'Unpaid', isEven);
      waterfallStyles[`E${currentRow}`] = tax.paidDate ? createDateCellStyle(isEven) : createDataCellStyle(isEven);
      currentRow++;

      // Add additional tax details
      const paymentType = tax.isAnnual ? 'Annual' : tax.isQuarterly ? `Quarterly (${tax.whatQuarter || ''})` : 'Other';
      waterfallData.push({
        'A': '  Details',
        'B': `${title?.titleNo || 'N/A'} | ${paymentType}`,
        'C': `Due: ${formatDate(tax.dueDate)}`,
        'D': `Processed by: ${processedByName}`,
        'E': tax.remarks || '-'
      });
      
      waterfallStyles[`A${currentRow}`] = { ...createDataCellStyle(isEven), font: { ...createDataCellStyle(isEven).font, italic: true } };
      waterfallStyles[`B${currentRow}`] = { ...createDataCellStyle(isEven), font: { ...createDataCellStyle(isEven).font, italic: true } };
      waterfallStyles[`C${currentRow}`] = { ...createDataCellStyle(isEven), font: { ...createDataCellStyle(isEven).font, italic: true } };
      waterfallStyles[`D${currentRow}`] = { ...createDataCellStyle(isEven), font: { ...createDataCellStyle(isEven).font, italic: true } };
      waterfallStyles[`E${currentRow}`] = { ...createDataCellStyle(isEven), font: { ...createDataCellStyle(isEven).font, italic: true } };
      currentRow++;
    });

    // Add tax totals
    const totalTaxAmountSum = allPropertyTaxes.reduce((sum, tax) => sum + Number(tax.taxAmount), 0);
    const paidTaxAmountSum = allPropertyTaxes.filter(tax => tax.isPaid).reduce((sum, tax) => sum + Number(tax.taxAmount), 0);
    
    waterfallData.push({
      'A': 'TAX TOTALS',
      'B': `Total: ${formatCurrency(totalTaxAmountSum)}`,
      'C': totalTaxAmountSum,
      'D': `Paid: ${formatCurrency(paidTaxAmountSum)}`,
      'E': `Outstanding: ${formatCurrency(totalTaxAmountSum - paidTaxAmountSum)}`
    });

    waterfallStyles[`A${currentRow}`] = createTotalRowStyle();
    waterfallStyles[`B${currentRow}`] = createTotalRowStyle();
    waterfallStyles[`C${currentRow}`] = { ...createTotalRowStyle(), numFmt: '₱#,##0.00' };
    waterfallStyles[`D${currentRow}`] = createTotalRowStyle();
    waterfallStyles[`E${currentRow}`] = createTotalRowStyle();
    currentRow++;

    addEmptyRow();
  }

  // 5. UTILITIES SECTION
  if (property.utilities?.length) {
    addSectionHeader('UTILITIES');
    
    // Add headers for utilities
    waterfallData.push({
      'A': 'Type',
      'B': 'Provider',
      'C': 'Account Number',
      'D': 'Meter Number',
      'E': 'Status'
    });
    
    ['A', 'B', 'C', 'D', 'E'].forEach(col => {
      waterfallStyles[`${col}${currentRow}`] = createHeaderStyle();
    });
    currentRow++;

    property.utilities.forEach((utility, index) => {
      const isEven = index % 2 === 1;
      waterfallData.push({
        'A': utility.utilityType,
        'B': utility.provider,
        'C': utility.accountNumber,
        'D': utility.meterNumber || '-',
        'E': utility.isActive ? 'Active' : 'Inactive'
      });

      waterfallStyles[`A${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`B${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`C${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`D${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`E${currentRow}`] = createStatusCellStyle(utility.isActive ? 'Active' : 'Inactive', isEven);
      currentRow++;
    });

    addEmptyRow();
  }

  // 6. TITLE MOVEMENTS SECTION
  if (property.titleMovements?.length) {
    addSectionHeader('TITLE MOVEMENTS');
    
    // Add headers for movements
    waterfallData.push({
      'A': 'Date',
      'B': 'Location',
      'C': 'Purpose',
      'D': 'Status',
      'E': 'Requested By'
    });
    
    ['A', 'B', 'C', 'D', 'E'].forEach(col => {
      waterfallStyles[`${col}${currentRow}`] = createHeaderStyle();
    });
    currentRow++;

    property.titleMovements.forEach((movement, index) => {
      const requestedByUser = users.find(user => user.id === movement.requestedBy);
      const requestedByName = requestedByUser ? `${requestedByUser.firstName} ${requestedByUser.lastName}` : 'Unknown';
      const isEven = index % 2 === 1;
      
      waterfallData.push({
        'A': formatDate(movement.requestDate),
        'B': movement.location,
        'C': movement.purpose,
        'D': movement.status.replace(/_/g, ' '),
        'E': requestedByName
      });

      waterfallStyles[`A${currentRow}`] = createDateCellStyle(isEven);
      waterfallStyles[`B${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`C${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`D${currentRow}`] = createStatusCellStyle(movement.status.replace(/_/g, ' '), isEven);
      waterfallStyles[`E${currentRow}`] = createDataCellStyle(isEven);
      currentRow++;

      // Add movement details
      waterfallData.push({
        'A': '  Details',
        'B': movement.returnDate ? `Returned: ${formatDate(movement.returnDate)}` : 'Not yet returned',
        'C': movement.remarks || 'No remarks',
        'D': '',
        'E': ''
      });
      
      waterfallStyles[`A${currentRow}`] = { ...createDataCellStyle(isEven), font: { ...createDataCellStyle(isEven).font, italic: true } };
      waterfallStyles[`B${currentRow}`] = { ...createDataCellStyle(isEven), font: { ...createDataCellStyle(isEven).font, italic: true } };
      waterfallStyles[`C${currentRow}`] = { ...createDataCellStyle(isEven), font: { ...createDataCellStyle(isEven).font, italic: true } };
      waterfallStyles[`D${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`E${currentRow}`] = createDataCellStyle(isEven);
      currentRow++;
    });

    addEmptyRow();
  }

  // 7. DOCUMENTS SECTION
  if (property.documents?.length) {
    addSectionHeader('DOCUMENTS');
    
    // Add headers for documents
    waterfallData.push({
      'A': 'Document Name',
      'B': 'Type',
      'C': 'Uploaded By',
      'D': 'Upload Date',
      'E': 'Size/Notes'
    });
    
    ['A', 'B', 'C', 'D', 'E'].forEach(col => {
      waterfallStyles[`${col}${currentRow}`] = createHeaderStyle();
    });
    currentRow++;

    property.documents.forEach((doc, index) => {
      const uploadedByUser = users.find(user => user.id === doc.uploadedById);
      const uploadedByName = uploadedByUser ? `${uploadedByUser.firstName} ${uploadedByUser.lastName}` : 'Unknown';
      const isEven = index % 2 === 1;
      
      waterfallData.push({
        'A': doc.name,
        'B': doc.documentType.toLowerCase(),
        'C': uploadedByName,
        'D': formatDate(doc.createdAt),
        'E': '-'
      });

      waterfallStyles[`A${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`B${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`C${currentRow}`] = createDataCellStyle(isEven);
      waterfallStyles[`D${currentRow}`] = createDateCellStyle(isEven);
      waterfallStyles[`E${currentRow}`] = createDataCellStyle(isEven);
      currentRow++;
    });

    addEmptyRow();
  }

  // Add the waterfall worksheet with safe sheet name
  const safeSheetName = createSafeSheetName(property.propertyName, 'Complete Data');
  
  worksheets.push({
    name: safeSheetName,
    data: waterfallData,
    styles: waterfallStyles,
    columnWidths: [25, 30, 25, 25, 25],
    mergedCells: [] // We can add merged cells for section headers if needed
  });

  return worksheets;
}

export async function exportAllPropertiesDataEnhanced(properties: PropertyWithRelations[]): Promise<EnhancedWorksheetData[]> {
  const worksheets: EnhancedWorksheetData[] = [];

  // For multiple properties, create individual waterfall sheets for each property
  for (const property of properties) {
    const propertyWorksheets = await exportPropertyDataEnhanced(property);
    worksheets.push(...propertyWorksheets);
  }

  // Also add a summary sheet at the beginning
  const users = await getUsers();
  const summaryData: any[] = [];
  const summaryStyles: { [cell: string]: any } = {};

  // Summary sheet headers
  const summaryHeaders = [
    'Property Name', 'Property Code', 'Property Type', 'Address', 'Leasable Area (sqm)', 
    'Total Lot Area (sqm)', 'Total Spaces', 'Spaces Created', 'Total Space Area (sqm)', 
    'Monthly Revenue (PHP)', 'Property Titles', 'Tax Records', 'Total Tax Amount (PHP)', 
    'Paid Tax Amount (PHP)', 'Utilities', 'Documents', 'Created Date'
  ];
  
  const headerRow: any = {};
  summaryHeaders.forEach((header, index) => {
    const col = String.fromCharCode(65 + index);
    headerRow[col] = header;
    summaryStyles[`${col}1`] = createHeaderStyle();
  });
  summaryData.push(headerRow);

  // Calculate totals for all properties
  let grandTotalLotArea = 0;
  let grandTotalUnitArea = 0;
  let grandTotalRevenue = 0;
  let grandTotalTaxAmount = 0;
  let grandPaidTaxAmount = 0;

  // Data rows for summary
  properties.forEach((property, index) => {
    const totalLotArea = property.titles?.reduce((sum, title) => sum + Number(title.lotArea), 0) || 0;
    const totalUnitArea = property.units.reduce((sum, unit) => sum + Number(unit.totalArea), 0);
    const totalRentAmount = property.units.reduce((sum, unit) => sum + Number(unit.totalRent), 0);
    const allPropertyTaxes = property.titles?.flatMap(title => title.propertyTaxes || []) || [];
    const totalTaxAmount = allPropertyTaxes.reduce((sum, tax) => sum + Number(tax.taxAmount), 0);
    const paidTaxAmount = allPropertyTaxes.filter(tax => tax.isPaid).reduce((sum, tax) => sum + Number(tax.taxAmount), 0);

    // Add to grand totals
    grandTotalLotArea += totalLotArea;
    grandTotalUnitArea += totalUnitArea;
    grandTotalRevenue += totalRentAmount;
    grandTotalTaxAmount += totalTaxAmount;
    grandPaidTaxAmount += paidTaxAmount;

    const rowIndex = index + 2;
    const dataRow: any = {
      'A': property.propertyName,
      'B': property.propertyCode,
      'C': property.propertyType,
      'D': property.address,
      'E': Number(property.leasableArea),
      'F': totalLotArea,
      'G': property.totalUnits || 0,
      'H': property.units.length,
      'I': totalUnitArea,
      'J': totalRentAmount,
      'K': property.titles?.length || 0,
      'L': allPropertyTaxes.length,
      'M': totalTaxAmount,
      'N': paidTaxAmount,
      'O': property.utilities.length,
      'P': property.documents.length,
      'Q': property.createdAt
    };
    summaryData.push(dataRow);

    // Apply styles
    const isEven = index % 2 === 1;
    summaryStyles[`A${rowIndex}`] = createDataCellStyle(isEven);
    summaryStyles[`B${rowIndex}`] = createDataCellStyle(isEven);
    summaryStyles[`C${rowIndex}`] = createDataCellStyle(isEven);
    summaryStyles[`D${rowIndex}`] = createDataCellStyle(isEven);
    summaryStyles[`E${rowIndex}`] = createNumberCellStyle(isEven);
    summaryStyles[`F${rowIndex}`] = createNumberCellStyle(isEven);
    summaryStyles[`G${rowIndex}`] = createNumberCellStyle(isEven);
    summaryStyles[`H${rowIndex}`] = createNumberCellStyle(isEven);
    summaryStyles[`I${rowIndex}`] = createNumberCellStyle(isEven);
    summaryStyles[`J${rowIndex}`] = createCurrencyCellStyle(isEven);
    summaryStyles[`K${rowIndex}`] = createNumberCellStyle(isEven);
    summaryStyles[`L${rowIndex}`] = createNumberCellStyle(isEven);
    summaryStyles[`M${rowIndex}`] = createCurrencyCellStyle(isEven);
    summaryStyles[`N${rowIndex}`] = createCurrencyCellStyle(isEven);
    summaryStyles[`O${rowIndex}`] = createNumberCellStyle(isEven);
    summaryStyles[`P${rowIndex}`] = createNumberCellStyle(isEven);
    summaryStyles[`Q${rowIndex}`] = createDateCellStyle(isEven);
  });

  // Add grand totals row
  const totalRowIndex = properties.length + 2;
  summaryData.push({
    'A': 'GRAND TOTALS',
    'B': '',
    'C': '',
    'D': '',
    'E': '',
    'F': grandTotalLotArea,
    'G': '',
    'H': '',
    'I': grandTotalUnitArea,
    'J': grandTotalRevenue,
    'K': '',
    'L': '',
    'M': grandTotalTaxAmount,
    'N': grandPaidTaxAmount,
    'O': '',
    'P': '',
    'Q': ''
  });

  // Apply total row styles
  for (let i = 0; i < 17; i++) {
    const col = String.fromCharCode(65 + i);
    if ([5, 8, 9, 12, 13].includes(i)) { // Numeric columns
      summaryStyles[`${col}${totalRowIndex}`] = i === 9 || i === 12 || i === 13 
        ? { ...createTotalRowStyle(), numFmt: '₱#,##0.00' }
        : { ...createTotalRowStyle(), numFmt: '#,##0' };
    } else {
      summaryStyles[`${col}${totalRowIndex}`] = createTotalRowStyle();
    }
  }

  // Add summary sheet at the beginning with safe name
  worksheets.unshift({
    name: 'Properties Summary',
    data: summaryData,
    styles: summaryStyles,
    columnWidths: [25, 15, 15, 30, 15, 15, 12, 12, 15, 18, 12, 12, 18, 18, 12, 12, 15]
  });

  return worksheets;
}