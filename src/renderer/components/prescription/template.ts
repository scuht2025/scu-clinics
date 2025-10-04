interface TemplateData {
  doctors: Array<{ name: string }>;
  clinics: Array<{ name: string }>;
  pharmacies: Array<{ name: string }>;
}

const buildOptions = (items: Array<{ name: string }>, emptyLabel: string) => {
  const options = items
    .map(item => `<option value="${item.name}">${item.name}</option>`)
    .join('');
  return `<option value="">${emptyLabel}</option>${options}`;
};

const buildPharmacies = (items: Array<{ name: string }>) =>
  items
    .map((pharmacy, index) => (
      `<div class="checkbox-option">
          <input type="checkbox" id="pharmacy${index + 1}" name="pharmacy" value="${pharmacy.name}">
          <label for="pharmacy${index + 1}">${pharmacy.name}</label>
        </div>`
    ))
    .join('');

export const buildPrescriptionFormTemplate = ({ doctors, clinics, pharmacies }: TemplateData) => `
  <div class="prescription-header">
    <div class="clinic-title">مستشفى جامعة قناة السويس التخصصي</div>
    <div class="clinic-subtitle">الروشتة الإلكترونية</div>
  </div>

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
      <span class="print-data-label">التشخيص: <span class="print-data-value" id="printDiagnoses"></span></span>
    </div>
  </div>

  <div class="prescription-form">
    <div class="form-row">
      <div class="form-group">
        <label>الطبيب</label>
        <select id="doctorName" required>
          ${buildOptions(doctors, 'اختر الطبيب')}
        </select>
      </div>
      <div class="form-group">
        <label>درجة الطبيب</label>
        <select id="doctorDegree" required>
          <option value="">اختر الدرجة</option>
          <option value="Consultant">استشاري</option>
          <option value="Family Doctor"> طبيب أسرة</option>
          <option value="Specialist">أخصائي</option>
        </select>
      </div>
      <div class="form-group half">
        <label>التاريخ</label>
        <input type="date" id="prescriptionDate" required>
      </div>
      <div class="form-group half">
        <label>الوقت</label>
        <input type="time" id="prescriptionTime" required>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>العيادة</label>
        <select id="consultation">
          ${buildOptions(clinics, 'اختر التخصص')}
        </select>
      </div>
      <div class="form-group">
        <label>اسم المريض</label>
        <input type="text" id="patientName" placeholder="اسم المريض" required>
      </div>
      <div class="form-group">
        <label>رقم المريض</label>
        <input type="text" id="patientId" placeholder="رقم المريض">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>التشخيص</label>
        <input type="text" id="diagnoses" placeholder="التشخيص">
      </div>
    </div>

    <div class="medications-section">
      
      <table class="medications-table" id="medicationsTable">
        <thead>
          <tr>
            <th>اسم الدواء</th>
            <th>مستوى الوصف</th>
            <th>موافقة مسبقة/بروتوكول</th>
            <th>طريقة الإعطاء</th>
            <th>الجرعة</th>
            <th>التكرار</th>
            <th>الاحتياطات</th>
            <th>المدة</th>
            <th class="no-print">حذف</th>
          </tr>
        </thead>
        <tbody id="medicationsBody"></tbody>
      </table>
      <button class="add-row-btn no-print" id="addMedicationBtn">إضافة دواء</button>
      <table class="print-medications-table print-only" id="printMedicationsTable"></table>
    </div>

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

      <div class="footer-section">
        <h4>الصيدليات المتعاقدة</h4>
        <div class="pharmacies-columns">
          ${buildPharmacies(pharmacies)}
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 8px;">
          اختيار الصيدلية لصرف الدواء من حق المريض فقط
        </p>
      </div>

      <div class="print-footer print-only">
        <div class="print-footer-section">
          <div class="signature-print-box">توقيع الطبيب</div>
        </div>
        <div class="print-footer-section">
          <div class="signature-print-box">ختم المنشأة</div>
        </div>
      </div>

      <div class="print-pharmacies print-only" id="printPharmacies"></div>

      <div style="text-align: center; margin-top: 16px;" class="no-print">
        <button class="btn btn-primary" id="savePrescriptionBtn">حفظ الروشتة</button>
        <button class="btn" id="printPrescriptionBtn">طباعة الروشتة</button>
        <button class="btn" id="printOldStyleBtn">طباعة شكل قديم</button>
        <button class="btn" id="newPrescriptionBtn">روشتة جديدة</button>
      </div>
    </div>
  </div>
`;
