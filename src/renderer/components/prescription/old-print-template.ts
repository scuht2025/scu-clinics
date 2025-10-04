export interface OldPrintPrescriptionData {
  patientName: string;
  patientId: string;
  diagnoses: string;
  doctorName: string;
  doctorDegree: string;
  consultation?: string;
  prescriptionDate?: string; // YYYY-MM-DD
  prescriptionTime?: string; // HH:mm
  medications: Array<{
    drug?: string;
    genericName?: string;
    prescribingLevel?: string;
    preAuthorizationProtocol?: string;
    route?: string;
    dose?: string;
    frequency?: string;
    precautions?: string;
    duration?: string;
  }>;
  selectedPharmacies: string[]; // from current prescription
  allPharmacies: string[]; // fetched from DB
}

// Format date/time using Arabic/Egyptian locale, gracefully fallback to raw strings
function formatArEgDateTime(date?: string, time?: string): string {
  if (!date && !time) return '';
  try {
    // Attempt to construct a Date from separate date and time
    if (date && time) {
      const d = new Date(`${date}T${time}`);
      if (!isNaN(d.getTime())) {
        const fmt = new Intl.DateTimeFormat('ar-EG', {
          year: 'numeric', month: 'numeric', day: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: false
        });
        return fmt.format(d);
      }
    }
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        const fmt = new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
        return fmt.format(d);
      }
    }
    return `${date ?? ''} ${time ?? ''}`.trim();
  } catch {
    return `${date ?? ''} ${time ?? ''}`.trim();
  }
}

export function renderOldPrintHTML(data: OldPrintPrescriptionData): string {
  const meds = Array.isArray(data.medications) ? data.medications : [];
  // Build rows: ensure at least 9 rows; if >9, render all
  const minRows = 9;
  const rows: string[] = [];

  const getApprovedCell = (preAuth?: string) => {
    const approved = !!(preAuth && String(preAuth).trim().length > 0);
    return approved ? 'Yes' : '<span class="no">No</span>';
  };

  meds.forEach((med, idx) => {
    const no = idx + 1;
    const genericOnly = (med.genericName || '').trim() || (med.drug || '').trim();
    rows.push(`
      <tr>
        <td>${no}</td>
        <td>${escapeHtml(genericOnly)}</td>
        <td>${escapeHtml(med.prescribingLevel || '')}</td>
        <td class="approved-cell">${getApprovedCell(med.preAuthorizationProtocol)}</td>
        <td>${escapeHtml(med.route || '')}</td>
        <td>${escapeHtml(med.dose || '')}</td>
        <td>${escapeHtml(med.frequency || '')}</td>
        <td>${escapeHtml(med.precautions || '')}</td>
        <td>${escapeHtml(med.duration || '')}</td>
      </tr>
    `);
  });

  const padCount = Math.max(0, minRows - meds.length);
  for (let i = 0; i < padCount; i++) {
    const no = meds.length + i + 1;
    rows.push(`
      <tr>
        <td>${no}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `);
  }

  // Pharmacies: list all from DB; mark selected with a checkmark
  const allPhs = Array.isArray(data.allPharmacies) ? data.allPharmacies : [];
  const selectedSet = new Set((data.selectedPharmacies || []).map((p) => (p || '').trim()));
  const rowSpan = Math.max(1, allPhs.length || 1);
  const pharmacyRows: string[] = [];
  allPhs.forEach((ph, idx) => {
    const mark = selectedSet.has(ph) ? '✔' : '';
    const infoCell = idx === 0
      ? `<td style="width:40%" rowspan="${rowSpan}" class="center-cell">اختيار الصيدلية لصرف الدواء من حق المريض فقط</td>`
      : '';
    pharmacyRows.push(`
      <tr>
        <td>${escapeHtml(ph)}</td>
        <td class="checkbox-cell">${mark}</td>
        <td></td>
        ${infoCell}
      </tr>
    `);
  });
  if (pharmacyRows.length === 0) {
    pharmacyRows.push(`
      <tr>
        <td></td>
        <td class="checkbox-cell"></td>
        <td></td>
        <td style="width:40%" class="center-cell">اختيار الصيدلية لصرف الدواء من حق المريض فقط</td>
      </tr>
    `);
  }

  const dateTime = formatArEgDateTime(data.prescriptionDate, data.prescriptionTime);

  // NOTE: CSS is scoped under .old-print-root to avoid affecting the app UI
  return `
  <div class="old-print-root" lang="ar" dir="rtl">
    <style>
      @page { size: A4 landscape; margin: 10px; }
      .old-print-root { font-family: Tahoma, Arial, sans-serif; margin: 0; direction: rtl; zoom: 0.94; }
      .old-print-root table { width: 100%; border-collapse: collapse; font-size: 14px; }
      .old-print-root td, .old-print-root th { border: 1px solid #000; padding: 4px; }
      .old-print-root .header-table td { font-weight: bold; }
      .old-print-root .title { background: #d9eaf7; text-align: center; font-size: 19px; font-weight: 800; padding: 8px; }
      /* Make very top row (both cells) larger and bolder */
      .old-print-root .header-table tr:first-child td { font-size: 19px; font-weight: 800; padding: 6px; }
      .old-print-root .section-title { background: #1d70b8; color: white; font-weight: bold; text-align: center; }
      .old-print-root .section-title th { font-size: 13px; white-space: normal; word-wrap: break-word; line-height: 1.2; }
      .old-print-root .med-table { table-layout: fixed; }
      .old-print-root .no { background: red; color: white; font-weight: bold; padding: 2px 6px; display: inline-block; }
      .old-print-root .footer-note { text-align: center; font-weight: bold; padding: 10px; }
      .old-print-root .signature { font-weight: bold; text-align: center; }
      .old-print-root .contract-table td, .old-print-root .contract-table th { border: 1px solid #000; padding: 4px; }
      .old-print-root .contract-table th { background: #1d70b8; color: white; text-align: center; }
      .old-print-root .right-align { text-align: right; }
      .old-print-root .center-cell { text-align: center; vertical-align: middle; font-weight: bold; }
      .old-print-root .checkbox-cell { text-align: center; vertical-align: middle; }
      .old-print-root table, .old-print-root tr, .old-print-root td, .old-print-root th { page-break-inside: avoid; break-inside: avoid; }
    </style>

    <!-- Header Table -->
    <table class="header-table" width="100%">
      <tr>
        <td colspan="2" style="text-align:right; border:none;">مستشفى جامعة قناة السويس التخصصي</td>
        <td colspan="2" class="title" style="border:none;">الروشتة الإلكترونية</td>
      </tr>
      <tr>
        <td class="right-align" style="width:20%">اسم الطبيب</td>
        <td style="width:30%">${escapeHtml(data.doctorName || '')}</td>
        <td style="width:25%">رقم المريض الطبي</td>
        <td style="width:25%">الوقت والتاريخ</td>
      </tr>
      <tr>
        <td class="right-align">درجة الطبيب</td>
        <td>${escapeHtml(data.doctorDegree || '')}</td>
        <td>${escapeHtml(data.patientId || '')}</td>
        <td>${escapeHtml(dateTime)}</td>
      </tr>
      <tr>
        <td class="right-align">اسم المريض</td>
        <td colspan="3">${escapeHtml(data.patientName || '')}</td>
      </tr>
      <tr>
        <td class="right-align">التشخيص</td>
        <td colspan="3">${escapeHtml(data.diagnoses || '')}</td>
      </tr>
    </table>

    <!-- Medications Table -->
    <table dir="ltr" class="med-table" style="margin-top: 4px;">
      <colgroup>
        <col style="width:3%">
        <col style="width:41%">
        <col style="width:10%">
        <col style="width:7%">
        <col style="width:10%">
        <col style="width:8%">
        <col style="width:8%">
        <col style="width:7%">
        <col style="width:6%">
      </colgroup>
      <tr class="section-title">
        <th>No</th>
        <th>Drug - Dose - Form</th>
        <th>Prescribing level</th>
        <th>Approved/Not</th>
        <th>Route of administration</th>
        <th>Dose/Day</th>
        <th>Frequency</th>
        <th>Precautions</th>
        <th>Duration</th>
      </tr>
      ${rows.join('')}
    </table>

    <!-- Contract & Signature Table -->
    <table class="contract-table" width="100%" dir="rtl" style="margin-top: 6px;">
      <tr>
        <th style="width:30%">الصيدليات المتعاقدة</th>
        <th style="width:5%">✔</th>
        <th style="width:25%">توقيع المنتفع</th>
        <td style="width:40%" class="center-cell" style="border-left: 1px solid #000;">&nbsp;</td>
      </tr>
      ${pharmacyRows.join('')}
    </table>
    <table width="100%" style="margin-top: 4px;">
      <tr>
        <td class="signature">ختم الطبيب</td>
        <td class="signature">ختم المنشأة</td>
      </tr>
    </table>
  </div>
  `;
}

function escapeHtml(input: string): string {
  return (input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
