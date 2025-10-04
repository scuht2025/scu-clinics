/**
 * Table rendering utilities for reports list
 */

export interface ReportTableData {
  id: number;
  patientName: string;
  patientId: string;
  doctorName: string;
  reportDate?: string;
  reportTime?: string;
  content?: string;
}

export class ReportsTableRenderer {
  static renderReportsTable(reports: ReportTableData[]): string {
    if (reports.length === 0) {
      return '<p style="text-align: center; color: #666;">لا توجد تقارير محفوظة</p>';
    }

    return `
      <table class="medications-table">
        <thead>
          <tr>
            <th>رقم التقرير</th>
            <th>اسم المريض</th>
            <th>رقم المريض</th>
            <th>اسم الطبيب</th>
            <th>التاريخ</th>
            <th>الوقت</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${reports.map(report => `
            <tr>
              <td>${report.id}</td>
              <td>${report.patientName}</td>
              <td>${report.patientId}</td>
              <td>${report.doctorName}</td>
              <td>${report.reportDate || ''}</td>
              <td>${report.reportTime || ''}</td>
              <td>
                <button class="btn btn-small" onclick="editReport(${report.id})">تعديل</button>
                <button class="btn btn-small btn-danger" onclick="deleteReport(${report.id})">حذف</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  static renderLoadingState(): string {
    return '<p style="text-align: center; color: #666;">جاري تحميل التقارير...</p>';
  }

  static renderEmptyState(): string {
    return '<p style="text-align: center; color: #666;">لا توجد تقارير محفوظة</p>';
  }
}
