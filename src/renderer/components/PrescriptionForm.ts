/**
 * Prescription Form component
 */

import { EventManager } from '../utils/EventManager';
import { StateManager } from '../utils/StateManager';
import { PrintManager } from '../utils/PrintManager';
import { apiService } from '../services/ApiService';
import { Dialog } from './Dialog';
import { buildPrescriptionFormTemplate } from './prescription/template';
import { PrescriptionPreferences } from './prescription/preferences';
import { MedicationTableManager } from './prescription/medication-table';

export class PrescriptionForm {
  private eventManager: EventManager;
  private stateManager: StateManager;
  private printManager: PrintManager;
  private medicationTable: MedicationTableManager;
  private preferences: PrescriptionPreferences;

  constructor(eventManager: EventManager, stateManager: StateManager) {
    this.eventManager = eventManager;
    this.stateManager = stateManager;
    this.printManager = PrintManager.getInstance();
    this.medicationTable = new MedicationTableManager();
    this.preferences = new PrescriptionPreferences();
  }

  async render(): Promise<string> {
    try {
      // Get dynamic data
      const [doctors, clinics, pharmacies] = await Promise.all([
        apiService.getDoctorsList(),
        apiService.getClinics(),
        apiService.getPharmacies()
      ]);
      return buildPrescriptionFormTemplate({ doctors, clinics, pharmacies });
    } catch (error) {
      console.error('Error rendering prescription form:', error);
      return '<div class="error">خطأ في تحميل النموذج</div>';
    }
  }

  async initialize(): Promise<void> {
    this.setupEventListeners();
    this.setCurrentDateTime();
    await this.medicationTable.initialize();
    await this.populateFormIfEditing();
    this.preferences.restoreSelections();
    // Apply hospital header text dynamically
    void this.printManager.applyHospitalHeader();
    
    // Ensure focus is set on the first input after initialization
    setTimeout(() => {
      const firstInput = document.getElementById('patientName') as HTMLInputElement;
      if (firstInput) {
        try {
          firstInput.focus();
          firstInput.select?.();
        } catch {}
      }
    }, 100);
  }

  private setupEventListeners(): void {
    // Add medication row
    const addBtn = document.getElementById('addMedicationBtn');
    addBtn?.addEventListener('click', () => { void this.medicationTable.addRow(); });

    // Save prescription
    const saveBtn = document.getElementById('savePrescriptionBtn');
    saveBtn?.addEventListener('click', () => { void this.savePrescription(); });

    // Print prescription
    const printBtn = document.getElementById('printPrescriptionBtn');
    printBtn?.addEventListener('click', () => { void this.printPrescription(); });

    // Print old style
    const printOldBtn = document.getElementById('printOldStyleBtn');
    printOldBtn?.addEventListener('click', () => { void this.printManager.printOldStyleFromForm(); });

    // New prescription
    const newBtn = document.getElementById('newPrescriptionBtn');
    newBtn?.addEventListener('click', () => { void this.newPrescription(); });

    // Save doctor and clinic changes to local storage
    const doctorSelect = document.getElementById('doctorName') as HTMLSelectElement;
    const doctorDegreeSelect = document.getElementById('doctorDegree') as HTMLSelectElement;
    const clinicSelect = document.getElementById('consultation') as HTMLSelectElement;
    
    doctorSelect?.addEventListener('change', () => this.preferences.persistSelections());
    doctorDegreeSelect?.addEventListener('change', () => this.preferences.persistSelections());
    clinicSelect?.addEventListener('change', () => this.preferences.persistSelections());

    // // Show prescriptions list
    // const listBtn = document.getElementById('showPrescriptionsListBtn');
    // listBtn?.addEventListener('click', () => this.showPrescriptionsList());
  }

  private setCurrentDateTime(): void {
    const now = new Date();
    const dateInput = document.getElementById('prescriptionDate') as HTMLInputElement;
    const timeInput = document.getElementById('prescriptionTime') as HTMLInputElement;

    if (dateInput) {
      dateInput.value = now.toISOString().split('T')[0];
    }
    if (timeInput) {
      timeInput.value = now.toTimeString().split(' ')[0].substring(0, 5);
    }
  }

  private async savePrescription(): Promise<void> {
    const baseData = this.getFormData();

    if (!(await this.validateForm(baseData))) {
      return;
    }

    try {
      // Ensure medications include genericName
      const catalog = await apiService.getMedications();
      const meds = this.medicationTable.collectMedicationData();
      this.medicationTable.persistTemplate(meds);
      const enrichedMeds = this.enrichMedicationsWithGenericNames(meds, catalog);

      const prescriptionData = {
        ...baseData,
        medications: JSON.stringify(enrichedMeds)
      };

      const currentId = this.stateManager.getCurrentPrescriptionId();
      
      if (currentId) {
        // Update existing prescription
        await apiService.updatePrescription(currentId, prescriptionData);
        this.eventManager.emit('prescription:updated');
        await Dialog.alert('تم تحديث الروشتة بنجاح', { title: 'نجح التحديث' });
      } else {
        // Create new prescription
        await apiService.createPrescription(prescriptionData);
        this.eventManager.emit('prescription:saved');
        await Dialog.alert('تم حفظ الروشتة بنجاح', { title: 'نجح الحفظ' });
      }
      
      await this.clearForm();
      this.stateManager.clearPrescriptionData();
    } catch (error) {
      console.error('Error saving prescription:', error);
      this.eventManager.emit('prescription:error', 'خطأ في حفظ الروشتة');
    }
  }

  private getFormData(): any {
    return {
      patientName: (document.getElementById('patientName') as HTMLInputElement).value,
      patientId: (document.getElementById('patientId') as HTMLInputElement).value,
      diagnoses: (document.getElementById('diagnoses') as HTMLInputElement).value,
      doctorName: (document.getElementById('doctorName') as HTMLSelectElement).value,
      doctorDegree: (document.getElementById('doctorDegree') as HTMLSelectElement).value,
      consultation: (document.getElementById('consultation') as HTMLSelectElement).value,
      prescriptionDate: (document.getElementById('prescriptionDate') as HTMLInputElement).value,
      prescriptionTime: (document.getElementById('prescriptionTime') as HTMLInputElement).value,
      medications: JSON.stringify(this.medicationTable.collectMedicationData()),
      pharmacies: JSON.stringify(this.getSelectedPharmacies())
    };
  }

  private async validateForm(data: any): Promise<boolean> {
    if (!data.patientName || !data.doctorName || !data.doctorDegree) {
      await Dialog.alert('يرجى ملء جميع البيانات المطلوبة');
      return false;
    }
    return true;
  }

  // Helper: add genericName to each medication by looking up the catalog
  private enrichMedicationsWithGenericNames(medications: any[], catalog: any[]): any[] {
    if (!Array.isArray(medications) || medications.length === 0) return medications;
    const norm = (s: string) => (s || '').toLowerCase().trim();

    return medications.map(med => {
      const drugText = norm(med.drug);
      // Find best match: either exact name match or substring match within the free-text drug field
      const match = catalog.find((c: any) => {
        const name = norm(c.name);
        return name && (drugText === name || drugText.includes(name));
      });
      return {
        ...med,
        genericName: match?.genericName || ''
      };
    });
  }

  private getSelectedPharmacies(): string[] {
    const checkboxes = document.querySelectorAll('input[name="pharmacy"]:checked');
    return Array.from(checkboxes).map(cb => (cb as HTMLInputElement).value);
  }

  private async clearForm(): Promise<void> {
    const form = document.querySelector('.prescription-form');
    if (form) {
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        // Skip doctor name and clinic - they will be preserved from local storage
        if (input.id === 'doctorName' || input.id === 'doctorDegree' || input.id === 'consultation') {
          return;
        }
        
        if (input instanceof HTMLInputElement) {
          if (input.type === 'checkbox') {
            input.checked = false;
          } else {
            input.value = '';
          }
        } else if (input instanceof HTMLSelectElement) {
          input.selectedIndex = 0;
        }
      });
    }
    await this.medicationTable.restoreTemplate();

    // Reset save button text
    const saveBtn = document.getElementById('savePrescriptionBtn');
    if (saveBtn) {
      saveBtn.textContent = 'حفظ الروشتة';
    }

    this.preferences.restoreSelections();
    this.setCurrentDateTime();
  }

  private async printPrescription(): Promise<void> {
    try {
      // Ensure header is applied
      await this.printManager.applyHospitalHeader();
      await this.printManager.printFromForm();
    } catch (error) {
      console.error('Error printing prescription:', error);
    }
  }

  // Note: Print view preparation is centralized in PrintManager

  private async newPrescription(): Promise<void> {
    const confirmed = await Dialog.confirm('هل تريد إنشاء روشتة جديدة؟ سيتم فقدان البيانات الحالية.');
    if (confirmed) {
      this.medicationTable.persistTemplate();
      await this.clearForm();
    }
  }

  // private showPrescriptionsList(): void {
  //   this.eventManager.emit('navigation:change', 'prescriptions-list');
  // }

  private async populateFormIfEditing(): Promise<void> {
    const prescriptionData = this.stateManager.getPrescriptionData();
    const currentId = this.stateManager.getCurrentPrescriptionId();
    
    if (prescriptionData && currentId) {
      try {
        // Populate basic form fields
        const patientNameInput = document.getElementById('patientName') as HTMLInputElement;
        const patientIdInput = document.getElementById('patientId') as HTMLInputElement;
        const diagnosesInput = document.getElementById('diagnoses') as HTMLInputElement;
        const doctorSelect = document.getElementById('doctorName') as HTMLSelectElement;
        const doctorDegreeSelect = document.getElementById('doctorDegree') as HTMLSelectElement;
        const consultationSelect = document.getElementById('consultation') as HTMLSelectElement;
        const dateInput = document.getElementById('prescriptionDate') as HTMLInputElement;
        const timeInput = document.getElementById('prescriptionTime') as HTMLInputElement;

        if (patientNameInput) patientNameInput.value = prescriptionData.patientName || '';
        if (patientIdInput) patientIdInput.value = prescriptionData.patientId || '';
        if (diagnosesInput) diagnosesInput.value = prescriptionData.diagnoses || '';
        if (doctorSelect) doctorSelect.value = prescriptionData.doctorName || '';
        if (doctorDegreeSelect) doctorDegreeSelect.value = prescriptionData.doctorDegree || '';
        if (consultationSelect) consultationSelect.value = prescriptionData.consultation || '';
        if (dateInput) dateInput.value = prescriptionData.prescriptionDate || '';
        if (timeInput) timeInput.value = prescriptionData.prescriptionTime || '';

        // Populate medications
        if (prescriptionData.medications) {
          const medications = JSON.parse(prescriptionData.medications);
          await this.medicationTable.populateMedications(medications);
        }

        // Populate pharmacies
        if (prescriptionData.pharmacies) {
          const pharmacies = JSON.parse(prescriptionData.pharmacies);
          this.populatePharmacies(pharmacies);
        }

        // Update save button text to indicate editing
        const saveBtn = document.getElementById('savePrescriptionBtn');
        if (saveBtn) {
          saveBtn.textContent = 'تحديث الروشتة';
        }

        console.log('Form populated with existing prescription data');
      } catch (error) {
        console.error('Error populating form with prescription data:', error);
      }
    }
  }

  private populatePharmacies(pharmacies: string[]): void {
    const pharmacyCheckboxes = document.querySelectorAll('input[name="pharmacy"]');
    pharmacyCheckboxes.forEach(checkbox => {
      const input = checkbox as HTMLInputElement;
      if (pharmacies.includes(input.value)) {
        input.checked = true;
      }
    });
  }

}
