/**
 * Prescription view template generator
 * Handles the detailed prescription display template
 */

export interface PrescriptionViewData {
  id: number;
  patientName: string;
  patientId: string;
  age?: string;
  socialNumber?: string;
  gender?: string;
  diagnoses?: string;
  doctorName: string;
  doctorDegree?: string;
  consultation: string;
  prescriptionDate: string;
  prescriptionTime: string;
  medications: string;
  pharmacies: string;
}

export class PrescriptionViewTemplate {
  static generateViewTemplate(prescription: PrescriptionViewData): string {
    const medications = JSON.parse(prescription.medications || '[]');
    const pharmacies = JSON.parse(prescription.pharmacies || '[]');

    return `
      <div class="prescription-header">
        <div id="hospitalLogoHeader" class="clinic-logo" style="text-align:center; margin-bottom:8px;"></div>
        <div class="clinic-title" id="hospitalNameHeader">&nbsp;</div>
        <div class="clinic-subtitle">عرض الروشتة</div>
      </div>

      <!-- Print-only patient/doctor info rows -->
      <div class="print-patient-info print-only">
        <div class="print-patient-right">
          <div class="print-data-row">
            <span class="print-data-label">الطبيب: <span class="print-data-value" id="printDoctorName"></span></span>
          </div>
          <div class="print-data-row">
            <span class="print-data-label">درجة الطبيب: <span class="print-data-value" id="printDoctorDegree"></span></span>
          </div>
        </div>
        <div class="print-patient-left">
          <div class="print-data-row">
            <span class="print-data-label">التاريخ: <span class="print-data-value" id="printPrescriptionDate"></span></span>
          </div>
          <div class="print-data-row">
            <span class="print-data-label">الوقت: <span class="print-data-value" id="printPrescriptionTime"></span></span>
          </div>
        </div>
      </div>

      <div class="print-only" style="margin-bottom: 12px;">
        <div class="print-data-row" style="border-bottom: 1px solid #000; padding-bottom: 8px;">
          <span class="print-data-label">اسم المريض: <span class="print-data-value" id="printPatientName"></span></span>
        </div>
        <div class="print-data-row" style="border-bottom: 1px solid #000; padding-bottom: 8px;">
          <span class="print-data-label">السن: <span class="print-data-value" id="printAge"></span></span>
          <span class="print-data-label" style="margin-left: 20px;">النوع: <span class="print-data-value" id="printGender"></span></span>
          <span class="print-data-label" style="margin-left: 20px;">الرقم القومي: <span class="print-data-value" id="printSocialNumber"></span></span>
        </div>
        <div class="print-data-row" style="border-bottom: 1px solid #000; padding-bottom: 8px;">
          <span class="print-data-label">التشخيص: <span class="print-data-value" id="printDiagnoses"></span></span>
        </div>
      </div>

      <div class="prescription-form prescription-view">
        ${this.generatePatientInfoSection(prescription)}
        ${this.generateMedicationsSection(medications)}
        ${this.generateFooterSection(pharmacies)}
        ${this.generateActionButtons()}
      </div>
    `;
  }

  private static generatePatientInfoSection(prescription: PrescriptionViewData): string {
    return `
      <!-- Patient Information -->
      <div class="form-row">
        <div class="form-group">
          <label>اسم المريض:</label>
          <div class="display-value" data-field="patientName">${prescription.patientName}</div>
        </div>
        <div class="form-group">
          <label>السن:</label>
          <div class="display-value" data-field="age">${prescription.age || 'غير محدد'}</div>
        </div>
        <div class="form-group">
          <label>النوع:</label>
          <div class="display-value" data-field="gender">${prescription.gender || 'غير محدد'}</div>
        </div>
        <div class="form-group">
          <label>الرقم القومي:</label>
          <div class="display-value" data-field="socialNumber">${prescription.socialNumber || 'غير محدد'}</div>
        </div>
        <div class="form-group">
          <label>رقم المريض:</label>
          <div class="display-value" data-field="patientId">${prescription.patientId}</div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>التشخيص:</label>
          <div class="display-value" data-field="diagnoses">${prescription.diagnoses || 'غير محدد'}</div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>الطبيب:</label>
          <div class="display-value" data-field="doctorName">د/ ${prescription.doctorName}</div>
        </div>
        <div class="form-group">
          <label>درجة الطبيب:</label>
          <div class="display-value" data-field="doctorDegree">${prescription.doctorDegree || 'غير محدد'}</div>
        </div>
        <div class="form-group">
          <label>العيادة:</label>
          <div class="display-value" data-field="consultation">${prescription.consultation}</div>
        </div>
        <div class="form-group half">
          <label>التاريخ:</label>
          <div class="display-value" data-field="prescriptionDate">${prescription.prescriptionDate}</div>
        </div>
        <div class="form-group half">
          <label>الوقت:</label>
          <div class="display-value" data-field="prescriptionTime">${prescription.prescriptionTime}</div>
        </div>
      </div>
    `;
  }

  private static generateMedicationsSection(medications: any[]): string {
    return `
      <!-- Medications Section -->
      <div class="medications-section">
        <h3 class="section-title">الأدوية</h3>
        <table class="medications-table">
          <thead>
            <tr>
              <th>م</th>
              <th>اسم الدواء</th>
              <th>مستوى الوصف</th>
              <th>طريقة الإعطاء</th>
              <th>الجرعة</th>
              <th>التكرار</th>
              <th>الاحتياطات</th>
              <th>المدة</th>
            </tr>
          </thead>
          <tbody>
            ${medications.length > 0 ? 
              medications.map((med: any, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${med.drug || ''}</td>
                  <td>${med.prescribingLevel || ''}</td>
                  <td>${med.route || ''}</td>
                  <td>${med.dose || ''}</td>
                  <td>${med.frequency || ''}</td>
                  <td>${med.precautions || ''}</td>
                  <td>${med.duration || ''}</td>
                </tr>
              `).join('') :
              '<tr><td colspan="8" style="text-align: center; color: #666;">لا توجد أدوية</td></tr>'
            }
          </tbody>
        </table>

        <!-- Print-only medications table -->
        <table class="print-medications-table print-only" id="printMedicationsTable"></table>
      </div>
    `;
  }

  private static generateFooterSection(pharmacies: string[]): string {
    return `
      <!-- Footer Section -->
      <div class="prescription-footer">
        <div class="footer-row">
          <div class="footer-section">
            <h4>توقيع الطبيب</h4>
            <div class="signature-box"> </div>
          </div>
          <div class="footer-section">
            <h4>ختم المنشأة</h4>
            <div class="signature-box"> </div>
          </div>
        </div>

        ${pharmacies.length > 0 ? `
          <div class="footer-section">
            <h4>الصيدليات المتعاقدة</h4>
            <div class="pharmacies-list pharmacies-columns">
              ${pharmacies.map((pharmacy: string) => `
                <div class="pharmacy-item">• ${pharmacy}</div>
              `).join('')}
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 8px;">
              اختيار الصيدلية لصرف الدواء من حق المريض فقط
            </p>
          </div>
        ` : ''}

        <!-- Print-only signatures -->
        <div class="print-footer print-only">
          <div class="print-footer-section">
            <div class="signature-print-box">توقيع الطبيب</div>
          </div>
          <div class="print-footer-section">
            <div class="signature-print-box">ختم المنشأة</div>
          </div>
        </div>

        <!-- Print-only pharmacies -->
        <div class="print-pharmacies print-only" id="printPharmacies"></div>
      </div>
    `;
  }

  private static generateActionButtons(): string {
    return `
      <!-- Action Buttons -->
      <div style="text-align: center; margin-top: 24px;" class="no-print">
        <button class="btn btn-primary" id="printPrescriptionBtn">طباعة الروشتة</button>
        <button class="btn" id="printOldStyleBtn">طباعة شكل قديم</button>
        <button class="btn" id="backToListBtn">العودة للقائمة</button>
        <button class="btn" id="editPrescriptionBtn">تعديل الروشتة</button>
      </div>
    `;
  }
}
