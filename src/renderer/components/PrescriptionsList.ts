/**
 * Prescriptions List component
 */

import { EventManager } from '../utils/EventManager';
import { StateManager } from '../utils/StateManager';
import { apiService } from '../services/ApiService';
import { Dialog } from './Dialog';
import { PrintManager } from '../utils/PrintManager';
import { PrescriptionsSearchManager } from './prescriptions-list/search-manager';
import { PrescriptionsTableRenderer } from './prescriptions-list/table-renderer';
import { PrescriptionViewTemplate, PrescriptionViewData } from './prescriptions-list/view-template';

export class PrescriptionsList {
  private eventManager: EventManager;
  private stateManager: StateManager;
  private printManager: PrintManager;
  private searchManager: PrescriptionsSearchManager;
  private prescriptions: any[] = [];
  private allPrescriptions: any[] = [];
  private searchDebounce?: number;

  constructor(eventManager: EventManager, stateManager: StateManager) {
    this.eventManager = eventManager;
    this.stateManager = stateManager;
    this.printManager = PrintManager.getInstance();
    this.searchManager = new PrescriptionsSearchManager();
  }

  async render(): Promise<string> {
    return `
      <div class="prescription-header">
        <div class="clinic-title">الروشتات المحفوظة</div>
        <div class="clinic-subtitle">إدارة الروشتات</div>
      </div>

      <div class="prescription-form">
        <div class="form-row" style="margin-bottom: 16px;">
          <div class="form-group">
            <input type="text" id="searchInput" placeholder="البحث باسم المريض أو رقم المريض أو اسم الطبيب">
          </div>
          <button class="btn" id="searchBtn">بحث</button>
          <button class="btn btn-primary" id="newPrescriptionBtn">روشتة جديدة</button>
        </div>

        <div id="prescriptionsTable">
          <p style="text-align: center; color: #666;">جاري تحميل الروشتات...</p>
        </div>
      </div>
    `;
  }

  async initialize(): Promise<void> {
    this.setupEventListeners();
    await this.loadPrescriptions();
  }

  private setupEventListeners(): void {
    const searchBtn = document.getElementById('searchBtn');
    searchBtn?.addEventListener('click', () => this.searchPrescriptions());

    const newBtn = document.getElementById('newPrescriptionBtn');
    newBtn?.addEventListener('click', () => this.eventManager.emit('navigation:change', 'prescription'));

    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchPrescriptions();
      }
    });

    // Debounced live search
    searchInput?.addEventListener('input', () => {
      if (this.searchDebounce) {
        window.clearTimeout(this.searchDebounce);
      }
      this.searchDebounce = window.setTimeout(() => this.searchPrescriptions(), 200);
    });
  }

  private async loadPrescriptions(): Promise<void> {
    try {
      this.allPrescriptions = await apiService.getPrescriptions();
      this.searchManager.buildSearchIndex(this.allPrescriptions);
      this.prescriptions = this.allPrescriptions;
      this.renderPrescriptions();
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      this.showError('خطأ في تحميل الروشتات');
    }
  }

  private async searchPrescriptions(): Promise<void> {
    const searchTerm = (document.getElementById('searchInput') as HTMLInputElement).value;
    
    if (!searchTerm.trim()) {
      // Reset to full list without refetching
      this.prescriptions = this.allPrescriptions;
      this.renderPrescriptions();
      return;
    }

    try {
      if (this.searchManager.isReady()) {
        this.prescriptions = this.searchManager.search(searchTerm);
        this.renderPrescriptions();
      } else {
        // Fallback to IPC search if search manager is not ready
        this.prescriptions = await apiService.searchPrescriptions(searchTerm);
        this.renderPrescriptions();
      }
    } catch (error) {
      console.error('Error searching prescriptions:', error);
      this.showError('خطأ في البحث');
    }
  }



  private renderPrescriptions(): void {
    const tableContainer = document.getElementById('prescriptionsTable');
    if (!tableContainer) return;

    tableContainer.innerHTML = PrescriptionsTableRenderer.renderPrescriptionsTable(this.prescriptions);

    // Make functions global for onclick handlers
    (window as any).editPrescription = (id: number) => this.editPrescription(id);
    (window as any).deletePrescription = (id: number) => this.deletePrescription(id);
  }


  private async editPrescription(id: number): Promise<void> {
    try {
      const prescription = await apiService.getPrescription(id);
      if (prescription) {
        this.stateManager.setPrescriptionData(prescription);
        this.stateManager.setCurrentPrescriptionId(id);
        this.eventManager.emit('navigation:change', 'prescription');
      }
    } catch (error) {
      console.error('Error loading prescription:', error);
      this.showError('خطأ في تحميل الروشتة');
    }
  }

  private async deletePrescription(id: number): Promise<void> {
    const confirmed = await Dialog.confirm('هل أنت متأكد من حذف هذه الروشتة؟');
    if (!confirmed) return;
    try {
      await apiService.deletePrescription(id);
      await this.loadPrescriptions();
      // Success alert removed for streamlined user experience
    } catch (error) {
      console.error('Error deleting prescription:', error);
      this.showError('خطأ في حذف الروشتة');
    }
  }

  private showError(message: string): void {
    void Dialog.alert(message);
  }

  private showPrescriptionView(prescription: any): void {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const prescriptionData: PrescriptionViewData = {
      id: prescription.id,
      patientName: prescription.patientName,
      patientId: prescription.patientId,
      age: prescription.age,
      socialNumber: prescription.socialNumber,
      gender: prescription.gender,
      diagnoses: prescription.diagnoses,
      chronicDiagnosis: prescription.chronicDiagnosis,
      doctorName: prescription.doctorName,
      doctorDegree: prescription.doctorDegree,
      consultation: prescription.consultation,
      prescriptionDate: prescription.prescriptionDate,
      prescriptionTime: prescription.prescriptionTime,
      medications: prescription.medications,
      pharmacies: prescription.pharmacies
    };

    mainContent.innerHTML = PrescriptionViewTemplate.generateViewTemplate(prescriptionData);
    this.setupPrescriptionViewEventListeners(prescription);

    // Apply hospital header to the view header
    void this.printManager.applyHospitalHeader();
  }

  private setupPrescriptionViewEventListeners(prescription: any): void {
    const printBtn = document.getElementById('printPrescriptionBtn');
    printBtn?.addEventListener('click', () => this.printPrescription());

    const printOldBtn = document.getElementById('printOldStyleBtn');
    printOldBtn?.addEventListener('click', () => { void this.printManager.printOldStyleFromView(); });

    const backBtn = document.getElementById('backToListBtn');
    backBtn?.addEventListener('click', () => this.loadPrescriptions());

    const editBtn = document.getElementById('editPrescriptionBtn');
    editBtn?.addEventListener('click', () => this.editPrescription(prescription.id));
  }

  private async printPrescription(): Promise<void> {
    try {
      // Ensure header is applied
      await this.printManager.applyHospitalHeader();
      await this.printManager.printFromView();
    } catch (error) {
      console.error('Error printing prescription:', error);
    }
  }

  private preparePrintView(): void {
    const prescriptionData = this.printManager.getPrescriptionDataFromView();
    if (prescriptionData) {
      this.printManager.preparePrintView(prescriptionData);
    }
  }
}
