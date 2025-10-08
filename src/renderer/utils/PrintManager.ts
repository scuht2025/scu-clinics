/**
 * Unified Print Manager for consistent print handling across all components
 */

import { apiService } from '../services/ApiService';
import { renderOldPrintHTML, OldPrintPrescriptionData } from '../components/prescription/old-print-template';

export class PrintManager {
  private static instance: PrintManager;
  
  public static getInstance(): PrintManager {
    if (!PrintManager.instance) {
      PrintManager.instance = new PrintManager();
    }
    return PrintManager.instance;
  }

  private constructor() {
    // Global hooks to cover Ctrl+P or any direct window.print usage
    window.addEventListener('beforeprint', () => {
      // Ensure print-only content is ready regardless of where print is initiated
      this.preparePrintViewAuto();
    });
    window.addEventListener('afterprint', () => {
      // no-op; browser will return focus naturally
    });
  }

  /**
   * Prepare print view with prescription data (shared by form and view flows)
   */
  public preparePrintView(prescriptionData: any): void {
    try {
      // Hospital name header
      this.applyHospitalHeader();
      // Parse medications and pharmacies
      const medications = JSON.parse(prescriptionData.medications || '[]');
      const pharmacies = JSON.parse(prescriptionData.pharmacies || '[]');

      // Fill print-only elements with prescription data
      const setText = (id: string, value: string) => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = value;
        }
      };

      // Set patient and doctor info for new table structure
      setText('printDoctorName', prescriptionData.doctorName || '');
      setText('printDoctorDegree', prescriptionData.doctorDegree || '');
      setText('printConsultation', prescriptionData.consultation || '');
      setText('printDateTime', `${prescriptionData.prescriptionDate || ''} ${prescriptionData.prescriptionTime || ''}`);
      setText('printPatientName', prescriptionData.patientName || '');
      setText('printAge', prescriptionData.age || '');
      setText('printGender', prescriptionData.gender || '');
      setText('printSocialNumber', prescriptionData.socialNumber || '');
      setText('printPatientId', prescriptionData.patientId || '');
      setText('printDiagnoses', prescriptionData.diagnoses || '');

      // Build medications print table
      const table = document.getElementById('printMedicationsTable') as HTMLTableElement | null;
      if (table) {
        table.innerHTML = '';
        const thead = document.createElement('thead');
        thead.innerHTML = `
          <tr>
            <th>اسم الدواء</th>
            <th>مستوى الوصف</th>
            <th>موافقة مسبقة/بروتوكول</th>
            <th>طريقة الإعطاء</th>
            <th>الجرعة</th>
            <th>التكرار</th>
            <th>الاحتياطات</th>
            <th>المدة</th>
          </tr>
        `;
        const tbody = document.createElement('tbody');

        if (medications.length > 0) {
          medications.forEach((med: any) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${med.drug || ''}</td>
              <td>${med.prescribingLevel || ''}</td>
              <td>${med.preAuthorizationProtocol || ''}</td>
              <td>${med.route || ''}</td>
              <td>${med.dose || ''}</td>
              <td>${med.frequency || ''}</td>
              <td>${med.precautions || ''}</td>
              <td>${med.duration || ''}</td>
            `;
            tbody.appendChild(tr);
          });
        } else {
          // Add empty row if no medications
          const empty = document.createElement('tr');
          empty.innerHTML = `
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          `;
          tbody.appendChild(empty);
        }

        table.appendChild(thead);
        table.appendChild(tbody);
      }

      // Pharmacies list
      const printPh = document.getElementById('printPharmacies');
      if (printPh) {
        if (pharmacies.length > 0) {
          printPh.innerHTML = `
            <div style="margin-top: 20px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px;">الصيدليات المتعاقدة:</h4>
              <div class="print-pharmacies-columns" style="font-size: 12px;">
                ${pharmacies.map((pharmacy: string) => `• ${pharmacy}`).join('')}
              </div>
              <p style="font-size: 10px; color: #666; margin-top: 8px;">
                اختيار الصيدلية لصرف الدواء من حق المريض فقط
              </p>
            </div>
          `;
        } else {
          printPh.innerHTML = '';
        }
      }
    } catch (e) {
      console.error('Error preparing print view', e);
    }
  }

  /**
   * Prepare print view based on current screen (form or view)
   */
  public preparePrintViewAuto(): void {
    const inView = document.querySelector('.prescription-view');
    if (inView) {
      const data = this.getPrescriptionDataFromView();
      if (data) this.preparePrintView(data);
    } else {
      const data = this.getPrescriptionDataFromForm();
      this.preparePrintView(data);
    }
  }

  /**
   * Get prescription data from form elements (for PrescriptionForm)
   */
  public getPrescriptionDataFromForm(): any {
    return {
      patientName: (document.getElementById('patientName') as HTMLInputElement)?.value || '',
      patientId: (document.getElementById('patientId') as HTMLInputElement)?.value || '',
      age: (document.getElementById('age') as HTMLInputElement)?.value || '',
      socialNumber: (document.getElementById('socialNumber') as HTMLInputElement)?.value || '',
      gender: (document.getElementById('gender') as HTMLSelectElement)?.value || '',
      diagnoses: (document.getElementById('diagnoses') as HTMLInputElement)?.value || '',
      doctorName: (document.getElementById('doctorName') as HTMLSelectElement)?.value || '',
      doctorDegree: (document.getElementById('doctorDegree') as HTMLSelectElement)?.value || '',
      consultation: (document.getElementById('consultation') as HTMLSelectElement)?.value || '',
      prescriptionDate: (document.getElementById('prescriptionDate') as HTMLInputElement)?.value || '',
      prescriptionTime: (document.getElementById('prescriptionTime') as HTMLInputElement)?.value || '',
      medications: JSON.stringify(this.getMedicationDataFromForm()),
      pharmacies: JSON.stringify(this.getSelectedPharmaciesFromForm())
    };
  }

  /**
   * Get prescription data from view elements (for PrescriptionsList)
   */
  public getPrescriptionDataFromView(): any {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return null;

    // Get data from the displayed elements
    const patientNameEl = mainContent.querySelector('[data-field="patientName"]');
    const patientIdEl = mainContent.querySelector('[data-field="patientId"]');
    const ageEl = mainContent.querySelector('[data-field="age"]');
    const socialNumberEl = mainContent.querySelector('[data-field="socialNumber"]');
    const genderEl = mainContent.querySelector('[data-field="gender"]');
    const diagnosesEl = mainContent.querySelector('[data-field="diagnoses"]');
    const doctorNameEl = mainContent.querySelector('[data-field="doctorName"]');
    const doctorDegreeEl = mainContent.querySelector('[data-field="doctorDegree"]');
    const consultationEl = mainContent.querySelector('[data-field="consultation"]');
    const dateEl = mainContent.querySelector('[data-field="prescriptionDate"]');
    const timeEl = mainContent.querySelector('[data-field="prescriptionTime"]');

    // Extract medications from the table
    const medications: any[] = [];
    const medRows = mainContent.querySelectorAll('.medications-table tbody tr');
    medRows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 8) {
        medications.push({
          drug: cells[1].textContent || '',
          prescribingLevel: cells[2].textContent || '',
          preAuthorizationProtocol: '', // Not displayed in view
          route: cells[3].textContent || '',
          dose: cells[4].textContent || '',
          frequency: cells[5].textContent || '',
          precautions: cells[6].textContent || '',
          duration: cells[7].textContent || ''
        });
      }
    });

    // Extract pharmacies
    const pharmacies: string[] = [];
    const pharmacyItems = mainContent.querySelectorAll('.pharmacy-item');
    pharmacyItems.forEach(item => {
      const text = item.textContent || '';
      if (text.startsWith('• ')) {
        pharmacies.push(text.substring(2));
      }
    });

    return {
      patientName: patientNameEl?.textContent || '',
      patientId: patientIdEl?.textContent || '',
      age: ageEl?.textContent || '',
      socialNumber: socialNumberEl?.textContent || '',
      gender: genderEl?.textContent || '',
      diagnoses: diagnosesEl?.textContent || '',
      doctorName: doctorNameEl?.textContent?.replace('د/ ', '').trim() || '',
      doctorDegree: doctorDegreeEl?.textContent || '',
      consultation: consultationEl?.textContent || '',
      prescriptionDate: dateEl?.textContent || '',
      prescriptionTime: timeEl?.textContent || '',
      medications: JSON.stringify(medications),
      pharmacies: JSON.stringify(pharmacies)
    };
  }

  private getMedicationDataFromForm(): any[] {
    const tbody = document.getElementById('medicationsBody');
    if (!tbody) return [];

    const rows = tbody.querySelectorAll('tr');
    const medications: any[] = [];

    rows.forEach(row => {
      const inputs = row.querySelectorAll('input, select');
      if (inputs.length >= 8) {
        medications.push({
          drug: (inputs[0] as HTMLInputElement).value,
          prescribingLevel: (inputs[1] as HTMLInputElement).value,
          preAuthorizationProtocol: (inputs[2] as HTMLInputElement).value,
          route: (inputs[3] as HTMLSelectElement).value,
          dose: (inputs[4] as HTMLInputElement).value,
          frequency: (inputs[5] as HTMLSelectElement).value,
          precautions: (inputs[6] as HTMLInputElement).value,
          duration: (inputs[7] as HTMLSelectElement).value
        });
      }
    });

    return medications;
  }
  private getSelectedPharmaciesFromForm(): string[] {
    const checkboxes = document.querySelectorAll('input[name="pharmacy"]:checked');
    return Array.from(checkboxes).map(cb => (cb as HTMLInputElement).value);
  }

  /**
   * Centralized orchestrator: suspends focus, prints via Electron, falls back to window.print,
   * and reliably resumes focus afterwards.
   */
  public async orchestratePrint(): Promise<void> {
    try {
      await apiService.printWithPreview();
    } catch (error) {
      console.error('Error printing with preview, falling back to window.print()', error);
      // Attach a one-shot afterprint to ensure resume when using window.print
      const onAfterPrint = () => {
        window.removeEventListener('afterprint', onAfterPrint);
        // no-op
      };
      try {
        window.addEventListener('afterprint', onAfterPrint);
        window.print();
      } catch (fallbackErr) {
        console.error('Fallback window.print() failed', fallbackErr);
      }
    } finally {
      // no-op
    }
  }

  /**
   * Prepare-and-print using data from the editable form.
   */
  public async printFromForm(): Promise<void> {
    const data = this.getPrescriptionDataFromForm();
    this.preparePrintView(data);
    await this.orchestratePrint();
  }

  /**
   * Prepare-and-print using data from the read-only view.
   */
  public async printFromView(): Promise<void> {
    const data = this.getPrescriptionDataFromView();
    if (!data) return;
    this.preparePrintView(data);
    await this.orchestratePrint();
  }

  // Old style printing
  public async printOldStyleFromForm(): Promise<void> {
    const base = this.getPrescriptionDataFromForm();
    await this.printOldStyle(base);
  }

  public async printOldStyleFromView(): Promise<void> {
    const base = this.getPrescriptionDataFromView();
    if (!base) return;
    await this.printOldStyle(base);
  }

  private async printOldStyle(baseData: any): Promise<void> {
    try {
      // Enrich with pharmacies list from DB and ensure genericName presence if available in stored meds
      const selectedPharmacies: string[] = JSON.parse(baseData.pharmacies || '[]');

      // We do not have ApiService import here directly; reuse the global apiService
      const allPharmaciesRecords = await apiService.getPharmacies();
      const allPharmacies: string[] = Array.isArray(allPharmaciesRecords)
        ? allPharmaciesRecords.map((p: any) => p.name).filter(Boolean)
        : [];

      const medications = JSON.parse(baseData.medications || '[]');

      const payload: OldPrintPrescriptionData = {
        patientName: baseData.patientName || '',
        patientId: baseData.patientId || '',
        diagnoses: baseData.diagnoses || '',
        doctorName: baseData.doctorName || '',
        doctorDegree: baseData.doctorDegree || '',
        consultation: baseData.consultation || '',
        prescriptionDate: baseData.prescriptionDate || '',
        prescriptionTime: baseData.prescriptionTime || '',
        medications,
        selectedPharmacies,
        allPharmacies
      };

      this.injectAndPrintOldTemplate(payload);
      await this.orchestratePrint();
    } catch (error) {
      console.error('Error printing old style:', error);
    }
  }

  private injectAndPrintOldTemplate(payload: OldPrintPrescriptionData): void {
    // Remove any previous container
    const existing = document.getElementById('old-print-container');
    if (existing?.parentElement) {
      existing.parentElement.removeChild(existing);
    }

    const container = document.createElement('div');
    container.id = 'old-print-container';
    container.className = 'print-only-old';
    container.innerHTML = renderOldPrintHTML(payload);
    document.body.appendChild(container);

    // Set hospital header in old template
    this.applyHospitalHeader(container);

    // Toggle a class to control visibility in CSS
    document.body.classList.add('printing-old');

    const cleanup = () => {
      document.body.classList.remove('printing-old');
      window.removeEventListener('afterprint', cleanup);
      const node = document.getElementById('old-print-container');
      if (node && node.parentElement) node.parentElement.removeChild(node);
    };
    window.addEventListener('afterprint', cleanup);
  }

  public async applyHospitalHeader(root?: HTMLElement | Document): Promise<void> {
    try {
      const cfg = await apiService.getHospitalConfig();
      const name = cfg?.name || '';
      const address = cfg?.address || '';
      const phone = cfg?.phone || '';
      const logo = cfg?.logo || null;
      const text = [name, address && `- ${address}`, phone && `- ${phone}`].filter(Boolean).join(' ');
      const scope: Document | HTMLElement = root || document;
      const headerEl = (scope as any).getElementById ? (scope as Document).getElementById('hospitalNameHeader') : null;
      const searchRoot: Document | HTMLElement = (scope && !(scope as Document).querySelectorAll)
        ? document
        : (scope as Document | HTMLElement);
      const els = headerEl ? [headerEl] : Array.from((searchRoot as any).querySelectorAll('#hospitalNameHeader'));
      els.forEach((el: any) => { el.textContent = text || name || ''; });

      // Inject logo where supported: target any elements with id=hospitalLogoHeader if present
      const logoTargets = Array.from((searchRoot as any).querySelectorAll('#hospitalLogoHeader')) as HTMLElement[];
      if (logoTargets.length) {
        logoTargets.forEach(target => {
          if (logo) {
            target.innerHTML = `<img src="${logo}" alt="Hospital Logo" style="height:48px; object-fit:contain;" />`;
          } else {
            target.innerHTML = '';
          }
        });
      }
    } catch (e) {
      // ignore
    }
  }
}
