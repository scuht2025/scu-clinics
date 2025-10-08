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
    <div id="hospitalLogoHeader" class="clinic-logo" style="text-align:center; margin-bottom:8px;"></div>
    <div class="clinic-title" id="hospitalNameHeader">&nbsp;</div>
    <div class="clinic-subtitle">الروشتة الإلكترونية</div>
  </div>

  <table class="print-header-table print-only">
    <tr>
      <th class="doctor-name-col">اسم الطبيب</th>
      <th class="doctor-degree-col">درجة الطبيب</th>
      <th class="clinic-col">العيادة</th>
      <th class="datetime-col">التاريخ والوقت</th>
    </tr>
    <tr>
      <td class="doctor-name-col" id="printDoctorName"></td>
      <td class="doctor-degree-col" id="printDoctorDegree"></td>
      <td class="clinic-col" id="printConsultation"></td>
      <td class="datetime-col" id="printDateTime"></td>
    </tr>
  </table>

  <table class="print-header-table print-only">
    <tr>
      <th class="patient-name-col">اسم المريض</th>
      <th class="age-col">السن</th>
      <th class="gender-col">النوع</th>
      <th class="social-number-col">الرقم القومي</th>
      <th class="patient-number-col">رقم المريض</th>
    </tr>
    <tr>
      <td class="patient-name-col" id="printPatientName"></td>
      <td class="age-col" id="printAge"></td>
      <td class="gender-col" id="printGender"></td>
      <td class="social-number-col" id="printSocialNumber"></td>
      <td class="patient-number-col" id="printPatientId"></td>
    </tr>
    <tr class="diagnosis-row">
      <td class="diagnosis-label">التشخيص:</td>
      <td class="diagnosis-data" colspan="4" id="printDiagnoses"></td>
    </tr>
  </table>

  <div class="prescription-form">
    <div class="form-row grid-5">
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
      <div class="form-group">
        <label>العيادة</label>
        <select id="consultation">
          ${buildOptions(clinics, 'اختر التخصص')}
        </select>
      </div>
      <div class="form-group">
        <label>التاريخ</label>
        <input type="date" id="prescriptionDate" required>
      </div>
      <div class="form-group">
        <label>الوقت</label>
        <input type="time" id="prescriptionTime" required>
      </div>
    </div>

    <div class="form-row grid-5-second">
      <div class="form-group">
        <label>اسم المريض</label>
        <input type="text" id="patientName" placeholder="اسم المريض" required>
      </div>
      <div class="form-group">
        <label>السن</label>
        <input type="number" id="age" placeholder="السن">
      </div>
      <div class="form-group">
        <label>النوع</label>
        <select id="gender">
          <option value="">اختر النوع</option>
          <option value="ذكر">ذكر</option>
          <option value="أنثي">أنثي</option>
        </select>
      </div>
      <div class="form-group">
        <label>الرقم القومي</label>
        <input type="number" id="socialNumber" placeholder="الرقم القومي">
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
