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
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    // Get dynamic data
    const [doctors, clinics] = await Promise.all([
      apiService.getDoctorsList(),
      apiService.getClinics()
    ]);

    const buildOptions = (items: Array<{ name: string }>, emptyLabel: string) => {
      const options = items
        .map(item => `<option value="${item.name}">${item.name}</option>`)
        .join('');
      return `<option value="">${emptyLabel}</option>${options}`;
    };

    return `
      <div class="reports-editor-container" dir="rtl" lang="ar">
        <div class="reports-form">
          <div class="form-row">
            <div class="form-group">
              <label for="doctorName">الطبيب *</label>
              <select id="doctorName" name="doctorName" required>
                ${buildOptions(doctors, 'اختر الطبيب')}
              </select>
            </div>
            <div class="form-group">
              <label for="doctorDegree">درجة الطبيب</label>
              <select id="doctorDegree" name="doctorDegree">
                <option value="">اختر الدرجة</option>
                <option value="Consultant">استشاري</option>
                <option value="Family Doctor"> طبيب أسرة</option>
                <option value="Specialist">أخصائي</option>
              </select>
            </div>
            <div class="form-group">
              <label for="consultation">العيادة</label>
              <select id="consultation" name="consultation">
                ${buildOptions(clinics, 'اختر التخصص')}
              </select>
            </div>
            <div class="form-group half">
              <label for="reportDate">التاريخ *</label>
              <input type="date" id="reportDate" name="reportDate" required value="${today}">
            </div>
            <div class="form-group half">
              <label for="reportTime">الوقت *</label>
              <input type="time" id="reportTime" name="reportTime" required value="${currentTime}">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="patientName">اسم المريض *</label>
              <input type="text" id="patientName" name="patientName" required placeholder="اسم المريض">
            </div>
            <div class="form-group">
              <label for="age">السن</label>
              <input type="number" id="age" name="age" placeholder="السن">
            </div>
            <div class="form-group">
              <label for="gender">النوع</label>
              <select id="gender" name="gender">
                <option value="">اختر النوع</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثي">أنثي</option>
              </select>
            </div>
            <div class="form-group">
              <label for="socialNumber">الرقم القومي</label>
              <input type="number" id="socialNumber" name="socialNumber" placeholder="الرقم القومي">
            </div>
            <div class="form-group">
              <label for="patientId">رقم المريض *</label>
              <input type="text" id="patientId" name="patientId" required placeholder="رقم المريض">
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
    this.setCurrentTime();
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
            // Insert as: AR_NAME UHIA_CODE (space-separated)
            const display = item.ar ? `${item.ar} - ${item.value}` : item.value;
            insertItem({ id: item.id, value: display, ar: item.ar, en: item.en });
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

  private setCurrentTime(): void {
    const timeInput = document.getElementById('reportTime') as HTMLInputElement;
    if (timeInput) {
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
      timeInput.value = currentTime;
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
    const age = (document.getElementById('age') as HTMLInputElement)?.value || '';
    const socialNumber = (document.getElementById('socialNumber') as HTMLInputElement)?.value || '';
    const gender = (document.getElementById('gender') as HTMLSelectElement)?.value || '';
    const doctorName = (document.getElementById('doctorName') as HTMLSelectElement)?.value || '';
    const doctorDegree = (document.getElementById('doctorDegree') as HTMLSelectElement)?.value || '';
    const consultation = (document.getElementById('consultation') as HTMLSelectElement)?.value || '';
    const reportDate = (document.getElementById('reportDate') as HTMLInputElement)?.value || '';
    const reportTime = (document.getElementById('reportTime') as HTMLInputElement)?.value || '';

    return {
      patientName: patientName.trim(),
      patientId: patientId.trim(),
      age: age.trim(),
      socialNumber: socialNumber.trim(),
      gender: gender.trim(),
      doctorName: doctorName.trim(),
      doctorDegree: doctorDegree.trim(),
      consultation: consultation.trim(),
      reportDate: reportDate,
      reportTime: reportTime
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
    (document.getElementById('age') as HTMLInputElement).value = '';
    (document.getElementById('socialNumber') as HTMLInputElement).value = '';
    
    const genderSelect = document.getElementById('gender') as HTMLSelectElement;
    if (genderSelect) genderSelect.selectedIndex = 0;
    
    const doctorSelect = document.getElementById('doctorName') as HTMLSelectElement;
    if (doctorSelect) doctorSelect.selectedIndex = 0;
    
    const doctorDegreeSelect = document.getElementById('doctorDegree') as HTMLSelectElement;
    if (doctorDegreeSelect) doctorDegreeSelect.selectedIndex = 0;
    
    const consultationSelect = document.getElementById('consultation') as HTMLSelectElement;
    if (consultationSelect) consultationSelect.selectedIndex = 0;
    
    this.setCurrentDate();
    this.setCurrentTime();

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

      <div class="print-patient-info print-only">
        <div class="print-patient-right">
          <div class="print-data-row">
            <span class="print-data-label">الطبيب: <span class="print-data-value">${formData.doctorName}</span></span>
          </div>
          <div class="print-data-row">
            <span class="print-data-label">درجة الطبيب: <span class="print-data-value">${formData.doctorDegree}</span></span>
          </div>
        </div>
        <div class="print-patient-left">
          <div class="print-data-row">
            <span class="print-data-label">التاريخ: <span class="print-data-value">${formData.reportDate}</span></span>
          </div>
          <div class="print-data-row">
            <span class="print-data-label">الوقت: <span class="print-data-value">${formData.reportTime}</span></span>
          </div>
        </div>
      </div>

      <div class="print-only" style="margin-bottom: 12px;">
        <div class="print-data-row" style="border-bottom: 1px solid #000; padding-bottom: 8px;">
          <span class="print-data-label">اسم المريض: <span class="print-data-value">${formData.patientName}</span></span>
        </div>
        <div class="print-data-row" style="border-bottom: 1px solid #000; padding-bottom: 8px;">
          <span class="print-data-label">السن: <span class="print-data-value">${formData.age}</span></span>
          <span class="print-data-label" style="margin-left: 20px;">النوع: <span class="print-data-value">${formData.gender}</span></span>
          <span class="print-data-label" style="margin-left: 20px;">الرقم القومي: <span class="print-data-value">${formData.socialNumber}</span></span>
        </div>
        <div class="print-data-row" style="border-bottom: 1px solid #000; padding-bottom: 8px;">
          <span class="print-data-label">رقم المريض: <span class="print-data-value">${formData.patientId}</span></span>
          <span class="print-data-label" style="margin-left: 20px;">العيادة: <span class="print-data-value">${formData.consultation}</span></span>
        </div>
      </div>

      <div class="page">
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
      (document.getElementById('age') as HTMLInputElement).value = report.age || '';
      (document.getElementById('socialNumber') as HTMLInputElement).value = report.socialNumber || '';
      
      const genderSelect = document.getElementById('gender') as HTMLSelectElement;
      if (genderSelect) genderSelect.value = report.gender || '';
      
      const doctorSelect = document.getElementById('doctorName') as HTMLSelectElement;
      if (doctorSelect) doctorSelect.value = report.doctorName || '';
      
      const doctorDegreeSelect = document.getElementById('doctorDegree') as HTMLSelectElement;
      if (doctorDegreeSelect) doctorDegreeSelect.value = report.doctorDegree || '';
      
      const consultationSelect = document.getElementById('consultation') as HTMLSelectElement;
      if (consultationSelect) consultationSelect.value = report.consultation || '';
      
      // Only set date if report has one, otherwise keep the default current date
      if (report.reportDate) {
        (document.getElementById('reportDate') as HTMLInputElement).value = report.reportDate;
      }
      
      if (report.reportTime) {
        (document.getElementById('reportTime') as HTMLInputElement).value = report.reportTime;
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
      (document.getElementById('age') as HTMLInputElement).value = data.age || '';
      (document.getElementById('socialNumber') as HTMLInputElement).value = data.socialNumber || '';
      
      const genderSelect = document.getElementById('gender') as HTMLSelectElement;
      if (genderSelect) genderSelect.value = data.gender || '';
      
      const doctorSelect = document.getElementById('doctorName') as HTMLSelectElement;
      if (doctorSelect) doctorSelect.value = data.doctorName || '';
      
      const doctorDegreeSelect = document.getElementById('doctorDegree') as HTMLSelectElement;
      if (doctorDegreeSelect) doctorDegreeSelect.value = data.doctorDegree || '';
      
      const consultationSelect = document.getElementById('consultation') as HTMLSelectElement;
      if (consultationSelect) consultationSelect.value = data.consultation || '';
      
      // Only set date if draft has one, otherwise keep the default current date
      if (data.reportDate) {
        (document.getElementById('reportDate') as HTMLInputElement).value = data.reportDate;
      }
      
      if (data.reportTime) {
        (document.getElementById('reportTime') as HTMLInputElement).value = data.reportTime;
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
