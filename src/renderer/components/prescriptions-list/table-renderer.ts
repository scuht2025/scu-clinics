/**
 * Table rendering utilities for prescriptions list
 */

export interface PrescriptionTableData {
  id: number;
  patientName: string;
  patientId: string;
  doctorName: string;
  prescriptionDate?: string;
  prescriptionTime?: string;
}

export class PrescriptionsTableRenderer {
  static renderPrescriptionsTable(prescriptions: PrescriptionTableData[]): string {
    if (prescriptions.length === 0) {
      return '<p style="text-align: center; color: #666;">لا توجد روشتات محفوظة</p>';
    }

    return `
      <table class="medications-table">
        <thead>
          <tr>
            <th>رقم الروشتة</th>
            <th>اسم المريض</th>
            <th>رقم المريض</th>
            <th>اسم الطبيب</th>
            <th>التاريخ</th>
            <th>الوقت</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${prescriptions.map(prescription => `
            <tr>
              <td>${prescription.id}</td>
              <td>${prescription.patientName}</td>
              <td>${prescription.patientId}</td>
              <td>${prescription.doctorName}</td>
              <td>${prescription.prescriptionDate || ''}</td>
              <td>${prescription.prescriptionTime || ''}</td>
              <td>
                <button class="btn btn-small" onclick="editPrescription(${prescription.id})">تعديل</button>
                <button class="btn btn-small btn-danger" onclick="deletePrescription(${prescription.id})">حذف</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  static renderLoadingState(): string {
    return '<p style="text-align: center; color: #666;">جاري تحميل الروشتات...</p>';
  }

  static renderEmptyState(): string {
    return '<p style="text-align: center; color: #666;">لا توجد روشتات محفوظة</p>';
  }
}
