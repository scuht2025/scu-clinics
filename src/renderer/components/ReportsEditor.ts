/**
 * Reports Editor component with WYSIWYG editor and @-mention functionality
 */

import { EventManager } from '../utils/EventManager';
import { StateManager } from '../utils/StateManager';
import { PrintManager } from '../utils/PrintManager';
import { apiService } from '../services/ApiService';
// Quill and Mention (types provided via @types/quill; mention has ambient declaration)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Quill from 'quill';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import QuillMention from 'quill-mention';
// Quill styles
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import 'quill/dist/quill.snow.css';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import 'quill-mention/dist/quill.mention.css';

// Register mention module
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
(Quill as any).register('modules/mention', QuillMention);

export class ReportsEditor {
  private eventManager: EventManager;
  private stateManager: StateManager;
  private quill: any | null = null;

  constructor(eventManager: EventManager, stateManager: StateManager) {
    this.eventManager = eventManager;
    this.stateManager = stateManager;
  }

  async render(): Promise<string> {
    const today = new Date().toISOString().split('T')[0];
    return `
      <div class="reports-editor-container" dir="rtl" lang="ar">
        <div class="reports-form">
          <div class="form-row four-cols">
            <div class="form-group">
              <label for="patientName">اسم المريض *</label>
              <input type="text" id="patientName" name="patientName" required placeholder="اسم المريض">
            </div>
            <div class="form-group">
              <label for="patientId">رقم المريض *</label>
              <input type="text" id="patientId" name="patientId" required placeholder="رقم المريض">
            </div>
            <div class="form-group">
              <label for="doctorName">اسم الطبيب *</label>
              <select id="doctorName" name="doctorName" required>
                <option value="">اختر الطبيب</option>
              </select>
            </div>
            <div class="form-group">
              <label for="reportDate">تاريخ التقرير *</label>
              <input type="date" id="reportDate" name="reportDate" required value="${today}">
            </div>
          </div>

          <div class="form-group">
            <label for="reportContent">محتوى التقرير *</label>
            <div class="editor-container">
              <div id="quillToolbar" class="ql-toolbar" dir="rtl">
                <span class="ql-formats">
                  <button type="button" id="undoBtn" class="ql-button">Undo</button>
                  <button type="button" id="redoBtn" class="ql-button">Redo</button>
                </span>
                <span class="ql-formats">
                  <button class="ql-blockquote"></button>
                </span>
                <span class="ql-formats">
                  <select class="ql-align"></select>
                  <button class="ql-direction" value="rtl"></button>
                </span>
                <span class="ql-formats">
                  <button class="ql-list" value="ordered"></button>
                  <button class="ql-list" value="bullet"></button>
                </span>
                <span class="ql-formats">
                  <button class="ql-bold"></button>
                  <button class="ql-italic"></button>
                  <button class="ql-underline"></button>
                </span>
                <span class="ql-formats">
                  <select class="ql-size">
                    <option value="small"></option>
                    <option selected></option>
                    <option value="large"></option>
                    <option value="huge"></option>
                  </select>
                </span>
                
              </div>
              <div id="reportEditor" class="wysiwyg-editor" dir="rtl" lang="ar" data-placeholder="اكتب تقريرك هنا... استخدم @ للبحث عن الإجراءات والتحاليل"></div>
              <div class="editor-status">
                <span id="wordCount">0 كلمة</span>
                <span id="autosaveStatus" style="margin-right:auto;color:#888;font-size:12px;"></span>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="clearReportBtn">مسح</button>
            <button type="button" class="btn btn-primary" id="saveReportBtn">حفظ التقرير</button>
            <button type="button" class="btn btn-success" id="printReportBtn">طباعة</button>
          </div>
        </div>
      </div>
    `;
  }

  async initialize(): Promise<void> {
    this.setupEventListeners();
    this.setupEditor();
    this.setCurrentDate();
    await this.populateDoctors();
    await this.hydrateFromStateOrDraft();
  }

  private setupEventListeners(): void {
    // Form actions
    const saveBtn = document.getElementById('saveReportBtn');
    saveBtn?.addEventListener('click', () => this.saveReport());

    const clearBtn = document.getElementById('clearReportBtn');
    clearBtn?.addEventListener('click', () => this.clearReport());

    const printBtn = document.getElementById('printReportBtn');
    printBtn?.addEventListener('click', () => this.printReport());

    // Persist preferred doctor name
    const doctorSelect = document.getElementById('doctorName') as HTMLSelectElement | null;
    doctorSelect?.addEventListener('change', () => {
      try {
        localStorage.setItem('preferredDoctorName', (doctorSelect.value || '').trim());
      } catch {}
    });

    // No custom focus management on Quill to avoid interference
  }

  private setupEditor(): void {
    const container = document.getElementById('reportEditor');
    if (!container) return;

    const placeholder = (container as HTMLElement).getAttribute('data-placeholder') || '';

    this.quill = new (Quill as any)('#reportEditor', {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: '#quillToolbar',
        mention: {
          mentionDenotationChars: ['@'],
          allowedChars: /[A-Za-z0-9_\u0600-\u06FF\s-]/, // Arabic + Latin + digits
          showDenotationChar: false,
          dataAttributes: ['id', 'value', 'ar', 'en'],
          // Enable keyboard navigation
          isolateCharacter: false,
          fixMentionsToQuill: false,
          positioningStrategy: 'normal',
          defaultMenuOrientation: 'bottom',
          blotName: 'mention',
          // Enable scrolling with mouse wheel and arrow keys
          listItemClass: 'ql-mention-list-item',
          mentionListClass: 'ql-mention-list',
          mentionContainerClass: 'ql-mention-list-container',
          source: async (searchTerm: string, renderList: (list: any[], term: string) => void) => {
            try {
              const results = await apiService.searchProcedureCodes(searchTerm || '');
              const items = (results || []).slice(0, 15).map((r: any) => ({
                id: r.uhia_code,
                value: r.uhia_code,
                ar: r.ar_name || '',
                en: r.en_name || ''
              }));
              renderList(items, searchTerm);
            } catch (err) {
              console.error('mention source error', err);
              renderList([], searchTerm);
            }
          },
          renderItem: (item: any) => {
            return `
              <div class="mention-item">
                <div class="mention-code">${item.value}</div>
                <div class="mention-ar">${item.ar || ''}</div>
                <div class="mention-en">${item.en || ''}</div>
              </div>
            `;
          },
          onSelect: (item: any, insertItem: (it: any) => void) => {
            // Insert non-denoted UHIA code as mention badge
            insertItem({ id: item.id, value: item.value, ar: item.ar, en: item.en });
          }
        }
      }
    });

    // Default RTL layout
    (this.quill as any).format('direction', 'rtl');
    (this.quill as any).format('align', 'right');
    // Ensure DOM attributes reflect RTL for assistive tech and pasting behavior
    const rootEl = (this.quill as any).root as HTMLElement;
    if (rootEl) {
      rootEl.setAttribute('dir', 'rtl');
      rootEl.setAttribute('lang', 'ar');
      rootEl.style.textAlign = 'right';
    }

    // Word count + autosave hooks
    this.quill.on('text-change', () => {
      this.updateWordCount();
      this.scheduleDraftSave();
    });

    // Undo/redo buttons
    document.getElementById('undoBtn')?.addEventListener('click', () => (this.quill as any).history.undo());
    document.getElementById('redoBtn')?.addEventListener('click', () => (this.quill as any).history.redo());

    // Auto-scroll mentions list when navigating with arrow keys
    this.setupMentionScrolling();

    // Initial count
    this.updateWordCount();
  }

  private setupMentionScrolling(): void {
    // Use MutationObserver to detect when mention list appears and add scroll behavior
    const observer = new MutationObserver(() => {
      const mentionList = document.querySelector('.ql-mention-list') as HTMLElement;
      if (mentionList) {
        // Add keyboard event listener to the Quill editor
        const quillEditor = document.querySelector('.ql-editor') as HTMLElement;
        if (quillEditor) {
          const scrollSelectedIntoView = () => {
            setTimeout(() => {
              const selected = mentionList.querySelector('.ql-mention-list-item.selected') as HTMLElement;
              if (selected && mentionList) {
                const listRect = mentionList.getBoundingClientRect();
                const itemRect = selected.getBoundingClientRect();
                
                // Check if item is above the visible area
                if (itemRect.top < listRect.top) {
                  mentionList.scrollTop -= (listRect.top - itemRect.top) + 10;
                }
                // Check if item is below the visible area
                else if (itemRect.bottom > listRect.bottom) {
                  mentionList.scrollTop += (itemRect.bottom - listRect.bottom) + 10;
                }
              }
            }, 0);
          };

          // Listen for arrow key events
          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              const mentionListVisible = document.querySelector('.ql-mention-list-container');
              if (mentionListVisible) {
                scrollSelectedIntoView();
              }
            }
          };

          quillEditor.removeEventListener('keydown', handleKeyDown);
          quillEditor.addEventListener('keydown', handleKeyDown);
        }
      }
    });

    // Observe the body for mention list addition
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private setCurrentDate(): void {
    const dateInput = document.getElementById('reportDate') as HTMLInputElement;
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }
  }

  private async saveReport(): Promise<void> {
    const formData = this.getFormData();
    
    if (!this.validateForm(formData)) {
      return;
    }

    try {
      const report = {
        ...formData,
        content: this.getEditorContent(),
        reportTime: new Date().toLocaleTimeString('ar-EG')
      };

      // Update preferred doctor on save
      try { localStorage.setItem('preferredDoctorName', (formData.doctorName || '').trim()); } catch {}

      const existingId = this.stateManager.getCurrentReportId();
      if (existingId) {
        await apiService.updateReport(existingId, report);
        this.showSuccess('تم تحديث التقرير بنجاح');
      } else {
        await apiService.createReport(report);
        this.showSuccess('تم حفظ التقرير بنجاح');
      }
      this.clearDraft();
      this.stateManager.clearReportData?.();
      this.clearReport();
    } catch (error) {
      console.error('Error saving report:', error);
      this.showError('خطأ في حفظ التقرير');
    }
  }

  private getFormData(): any {
    const patientName = (document.getElementById('patientName') as HTMLInputElement)?.value || '';
    const patientId = (document.getElementById('patientId') as HTMLInputElement)?.value || '';
    const doctorName = (document.getElementById('doctorName') as HTMLSelectElement)?.value || '';
    const reportDate = (document.getElementById('reportDate') as HTMLInputElement)?.value || '';

    return {
      patientName: patientName.trim(),
      patientId: patientId.trim(),
      doctorName: doctorName.trim(),
      reportDate: reportDate
    };
  }

  private getEditorContent(): string {
    if (this.quill) return (this.quill as any).root.innerHTML || '';
    const editor = document.getElementById('reportEditor') as HTMLElement;
    return editor?.innerHTML || '';
  }

  private validateForm(data: any): boolean {
    if (!data.patientName.trim()) {
      this.showError('يرجى إدخال اسم المريض');
      return false;
    }
    if (!data.patientId.trim()) {
      this.showError('يرجى إدخال رقم المريض');
      return false;
    }
    if (!data.doctorName.trim()) {
      this.showError('يرجى إدخال اسم الطبيب');
      return false;
    }
    if (!data.reportDate) {
      this.showError('يرجى إدخال تاريخ التقرير');
      return false;
    }

    const content = this.quill ? (this.quill as any).getText().trim() : ((document.getElementById('reportEditor') as HTMLElement)?.textContent?.trim() || '');
    if (!content) {
      this.showError('يرجى إدخال محتوى التقرير');
      return false;
    }

    return true;
  }

  private clearReport(): void {
    // Clear form fields
    (document.getElementById('patientName') as HTMLInputElement).value = '';
    (document.getElementById('patientId') as HTMLInputElement).value = '';
    const doctorSelect = document.getElementById('doctorName') as HTMLSelectElement;
    if (doctorSelect) doctorSelect.selectedIndex = 0;
    this.setCurrentDate();

    // Clear editor
    if (this.quill) {
      (this.quill as any).setText('');
    } else {
      const editor = document.getElementById('reportEditor') as HTMLElement;
      if (editor) editor.innerHTML = '';
    }

    // Reset state
    this.stateManager.clearReportData?.();
    this.updateWordCount();
    this.updateAutosaveStatus('');
  }

  private async populateDoctors(): Promise<void> {
    try {
      const doctors = await apiService.getDoctorsList();
      const select = document.getElementById('doctorName') as HTMLSelectElement;
      if (!select) return;
      const options = ['<option value="">اختر الطبيب</option>']
        .concat((doctors || []).map((d: any) => `<option value="${d.name}">${d.name}</option>`));
      select.innerHTML = options.join('');
    } catch (error) {
      console.error('Error loading doctors list for reports:', error);
    }
  }

  private async printReport(): Promise<void> {
    const content = this.getEditorContent();
    if (!content.trim()) {
      this.showError('لا يوجد محتوى للطباعة');
      return;
    }

    // Build a print-only container in the same window
    const formData = this.getFormData();
    const container = document.createElement('div');
    container.className = 'report-print-container print-only';
    container.innerHTML = `
      <div class="prescription-header">
        <div id="hospitalLogoHeader" class="clinic-logo" style="text-align:center; margin-bottom:8px;"></div>
        <div class="clinic-title" id="hospitalNameHeader">&nbsp;</div>
        <div class="clinic-subtitle">تقرير طبي</div>
      </div>
      <div class="page">
        <div class="patient-info">
          <div class="patient-block">
            <div class="patient-row"><span class="label">اسم المريض:</span><span>${formData.patientName}</span></div>
            <div class="patient-row"><span class="label">رقم المريض:</span><span>${formData.patientId}</span></div>
          </div>
          <div class="patient-block">
            <div class="patient-row"><span class="label">اسم الطبيب:</span><span>${formData.doctorName}</span></div>
            <div class="patient-row"><span class="label">التاريخ:</span><span>${formData.reportDate}</span></div>
          </div>
        </div>
        <div class="content">${content}</div>
        <div class="print-footer">
          <div class="print-footer-section">
            <div class="signature-print-box">توقيع الطبيب</div>
          </div>
          <div class="print-footer-section">
            <div class="signature-print-box">ختم المستشفى</div>
          </div>
        </div>
      </div>`;
    
    // Add class to body to indicate report printing
    document.body.classList.add('printing-report');
    document.body.appendChild(container);

    try {
      await PrintManager.getInstance().applyHospitalHeader(container);
      await PrintManager.getInstance().orchestratePrint();
    } finally {
      // Clean up the print container and class after printing
      document.body.classList.remove('printing-report');
      setTimeout(() => container.remove(), 200);
    }
  }

  // ---------- Enhancements: draft + word count ----------
  private draftTimer?: number;

  private scheduleDraftSave(): void {
    if (this.draftTimer) window.clearTimeout(this.draftTimer);
    this.draftTimer = window.setTimeout(() => this.saveDraft(), 400);
  }

  private saveDraft(): void {
    const data = {
      ...this.getFormData(),
      content: this.getEditorContent()
    };
    try {
      localStorage.setItem('reportDraft', JSON.stringify(data));
      this.updateAutosaveStatus('تم الحفظ تلقائياً');
    } catch {}
  }

  private clearDraft(): void {
    try { localStorage.removeItem('reportDraft'); } catch {}
  }

  private async hydrateFromStateOrDraft(): Promise<void> {
    // If editing existing report
    const report = this.stateManager.getReportData?.();
    if (report) {
      (document.getElementById('patientName') as HTMLInputElement).value = report.patientName || '';
      (document.getElementById('patientId') as HTMLInputElement).value = report.patientId || '';
      const doctorSelect = document.getElementById('doctorName') as HTMLSelectElement;
      if (doctorSelect) doctorSelect.value = report.doctorName || '';
      // Only set date if report has one, otherwise keep the default current date
      if (report.reportDate) {
        (document.getElementById('reportDate') as HTMLInputElement).value = report.reportDate;
      }
      if (this.quill) (this.quill as any).root.innerHTML = report.content || '';
      this.updateWordCount();
      return;
    }

    // Otherwise load draft if available
    try {
      const raw = localStorage.getItem('reportDraft');
      if (!raw) return;
      const data = JSON.parse(raw || '{}');
      if (!data) return;
      (document.getElementById('patientName') as HTMLInputElement).value = data.patientName || '';
      (document.getElementById('patientId') as HTMLInputElement).value = data.patientId || '';
      const doctorSelect = document.getElementById('doctorName') as HTMLSelectElement;
      if (doctorSelect) doctorSelect.value = data.doctorName || '';
      // Only set date if draft has one, otherwise keep the default current date
      if (data.reportDate) {
        (document.getElementById('reportDate') as HTMLInputElement).value = data.reportDate;
      }
      if (this.quill) (this.quill as any).root.innerHTML = data.content || '';
      this.updateWordCount();
      return;
    } catch {}

    // Fallback: use persisted preferred doctor if available
    try {
      const preferred = localStorage.getItem('preferredDoctorName');
      if (preferred) {
        const doctorSelect = document.getElementById('doctorName') as HTMLSelectElement;
        if (doctorSelect) doctorSelect.value = preferred;
      }
    } catch {}
  }

  private updateWordCount(): void {
    const text = this.quill ? (this.quill as any).getText().trim() : '';
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const el = document.getElementById('wordCount');
    if (el) el.textContent = `${words} كلمة`;
  }

  private updateAutosaveStatus(msg: string): void {
    const el = document.getElementById('autosaveStatus');
    if (el) el.textContent = msg;
  }

  private showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }

  private showError(message: string): void {
    this.showNotification(message, 'error');
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}
