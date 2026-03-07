/**
 * Export utilities for attendance and leave data
 * Supports Excel (CSV) and PDF formats
 */

interface ExportData {
  headers: string[];
  rows: any[][];
  filename: string;
  title?: string;
}

/**
 * Export data as CSV (Excel compatible)
 */
export function exportToExcel(data: ExportData) {
  const { headers, rows, filename } = data;

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        // Handle cells with commas, quotes, or newlines
        const cellStr = String(cell ?? '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data as PDF
 */
export function exportToPDF(data: ExportData) {
  const { headers, rows, filename, title } = data;

  // Create HTML table
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title || filename}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1e40af; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #3b82f6; color: white; padding: 12px; text-align: left; font-weight: 600; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .header { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #3b82f6; }
        .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title || filename}</h1>
        <p>Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell ?? '-'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>This is a computer-generated document. No signature required.</p>
      </div>
    </body>
    </html>
  `;

  // Create blob and trigger print dialog
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');

  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
      // Clean up after a delay to allow print dialog to open
      setTimeout(() => {
        printWindow.close();
        URL.revokeObjectURL(url);
      }, 100);
    };
  }
}

/**
 * Format attendance data for export
 */
export function formatAttendanceForExport(attendance: any[]) {
  const headers = [
    'Date',
    'Employee',
    'Check-In',
    'Check-Out',
    'Type',
    'Status',
    'Work Hours',
    'Late (min)',
    'Overtime (min)',
    'Location Verified'
  ];

  const rows = attendance.map(record => [
    new Date(record.attendanceDate).toLocaleDateString('en-IN'),
    record.userName || '-',
    record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
    record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
    record.type || '-',
    record.status || '-',
    record.totalWorkMinutes ? `${Math.floor(record.totalWorkMinutes / 60)}h ${record.totalWorkMinutes % 60}m` : '-',
    record.lateMinutes || 0,
    record.overtimeMinutes || 0,
    record.isLocationVerified ? 'Yes' : 'No'
  ]);

  return { headers, rows };
}

/**
 * Format leave data for export
 */
export function formatLeavesForExport(leaves: any[]) {
  const headers = [
    'Leave ID',
    'Employee',
    'Leave Type',
    'Start Date',
    'End Date',
    'Total Days',
    'Status',
    'Reason',
    'Applied On'
  ];

  const rows = leaves.map(leave => [
    leave.leaveId || '-',
    leave.userName || '-',
    leave.leaveType?.replace(/_/g, ' ') || '-',
    new Date(leave.startDate).toLocaleDateString('en-IN'),
    new Date(leave.endDate).toLocaleDateString('en-IN'),
    leave.totalDays || 0,
    leave.status || '-',
    leave.reason || '-',
    new Date(leave.createdAt).toLocaleDateString('en-IN')
  ]);

  return { headers, rows };
}

/**
 * Format monthly report for export
 */
export function formatMonthlyReportForExport(report: any) {
  const headers = [
    'Metric',
    'Value'
  ];

  const rows = [
    ['Employee', report.userName || '-'],
    ['Period', `${report.month}/${report.year}`],
    ['Total Working Days', report.totalWorkingDays || 0],
    ['Present Days', report.presentDays || 0],
    ['Absent Days', report.absentDays || 0],
    ['Late Days', report.lateDays || 0],
    ['On Leave', report.onLeaveDays || 0],
    ['Holidays', report.holidays || 0],
    ['Total Work Hours', report.totalWorkHours ? `${Math.floor(report.totalWorkHours / 60)}h ${report.totalWorkHours % 60}m` : '-'],
    ['Average Work Hours', report.averageWorkHours ? `${Math.floor(report.averageWorkHours / 60)}h ${report.averageWorkHours % 60}m` : '-'],
    ['Total Overtime', report.totalOvertime ? `${Math.floor(report.totalOvertime / 60)}h ${report.totalOvertime % 60}m` : '-'],
    ['Attendance Rate', report.attendanceRate ? `${report.attendanceRate.toFixed(1)}%` : '-']
  ];

  return { headers, rows };
}
