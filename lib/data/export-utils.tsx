export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadZip(files: { name: string; content: string }[], zipFilename: string) {
  // For client-side ZIP creation, we'll use a simple approach
  // In a real implementation, you might want to use a library like JSZip
  
  // For now, we'll create a simple text file with all data combined
  // You can enhance this with a proper ZIP library later
  const combinedContent = files.map(file => 
    `=== ${file.name} ===\n${file.content}\n\n`
  ).join('');
  
  downloadCSV(combinedContent, zipFilename.replace('.zip', '.txt'));
}

export function convertToCSV(data: any[], headers?: string[]): string {
  if (!data.length) return '';
  
  const csvHeaders = headers || Object.keys(data[0]);
  const csvString = [
    csvHeaders.join(','),
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');
  
  return csvString;
}

export function formatPropertyName(propertyName: string): string {
  return propertyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}