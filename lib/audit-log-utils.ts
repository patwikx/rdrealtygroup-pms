import { AuditLogWithUser } from '@/types/audit-log';

export function formatChanges(changes: any): string {
  if (!changes) return 'No changes recorded';
  
  try {
    const parsed = typeof changes === 'string' ? JSON.parse(changes) : changes;
    
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed)
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            const { from, to } = value as { from: any; to: any };
            return `${key}: ${from} → ${to}`;
          }
          return `${key}: ${value}`;
        })
        .join(', ');
    }
    
    return String(parsed);
  } catch {
    return String(changes);
  }
}

export function getActionColor(action: string): string {
  const colors: Record<string, string> = {
    CREATE: 'text-green-600 bg-green-50',
    UPDATE: 'text-blue-600 bg-blue-50',
    DELETE: 'text-red-600 bg-red-50',
    LOGIN: 'text-purple-600 bg-purple-50',
    LOGOUT: 'text-gray-600 bg-gray-50',
    PASSWORD_CHANGE: 'text-orange-600 bg-orange-50',
    EMAIL_CHANGE: 'text-yellow-600 bg-yellow-50',
    PERMISSION_CHANGE: 'text-indigo-600 bg-indigo-50',
    STATUS_CHANGE: 'text-teal-600 bg-teal-50',
    ASSIGNMENT: 'text-cyan-600 bg-cyan-50',
    PAYMENT_PROCESSED: 'text-emerald-600 bg-emerald-50',
    DOCUMENT_UPLOAD: 'text-violet-600 bg-violet-50',
  };
  
  return colors[action] || 'text-gray-600 bg-gray-50';
}

export function exportToCSV(logs: AuditLogWithUser[], filename: string = 'audit-logs.csv'): void {
  const headers = [
    'Timestamp',
    'User',
    'Email',
    'Role',
    'Entity Type',
    'Entity ID',
    'Action',
    'Changes',
    'IP Address',
    'User Agent'
  ];

  const csvContent = [
    headers.join(','),
    ...logs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      `"${log.user.firstName} ${log.user.lastName}"`,
      log.user.email,
      log.user.role,
      log.entityType,
      log.entityId,
      log.action,
      `"${formatChanges(log.changes).replace(/"/g, '""')}"`,
      log.ipAddress || '',
      `"${(log.userAgent || '').replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');

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

export function exportToPDF(logs: AuditLogWithUser[], filename: string = 'audit-logs.pdf'): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Audit Logs Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #333; }
        .header p { margin: 5px 0; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .action-create { color: #16a34a; }
        .action-update { color: #2563eb; }
        .action-delete { color: #dc2626; }
        .changes { max-width: 200px; word-wrap: break-word; }
        .footer { margin-top: 20px; text-align: center; color: #666; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Audit Logs Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total Records: ${logs.length}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Entity</th>
            <th>Action</th>
            <th>Changes</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(log => `
            <tr>
              <td>${new Date(log.createdAt).toLocaleString()}</td>
              <td>${log.user.firstName} ${log.user.lastName}<br><small>${log.user.email}</small></td>
              <td>${log.entityType}<br><small>${log.entityId}</small></td>
              <td><span class="action-${log.action.toLowerCase()}">${log.action}</span></td>
              <td class="changes">${formatChanges(log.changes)}</td>
              <td>${log.ipAddress || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>This report contains sensitive information and should be handled according to company data policies.</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}