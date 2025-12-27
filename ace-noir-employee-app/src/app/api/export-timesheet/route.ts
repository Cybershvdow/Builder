import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const { format: exportFormat, entries, period, user, totalHours, totalPay } = await request.json()

    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Ace Noir Cleaning Services'

    if (exportFormat === 'csv') {
      return exportCSV(entries, period, user, totalHours, totalPay, companyName)
    } else if (exportFormat === 'excel') {
      return exportExcel(entries, period, user, totalHours, totalPay, companyName)
    } else if (exportFormat === 'pdf') {
      return exportPDF(entries, period, user, totalHours, totalPay, companyName)
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'MM/dd/yyyy')
}

function formatTime(dateStr: string) {
  return format(new Date(dateStr), 'hh:mm a')
}

function exportCSV(
  entries: any[],
  period: any,
  user: any,
  totalHours: number,
  totalPay: number,
  companyName: string
) {
  const headers = ['Date', 'Employee', 'Clock In', 'Clock Out', 'Facility', 'Hours', 'Status']

  const rows = entries.map((entry) => [
    formatDate(entry.clock_in),
    entry.user?.full_name || user?.full_name || '',
    formatTime(entry.clock_in),
    entry.clock_out ? formatTime(entry.clock_out) : '-',
    entry.facility?.name || '-',
    entry.total_hours?.toFixed(2) || '-',
    entry.status,
  ])

  // Add summary rows
  rows.push([])
  rows.push(['SUMMARY'])
  rows.push(['Pay Period:', `${formatDate(period.start_date)} - ${formatDate(period.end_date)}`])
  rows.push(['Total Hours:', totalHours.toFixed(2)])
  rows.push(['Total Pay:', `$${totalPay.toFixed(2)}`])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="timesheet-${formatDate(period.start_date)}.csv"`,
    },
  })
}

async function exportExcel(
  entries: any[],
  period: any,
  user: any,
  totalHours: number,
  totalPay: number,
  companyName: string
) {
  // Simple CSV format for Excel compatibility (without ExcelJS dependency)
  const headers = ['Date', 'Employee', 'Clock In', 'Clock Out', 'Facility', 'Hours', 'Status']

  const rows = entries.map((entry) => [
    formatDate(entry.clock_in),
    entry.user?.full_name || user?.full_name || '',
    formatTime(entry.clock_in),
    entry.clock_out ? formatTime(entry.clock_out) : '-',
    entry.facility?.name || '-',
    entry.total_hours?.toFixed(2) || '-',
    entry.status,
  ])

  // Add summary
  rows.push([])
  rows.push([companyName, 'TIMESHEET'])
  rows.push(['Pay Period:', `${formatDate(period.start_date)} - ${formatDate(period.end_date)}`])
  rows.push(['Total Hours:', totalHours.toFixed(2)])
  rows.push(['Total Pay:', `$${totalPay.toFixed(2)}`])

  const csvContent = [
    headers.join('\t'),
    ...rows.map((row) => row.join('\t')),
  ].join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel',
      'Content-Disposition': `attachment; filename="timesheet-${formatDate(period.start_date)}.xlsx"`,
    },
  })
}

async function exportPDF(
  entries: any[],
  period: any,
  user: any,
  totalHours: number,
  totalPay: number,
  companyName: string
) {
  // Generate HTML for PDF (can be converted to PDF on client side or use a PDF service)
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #C9A86C; }
        .header h1 { color: #1a1a1a; margin: 0; }
        .header p { color: #666; margin: 5px 0; }
        .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .info-box { background: #f9f9f9; padding: 15px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #1a1a1a; color: white; padding: 12px; text-align: left; }
        td { padding: 10px 12px; border-bottom: 1px solid #eee; }
        tr:hover { background: #f9f9f9; }
        .summary { background: #C9A86C; color: #1a1a1a; padding: 20px; border-radius: 8px; margin-top: 30px; }
        .summary h3 { margin: 0 0 15px 0; }
        .summary-row { display: flex; justify-content: space-between; margin: 5px 0; }
        .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${companyName}</h1>
        <p>Employee Timesheet</p>
      </div>

      <div class="info">
        <div class="info-box">
          <strong>Employee:</strong> ${user?.full_name || 'All Employees'}<br>
          <strong>Email:</strong> ${user?.email || 'N/A'}
        </div>
        <div class="info-box">
          <strong>Pay Period:</strong><br>
          ${formatDate(period.start_date)} - ${formatDate(period.end_date)}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Employee</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Facility</th>
            <th>Hours</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map((entry) => `
            <tr>
              <td>${formatDate(entry.clock_in)}</td>
              <td>${entry.user?.full_name || user?.full_name || ''}</td>
              <td>${formatTime(entry.clock_in)}</td>
              <td>${entry.clock_out ? formatTime(entry.clock_out) : '-'}</td>
              <td>${entry.facility?.name || '-'}</td>
              <td>${entry.total_hours?.toFixed(2) || '-'}</td>
              <td>${entry.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="summary">
        <h3>Summary</h3>
        <div class="summary-row">
          <span>Total Hours:</span>
          <strong>${totalHours.toFixed(2)} hours</strong>
        </div>
        <div class="summary-row">
          <span>Hourly Rate:</span>
          <strong>$${(user?.hourly_rate || 15).toFixed(2)}/hr</strong>
        </div>
        <div class="summary-row">
          <span>Total Pay:</span>
          <strong>$${totalPay.toFixed(2)}</strong>
        </div>
      </div>

      <div class="footer">
        <p>Generated on ${format(new Date(), 'MMMM d, yyyy')} | ${companyName}</p>
      </div>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="timesheet-${formatDate(period.start_date)}.html"`,
    },
  })
}
