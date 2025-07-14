'use client';

import { PropertyWithRelations } from "@/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/data/excel-export-properties-utils";

// --- INTERFACES ---
export interface PrintSection {
  title: string;
  data: PrintRow[];
  totals?: PrintRow[];
}

export interface PrintRow {
  label: string;
  value: string;
  additionalInfo?: string;
  notes?: string;
  isHeader?: boolean;
  isSubItem?: boolean;
  isTotal?: boolean;
  status?: 'active' | 'inactive' | 'paid' | 'unpaid' | 'occupied' | 'vacant' | 'clear' | 'encumbered' | 'maintenance' | 'reserved';
}

export interface PrintData {
  propertyName: string;
  propertyCode: string;
  sections: PrintSection[];
  summary: {
    totalLotArea: number;
    totalUnitArea: number;
    totalRevenue: number;
    totalTaxAmount: number;
    paidTaxAmount: number;
  };
}

type User = {
  id: string | number;
  firstName: string;
  lastName: string;
};

async function getUsers(): Promise<User[]> {
  // This is a mock function. In a real scenario, you would fetch users from your database.
  return []; 
}

// --- DATA GENERATION ---
export async function generatePrintData(property: PropertyWithRelations): Promise<PrintData> {
  const users = await getUsers();

  const totalLotArea = property.titles?.reduce((sum, title) => sum + Number(title.lotArea), 0) || 0;
  // ✅ FIX: Changed `unit.unitArea` to `unit.totalArea` to match the Prisma model.
  const totalUnitArea = property.units.reduce((sum, unit) => sum + Number(unit.totalArea), 0);
  // ✅ FIX: Changed `unit.rentAmount` to `unit.totalRent` to match the Prisma model.
  const totalRentAmount = property.units.reduce((sum, unit) => sum + Number(unit.totalRent), 0);
  const allPropertyTaxes = property.titles?.flatMap(title => title.propertyTaxes || []) || [];
  const totalTaxAmount = allPropertyTaxes.reduce((sum, tax) => sum + Number(tax.taxAmount), 0);
  const paidTaxAmount = allPropertyTaxes.filter(tax => tax.isPaid).reduce((sum, tax) => sum + Number(tax.taxAmount), 0);

  const sections: PrintSection[] = [];

  sections.push({
    title: 'Property Overview',
    data: [
        { label: 'Property Name', value: property.propertyName },
        { label: 'Property Code', value: property.propertyCode },
        { label: 'Property Type', value: property.propertyType },
        { label: 'Address', value: property.address },
        { label: 'Leasable Area', value: `${formatNumber(property.leasableArea)} sqm` },
        { label: 'Total Lot Area', value: `${formatNumber(totalLotArea)} sqm`, additionalInfo: `from ${property.titles?.length || 0} title(s)` },
        { label: 'Total Units', value: `${property.totalUnits || 0}`, additionalInfo: `${property.units.length} units created` },
        { label: 'Monthly Revenue Potential', value: formatCurrency(totalRentAmount) },
        { label: 'Total Tax Liability', value: formatCurrency(totalTaxAmount), additionalInfo: `${formatCurrency(paidTaxAmount)} paid` },
        { label: 'Date Created', value: formatDate(property.createdAt) }
    ]
  });

  if (property.titles?.length) {
    const titlesData: PrintRow[] = [
      { label: 'Title No.', value: 'Lot No.', additionalInfo: 'Area (sqm)', notes: 'Status / Owner', isHeader: true }
    ];
    property.titles.forEach((title) => {
      titlesData.push({
        label: title.titleNo,
        value: title.lotNo,
        additionalInfo: formatNumber(Number(title.lotArea)),
        notes: title.registeredOwner,
        status: title.isEncumbered ? 'encumbered' : 'clear'
      });
      if (title.encumbranceDetails) {
        titlesData.push({ label: 'Encumbrance', value: title.encumbranceDetails, isSubItem: true });
      }
    });
    sections.push({ title: 'Property Titles', data: titlesData });
  }

  if (property.units?.length) {
    const unitsData: PrintRow[] = [
      { label: 'Unit No.', value: 'Area (sqm)', additionalInfo: 'Monthly Rent (PHP)', notes: 'Status', isHeader: true }
    ];
    property.units.forEach((unit) => {
      unitsData.push({
        label: unit.unitNumber,
        // ✅ FIX: Changed `unit.unitArea` to `unit.totalArea`.
        value: formatNumber(Number(unit.totalArea)),
        // ✅ FIX: Changed `unit.rentAmount` to `unit.totalRent`.
        additionalInfo: formatCurrency(Number(unit.totalRent)),
        notes: unit.status,
        status: unit.status.toLowerCase() as any
      });
    });
    sections.push({
      title: 'Units & Spaces',
      data: unitsData,
      totals: [
        { label: 'Total Unit Area', value: `${formatNumber(totalUnitArea)} sqm`, isTotal: true },
        { label: 'Total Monthly Revenue', value: formatCurrency(totalRentAmount), isTotal: true }
      ]
    });
  }

  if (allPropertyTaxes.length) {
    const taxesData: PrintRow[] = [
        { label: 'Year', value: 'Tax Dec. No.', additionalInfo: 'Amount (PHP)', notes: 'Status / Due Date', isHeader: true }
    ];
    allPropertyTaxes.forEach((tax) => {
        taxesData.push({
            label: tax.taxYear.toString(),
            value: tax.TaxDecNo,
            additionalInfo: formatCurrency(Number(tax.taxAmount)),
            notes: `Due: ${formatDate(tax.dueDate)}`,
            status: tax.isPaid ? 'paid' : 'unpaid'
        });
        if (tax.paidDate || tax.remarks) {
            taxesData.push({
                label: 'Details',
                value: `Paid: ${tax.paidDate ? formatDate(tax.paidDate) : 'N/A'}. ${tax.remarks || ''}`,
                isSubItem: true
            });
        }
    });
    sections.push({
        title: 'Property Taxes',
        data: taxesData,
        totals: [
            { label: 'Total Tax Amount', value: formatCurrency(totalTaxAmount), isTotal: true },
            { label: 'Paid Amount', value: formatCurrency(paidTaxAmount), isTotal: true },
            { label: 'Outstanding Balance', value: formatCurrency(totalTaxAmount - paidTaxAmount), isTotal: true }
        ]
    });
  }

  return {
    propertyName: property.propertyName,
    propertyCode: property.propertyCode,
    sections,
    summary: { totalLotArea, totalUnitArea, totalRevenue: totalRentAmount, totalTaxAmount, paidTaxAmount }
  };
}

export function generateMultiplePropertiesPrintData(properties: PropertyWithRelations[]): Promise<PrintData[]> {
  return Promise.all(properties.map(property => generatePrintData(property)));
}


// --- PRINT TRIGGER AND HTML GENERATION ---

export function printDocument(printData: PrintData | PrintData[], title: string = 'Property Report') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Could not open print window. Please disable your popup blocker and try again.');
    return;
  }

  const dataArray = Array.isArray(printData) ? printData : [printData];
  const html = generatePrintHTML(dataArray, title);

  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };
}

function generateSectionHTML(section: PrintSection): string {
  const header = section.data.find(row => row.isHeader);
  const dataRows = section.data.filter(row => !row.isHeader);

  if (section.title === 'Property Overview') {
    return `<table class="overview-table"><tbody>${section.data.map(row => `<tr><td>${row.label}</td><td><strong>${row.value}</strong> ${row.additionalInfo ? `<em>(${row.additionalInfo})</em>` : ''}</td></tr>`).join('')}</tbody></table>`;
  }

  return `
    <table class="section-table">
      ${header ? `<thead><tr><th>${header.label}</th><th>${header.value}</th><th>${header.additionalInfo}</th><th>${header.notes}</th></tr></thead>` : ''}
      <tbody>
        ${dataRows.map(row => {
          if (row.isSubItem) {
            return `<tr class="sub-item"><td colspan="4"><strong>${row.label}:</strong> ${row.value}</td></tr>`;
          }
          return `<tr><td>${row.label}</td><td>${row.value}</td><td>${row.additionalInfo || ''}</td><td><span class="status-text status-${row.status}">${row.notes || row.status || ''}</span></td></tr>`;
        }).join('')}
      </tbody>
      ${section.totals ? `<tfoot>${section.totals.map(total => `<tr class="total-row"><td colspan="2">${total.label}</td><td colspan="2" style="text-align: right;">${total.value}</td></tr>`).join('')}</tfoot>` : ''}
    </table>
  `;
}

function generateOverallSummaryHTML(printDataArray: PrintData[]): string {
    const summary = printDataArray.reduce((acc, data) => {
        acc.totalRevenue += data.summary.totalRevenue;
        acc.totalTaxAmount += data.summary.totalTaxAmount;
        acc.paidTaxAmount += data.summary.paidTaxAmount;
        acc.totalLotArea += data.summary.totalLotArea;
        acc.totalUnitArea += data.summary.totalUnitArea;
        return acc;
    }, { totalRevenue: 0, totalTaxAmount: 0, paidTaxAmount: 0, totalLotArea: 0, totalUnitArea: 0 });

    const outstandingTax = summary.totalTaxAmount - summary.paidTaxAmount;

    return `
        <section class="section overall-summary-section">
            <div class="section-title">Overall Report Summary</div>
            <div class="summary-grid">
                <div class="summary-box">
                    <span class="summary-label">Total Properties</span>
                    <span class="summary-value">${printDataArray.length}</span>
                </div>
                <div class="summary-box">
                    <span class="summary-label">Total Monthly Revenue</span>
                    <span class="summary-value">${formatCurrency(summary.totalRevenue)}</span>
                </div>
                <div class="summary-box">
                    <span class="summary-label">Total Tax Liability</span>
                    <span class="summary-value">${formatCurrency(summary.totalTaxAmount)}</span>
                </div>
                 <div class="summary-box">
                    <span class="summary-label">Outstanding Taxes</span>
                    <span class="summary-value status-unpaid">${formatCurrency(outstandingTax)}</span>
                </div>
                <div class="summary-box">
                    <span class="summary-label">Total Lot Area</span>
                    <span class="summary-value">${formatNumber(summary.totalLotArea)} sqm</span>
                </div>
                 <div class="summary-box">
                    <span class="summary-label">Total Unit Area</span>
                    <span class="summary-value">${formatNumber(summary.totalUnitArea)} sqm</span>
                </div>
            </div>
        </section>
        <hr class="summary-divider">
    `;
}

function generatePrintHTML(printDataArray: PrintData[], title: string): string {
  const currentDate = new Date().toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const mainTitle = printDataArray.length === 1 ? `${printDataArray[0].propertyName} - Detailed Report` : title;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${mainTitle}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 20mm 15mm 20mm 15mm; 
        }

        .page-container::before {
            content: "${mainTitle}";
            position: fixed;
            top: -12mm;
            left: 0;
            right: 0;
            width: 100%;
            text-align: center;
            font-size: 14pt;
            font-weight: bold;
            border-bottom: 1.5px solid #000;
            padding-bottom: 5mm;
        }

        .page-container::after {
            content: "Generated on: ${currentDate} | Page " counter(page);
            position: fixed;
            bottom: -15mm;
            left: 0;
            right: 0;
            width: 100%;
            text-align: center;
            font-size: 9pt;
            color: #444;
            border-top: 1px solid #666;
            padding-top: 4mm;
        }
        
        body { font-family: 'Times New Roman', Times, serif; font-size: 10pt; line-height: 1.3; color: #000; }
        
        .property-header { margin-top: 5px; margin-bottom: 12px; break-before: auto; break-after: avoid; }
        .property-header h3 { font-size: 15pt; margin: 0; color: #111; }
        .property-header .property-code { font-family: 'Courier New', monospace; font-size: 10pt; color: #444; }
        .section { margin-bottom: 15px; break-inside: avoid; }
        .section-title { font-size: 12pt; font-weight: bold; border-bottom: 1px solid #666; padding-bottom: 2px; margin-bottom: 8px; }

        .overall-summary-section { padding: 5px; background-color: #f8f8f8; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 15px; }
        .summary-box { display: flex; flex-direction: column; padding: 5px; text-align: center; }
        .summary-label { font-size: 8pt; color: #333; margin-bottom: 4px; text-transform: uppercase; }
        .summary-value { font-size: 12pt; font-weight: bold; color: #000; }
        .summary-divider { margin-top: 15px; margin-bottom: 15px; border: 0; border-top: 1px solid #ccc; }
        
        table { width: 100%; border-collapse: collapse; }
        .overview-table td { padding: 2.5px 0; }
        .overview-table td:first-child { width: 22%; }
        .section-table { table-layout: fixed; }
        .section-table th, .section-table td { padding: 4px 5px; text-align: left; vertical-align: top; word-wrap: break-word; border: none; }
        .section-table thead th { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 3px; }
        .section-table tbody tr { border-bottom: 1px solid #f0f0f0; }
        .section-table .sub-item { border-bottom: none; }
        .section-table .sub-item td { font-style: italic; color: #444; padding-left: 15px; }
        .section-table tfoot .total-row td { font-weight: bold; border-top: 1.5px double #000; padding-top: 5px; }
        
        .status-text { text-transform: capitalize; }
        .status-paid, .status-active, .status-clear, .status-occupied { color: #005a00; }
        .status-unpaid, .status-inactive, .status-encumbered { color: #990000; font-weight: bold; }
        .status-vacant, .status-reserved, .status-maintenance { color: #b38600; }

        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <div class="page-container">
        
        ${printDataArray.length > 1 ? generateOverallSummaryHTML(printDataArray) : ''}

        ${printDataArray.map((data, index) => `
          ${index > 0 ? '<div class="page-break"></div>' : ''}
          <div class="property-container">
            ${printDataArray.length > 1 ? `
              <header class="property-header">
                <h3>${data.propertyName}</h3>
                <span class="property-code">PROPERTY CODE: ${data.propertyCode}</span>
              </header>
            `: ''}
            <main>
              ${data.sections.map(section => `
                <section class="section">
                  <div class="section-title">${section.title}</div>
                  ${generateSectionHTML(section)}
                </section>
              `).join('')}
            </main>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;
}
