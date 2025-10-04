/**
 * Reports List component
 */

import { EventManager } from '../utils/EventManager';
import { StateManager } from '../utils/StateManager';
import { apiService } from '../services/ApiService';
import { Dialog } from './Dialog';
import { ReportsSearchManager } from './reports-list/search-manager';
import { ReportsTableRenderer } from './reports-list/table-renderer';

export class ReportsList {
  private eventManager: EventManager;
  private stateManager: StateManager;
  private searchManager: ReportsSearchManager;
  private reports: any[] = [];
  private allReports: any[] = [];
  private searchDebounce?: number;

  constructor(eventManager: EventManager, stateManager: StateManager) {
    this.eventManager = eventManager;
    this.stateManager = stateManager;
    this.searchManager = new ReportsSearchManager();
  }

  async render(): Promise<string> {
    return `
      <div class="prescription-header">
        <div class="clinic-title">التقارير المحفوظة</div>
        <div class="clinic-subtitle">إدارة التقارير</div>
      </div>

      <div class="prescription-form">
        <div class="form-row" style="margin-bottom: 16px;">
          <div class="form-group">
            <input type="text" id="reportSearchInput" placeholder="البحث باسم المريض أو رقم المريض أو اسم الطبيب">
          </div>
          <button class="btn" id="reportSearchBtn">بحث</button>
          <button class="btn btn-primary" id="newReportBtn">تقرير جديد</button>
        </div>

        <div id="reportsTable">
          <p style="text-align: center; color: #666;">جاري تحميل التقارير...</p>
        </div>
      </div>
    `;
  }

  async initialize(): Promise<void> {
    this.setupEventListeners();
    await this.loadReports();
  }

  private setupEventListeners(): void {
    const searchBtn = document.getElementById('reportSearchBtn');
    searchBtn?.addEventListener('click', () => this.searchReports());

    const newBtn = document.getElementById('newReportBtn');
    newBtn?.addEventListener('click', () => this.eventManager.emit('navigation:change', 'reports'));

    const searchInput = document.getElementById('reportSearchInput') as HTMLInputElement;
    searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchReports();
      }
    });

    // Debounced live search
    searchInput?.addEventListener('input', () => {
      if (this.searchDebounce) {
        window.clearTimeout(this.searchDebounce);
      }
      this.searchDebounce = window.setTimeout(() => this.searchReports(), 200);
    });
  }

  private async loadReports(): Promise<void> {
    try {
      this.allReports = await apiService.getReports();
      this.searchManager.buildSearchIndex(this.allReports);
      this.reports = this.allReports;
      this.renderReports();
    } catch (error) {
      console.error('Error loading reports:', error);
      this.showError('خطأ في تحميل التقارير');
    }
  }

  private async searchReports(): Promise<void> {
    const searchTerm = (document.getElementById('reportSearchInput') as HTMLInputElement).value;
    
    if (!searchTerm.trim()) {
      // Reset to full list without refetching
      this.reports = this.allReports;
      this.renderReports();
      return;
    }

    try {
      if (this.searchManager.isReady()) {
        this.reports = this.searchManager.search(searchTerm);
        this.renderReports();
      } else {
        // Fallback to IPC search if search manager is not ready
        this.reports = await apiService.searchReports(searchTerm);
        this.renderReports();
      }
    } catch (error) {
      console.error('Error searching reports:', error);
      this.showError('خطأ في البحث');
    }
  }

  private renderReports(): void {
    const tableContainer = document.getElementById('reportsTable');
    if (!tableContainer) return;

    tableContainer.innerHTML = ReportsTableRenderer.renderReportsTable(this.reports);

    // Make functions global for onclick handlers
    (window as any).editReport = (id: number) => this.editReport(id);
    (window as any).deleteReport = (id: number) => this.deleteReport(id);
  }

  private async editReport(id: number): Promise<void> {
    try {
      const report = await apiService.getReport(id);
      if (report) {
        this.stateManager.setReportData(report);
        this.stateManager.setCurrentReportId(id);
        this.eventManager.emit('navigation:change', 'reports');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      this.showError('خطأ في تحميل التقرير');
    }
  }

  private async deleteReport(id: number): Promise<void> {
    const confirmed = await Dialog.confirm('هل أنت متأكد من حذف هذا التقرير؟');
    if (!confirmed) return;
    try {
      await apiService.deleteReport(id);
      await this.loadReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      this.showError('خطأ في حذف التقرير');
    }
  }

  private showError(message: string): void {
    void Dialog.alert(message);
  }
}
