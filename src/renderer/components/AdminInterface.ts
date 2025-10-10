/**
 * Admin Interface component
 */

import { EventManager } from '../utils/EventManager';
import { StateManager } from '../utils/StateManager';
import { apiService } from '../services/ApiService';
import { Dialog } from './Dialog';

export class AdminInterface {
  private eventManager: EventManager;
  private stateManager: StateManager;
  private currentSection = 'database';
  private procedureCodesData: any[] = [];
  private medicationsData: any[] = [];
  private diagnosesData: any[] = [];
  private currentPage = 1;
  private itemsPerPage = 50;
  private filteredData: any[] = [];

  constructor(eventManager: EventManager, stateManager: StateManager) {
    this.eventManager = eventManager;
    this.stateManager = stateManager;
  }

  async render(): Promise<string> {
    return `
      <div class="admin-container">
        <div class="admin-header">
          <h2>إعدادات النظام</h2>
          <p>إدارة البيانات الأساسية للنظام</p>
        </div>

        <div class="admin-tabs">
          <button class="admin-tab active" data-section="database">إعدادات قاعدة البيانات</button>
          <button class="admin-tab" data-section="hospital-config">بيانات المستشفى</button>
          <button class="admin-tab" data-section="doctors">الأطباء</button>
          <button class="admin-tab" data-section="clinics">العيادات</button>
          <button class="admin-tab" data-section="medication-levels">مستويات الوصف</button>
          <button class="admin-tab" data-section="routes">طرق الإعطاء</button>
          <button class="admin-tab" data-section="frequencies">التكرار</button>
          <button class="admin-tab" data-section="durations">المدة</button>
          <button class="admin-tab" data-section="medications">الأدوية</button>
          <button class="admin-tab" data-section="pharmacies">الصيدليات</button>
          <button class="admin-tab" data-section="procedure-codes">رموز الإجراءات</button>
          <button class="admin-tab" data-section="diagnoses">التشخيصات المزمنة</button>
        </div>

        <div class="admin-content" id="admin-content">
          <p>جاري تحميل المحتوى...</p>
        </div>
      </div>
    `;
  }

  async initialize(): Promise<void> {
    this.setupEventListeners();
    await this.loadSection('database');
  }

  private setupEventListeners(): void {
    const tabs = document.querySelectorAll('.admin-tab');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const section = target.dataset.section;
        
        if (section && section !== this.currentSection) {
          this.switchTab(section, tabs);
          this.loadSection(section);
        }
      });
    });
  }

  private switchTab(section: string, tabs: NodeListOf<Element>): void {
    tabs.forEach(tab => {
      tab.classList.remove('active');
      if ((tab as HTMLElement).dataset.section === section) {
        tab.classList.add('active');
      }
    });
    this.currentSection = section;
  }

  private async loadSection(section: string): Promise<void> {
    const adminContent = document.getElementById('admin-content');
    if (!adminContent) return;

    try {
      if (section === 'database') {
        adminContent.innerHTML = await this.createDatabaseSettingsContent();
        this.setupDatabaseEventListeners();
      } else if (section === 'hospital-config') {
        adminContent.innerHTML = await this.createHospitalConfigContent();
        this.setupHospitalConfigListeners();
      } else {
        await this.loadAdminSection(section);
      }
    } catch (error) {
      console.error(`Error loading admin section ${section}:`, error);
      adminContent.innerHTML = '<p>خطأ في تحميل البيانات</p>';
    }
  }

  private async createHospitalConfigContent(): Promise<string> {
    const cfg = await apiService.getHospitalConfig().catch(() => ({} as any));
    const name = (cfg?.name ?? '').toString();
    const address = (cfg?.address ?? '').toString();
    const phone = (cfg?.phone ?? '').toString();

    return `
      <div class="admin-section">
        <div class="section-header">
          <h3>بيانات المستشفى</h3>
          <p>سيتم استخدام هذه البيانات في رأس الطباعة والتقارير</p>
        </div>

        <div class="form-group">
          <label>اسم المستشفى *</label>
          <input type="text" id="hospitalName" placeholder="اسم المستشفى" value="${name}">
        </div>
        <div class="form-group">
          <label>العنوان</label>
          <input type="text" id="hospitalAddress" placeholder="العنوان" value="${address}">
        </div>
        <div class="form-group">
          <label>رقم الهاتف</label>
          <input type="text" id="hospitalPhone" placeholder="رقم الهاتف" value="${phone}">
        </div>

        <div class="form-group">
          <label>شعار المستشفى (اختياري)</label>
          <div style="display:flex; gap: 12px; align-items: center;">
            <input type="file" id="hospitalLogo" accept="image/*">
            ${cfg?.logo ? `<img id="hospitalLogoPreview" src="${cfg.logo}" alt="Logo preview" style="height:48px; border:1px solid #ddd; padding:2px; border-radius:4px;"/>` : '<img id="hospitalLogoPreview" style="display:none; height:48px;" />'}
            <button class="btn" id="removeHospitalLogoBtn" ${cfg?.logo ? '' : 'style="display:none;"'}>إزالة الشعار</button>
          </div>
          <p class="help-text">سيتم حفظ الشعار داخل قاعدة البيانات واستخدامه في رأس الطباعة.</p>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" id="saveHospitalConfigBtn">حفظ</button>
        </div>
      </div>
    `;
  }

  private setupHospitalConfigListeners(): void {
    const saveBtn = document.getElementById('saveHospitalConfigBtn');
    saveBtn?.addEventListener('click', async () => {
      const name = (document.getElementById('hospitalName') as HTMLInputElement)?.value?.trim() || '';
      const address = (document.getElementById('hospitalAddress') as HTMLInputElement)?.value?.trim() || '';
      const phone = (document.getElementById('hospitalPhone') as HTMLInputElement)?.value?.trim() || '';
      const logoPreview = document.getElementById('hospitalLogoPreview') as HTMLImageElement | null;
      const logo = logoPreview?.src && logoPreview.style.display !== 'none' ? logoPreview.src : null;

      if (!name) {
        void Dialog.alert('يرجى إدخال اسم المستشفى');
        return;
      }

      try {
        await apiService.saveHospitalConfig({ name, address, phone, logo });
        await Dialog.alert('تم حفظ بيانات المستشفى');
      } catch (error) {
        console.error('Error saving hospital config:', error);
        void Dialog.alert('خطأ في الحفظ');
      }
    });

    // Logo file picker handling
    const fileInput = document.getElementById('hospitalLogo') as HTMLInputElement | null;
    const preview = document.getElementById('hospitalLogoPreview') as HTMLImageElement | null;
    const removeBtn = document.getElementById('removeHospitalLogoBtn') as HTMLButtonElement | null;

    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await this.resizeImageToDataUrl(file, { maxWidth: 600, maxHeight: 200, quality: 0.8 });
        if (preview) {
          preview.src = dataUrl;
          preview.style.display = 'inline-block';
          if (removeBtn) removeBtn.style.display = '';
        }
      } catch (err) {
        console.error('Logo resize/compress failed', err);
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string' && preview) {
            preview.src = reader.result;
            preview.style.display = 'inline-block';
            if (removeBtn) removeBtn.style.display = '';
          }
        };
        reader.readAsDataURL(file);
      }
    });

    removeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (preview) {
        preview.src = '';
        preview.style.display = 'none';
      }
      if (fileInput) fileInput.value = '';
      if (removeBtn) removeBtn.style.display = 'none';
    });
  }

  private resizeImageToDataUrl(file: File, opts: { maxWidth: number; maxHeight: number; quality: number }): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          try {
            const { maxWidth, maxHeight, quality } = opts;
            let { width, height } = img;

            // Compute target size keeping aspect ratio
            const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
            const targetW = Math.round(width * ratio);
            const targetH = Math.round(height * ratio);

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('No 2D context'));
            ctx.clearRect(0, 0, targetW, targetH);
            ctx.drawImage(img, 0, 0, targetW, targetH);

            // Prefer PNG if original has alpha; otherwise JPEG
            const isPng = (file.type || '').toLowerCase().includes('png');
            const mime = isPng ? 'image/png' : 'image/jpeg';
            const q = isPng ? 0.92 : Math.min(Math.max(quality, 0.5), 0.9);

            canvas.toBlob((blob) => {
              if (!blob) return reject(new Error('Canvas export failed'));
              const fr = new FileReader();
              fr.onload = () => resolve(String(fr.result || ''));
              fr.onerror = () => reject(new Error('Failed to read compressed blob'));
              fr.readAsDataURL(blob);
            }, mime, q);
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  }

  private async createDatabaseSettingsContent(): Promise<string> {
    let currentPath = '';
    try {
      currentPath = await apiService.getDatabasePath();
    } catch (error) {
      currentPath = 'C:\\clinics-db\\clinics.db';
    }

    return `
      <div class="admin-section">
        <div class="section-header">
          <h3>إعدادات قاعدة البيانات</h3>
          <p>إدارة مسار قاعدة البيانات</p>
        </div>

        <div class="database-settings">
          <div class="form-group">
            <label>مسار قاعدة البيانات الحالي</label>
            <div class="path-display">
              <input type="text" id="databasePath" value="${currentPath}" readonly class="database-path-input">
              <button class="btn btn-primary" id="selectDatabasePathBtn">تغيير المسار</button>
            </div>
            <p class="help-text">انقر على "تغيير المسار" لاختيار مجلد جديد لحفظ قاعدة البيانات</p>
          </div>

          <div class="form-actions">
            <button class="btn" id="resetDatabasePathBtn">إعادة تعيين للمسار الافتراضي</button>
            <button class="btn btn-success" id="createBackupBtn">إنشاء نسخة احتياطية</button>
          </div>

          <div class="database-info">
            <h4>معلومات قاعدة البيانات</h4>
            <div id="databaseInfo">
              <p>جاري تحميل معلومات قاعدة البيانات...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private setupDatabaseEventListeners(): void {
    const selectBtn = document.getElementById('selectDatabasePathBtn');
    selectBtn?.addEventListener('click', () => this.selectDatabasePath());

    const resetBtn = document.getElementById('resetDatabasePathBtn');
    resetBtn?.addEventListener('click', () => this.resetDatabasePath());

    const backupBtn = document.getElementById('createBackupBtn');
    backupBtn?.addEventListener('click', () => this.createBackup());

    // Load database info
    setTimeout(() => {
      this.loadDatabaseInfo();
    }, 100);
  }

  private async selectDatabasePath(): Promise<void> {
    try {
      const newPath = await apiService.selectDatabasePath();
      if (newPath) {
        (document.getElementById('databasePath') as HTMLInputElement).value = newPath;
        await this.loadDatabaseInfo();
      }
    } catch (error) {
      console.error('Error selecting database path:', error);
      void Dialog.alert('خطأ في اختيار المسار');
    }
  }

  private async resetDatabasePath(): Promise<void> {
    const confirmed = await Dialog.confirm('هل تريد إعادة تعيين مسار قاعدة البيانات للمسار الافتراضي؟');
    if (!confirmed) return;
    try {
      await apiService.resetDatabasePath();
      const defaultPath = 'C\\clinics-db\\clinics.db';
      (document.getElementById('databasePath') as HTMLInputElement).value = defaultPath;
      await this.loadDatabaseInfo();
    } catch (error) {
      console.error('Error resetting database path:', error);
      void Dialog.alert('خطأ في إعادة تعيين المسار');
    }
  }

  private async createBackup(): Promise<void> {
    try {
      const backupPath = await apiService.createDatabaseBackup();
      if (backupPath) {
        // Success alert removed for streamlined user experience
        // Backup created successfully at: ${backupPath}
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      void Dialog.alert('خطأ في إنشاء النسخة الاحتياطية');
    }
  }

  private async loadDatabaseInfo(): Promise<void> {
    try {
      const info = await apiService.getDatabaseInfo();
      const infoDiv = document.getElementById('databaseInfo');
      if (infoDiv && info) {
        infoDiv.innerHTML = `
          <p><strong>حجم الملف:</strong> ${info.size}</p>
          <p><strong>تاريخ آخر تعديل:</strong> ${info.lastModified}</p>
          <p><strong>عدد الروشتات:</strong> ${info.prescriptionsCount}</p>
          <p><strong>عدد الأطباء:</strong> ${info.doctorsCount}</p>
        `;
      }
    } catch (error) {
      console.error('Error loading database info:', error);
      const infoDiv = document.getElementById('databaseInfo');
      if (infoDiv) {
        infoDiv.innerHTML = '<p>خطأ في تحميل معلومات قاعدة البيانات</p>';
      }
    }
  }

  private async loadAdminSection(section: string): Promise<void> {
    const adminContent = document.getElementById('admin-content');
    if (!adminContent) return;

    try {
      let data: any[] = [];
      let title = '';
      let fields: any[] = [];

      switch (section) {
        case 'doctors':
          data = await apiService.getDoctorsList();
          title = 'الأطباء';
          fields = [{ key: 'name', label: 'اسم الطبيب', type: 'text', required: true }];
          break;
        case 'clinics':
          data = await apiService.getClinics();
          title = 'العيادات';
          fields = [{ key: 'name', label: 'اسم العيادة', type: 'text', required: true }];
          break;
        case 'medication-levels':
          data = await apiService.getMedicationLevels();
          title = 'مستويات الوصف';
          fields = [{ key: 'levelName', label: 'مستوى الوصف', type: 'text', required: true }];
          break;
        case 'routes':
          data = await apiService.getAdministrationRoutes();
          title = 'طرق الإعطاء';
          fields = [{ key: 'routeName', label: 'طريقة الإعطاء', type: 'text', required: true }];
          break;
        case 'frequencies':
          data = await apiService.getFrequencies();
          title = 'التكرار';
          fields = [{ key: 'frequencyName', label: 'التكرار', type: 'text', required: true }];
          break;
        case 'durations':
          data = await apiService.getDurations();
          title = 'المدة';
          fields = [{ key: 'durationName', label: 'المدة', type: 'text', required: true }];
          break;
        case 'medications':
          data = await apiService.getMedications();
          this.medicationsData = data; // Store for pagination
          title = 'الأدوية';
          fields = [
            { key: 'name', label: 'اسم الدواء', type: 'text', required: true },
            { key: 'genericName', label: 'الاسم العلمي', type: 'text', required: false },
            { key: 'prescribingLevel', label: 'مستوى الوصف', type: 'text', required: false },
            { key: 'preAuthorizationProtocol', label: 'موافقة مسبقة/بروتوكول', type: 'text', required: false }
          ];
          break;
        case 'pharmacies':
          data = await apiService.getPharmacies();
          title = 'الصيدليات';
          fields = [{ key: 'name', label: 'اسم الصيدلية', type: 'text', required: true }];
          break;
        case 'procedure-codes':
          data = await apiService.getProcedureCodes();
          this.procedureCodesData = data; // Store for filtering
          title = 'رموز الإجراءات';
          fields = [
            { key: 'ar_name', label: 'الاسم العربي', type: 'text', required: true },
            { key: 'en_name', label: 'الاسم الإنجليزي', type: 'text', required: true },
            { key: 'uhia_code', label: 'رمز UHIA', type: 'text', required: true },
            { key: 'category', label: 'الفئة', type: 'text', required: false }
          ];
          break;
        case 'diagnoses':
          data = await apiService.getDiagnoses();
          this.diagnosesData = data; // Store for filtering
          title = 'التشخيصات المزمنة';
          fields = [
            { key: 'diagnosis_code', label: 'كود التشخيص', type: 'text', required: false },
            { key: 'ar_name', label: 'الاسم العربي', type: 'text', required: true },
            { key: 'en_name', label: 'الاسم الإنجليزي', type: 'text', required: true },
            { key: 'category', label: 'الفئة', type: 'text', required: false }
          ];
          break;
      }

      // Reset pagination for new section
      this.currentPage = 1;
      this.filteredData = data;

      adminContent.innerHTML = this.createAdminSectionContent(section, title, data, fields);
      this.setupAdminSectionEventListeners(section, fields);
    } catch (error) {
      console.error('Error loading admin data:', error);
      adminContent.innerHTML = '<p>خطأ في تحميل البيانات</p>';
    }
  }

  private createAdminSectionContent(_section: string, title: string, data: any[], fields: any[]): string {
    const hasSearch = _section === 'procedure-codes' || _section === 'medications' || _section === 'diagnoses';
    const hasImportExport = _section === 'procedure-codes' || _section === 'medications' || _section === 'diagnoses';
    const hasPagination = _section === 'medications' || _section === 'procedure-codes' || _section === 'diagnoses';
    
    // Paginate data if needed
    let displayData = data;
    let totalPages = 1;
    let startIndex = 0;
    
    if (hasPagination) {
      totalPages = Math.ceil(data.length / this.itemsPerPage);
      startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      displayData = data.slice(startIndex, endIndex);
    }
    
    return `
      <div class="admin-section">
        <div class="section-header">
          <h3>${title}</h3>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            ${hasImportExport ? `
              <button class="btn btn-success" id="exportProceduresBtn" title="Export to CSV">
                Export
              </button>
              <button class="btn btn-info" id="importProceduresBtn" title="Import from CSV">
                Import
              </button>
            ` : ''}
            <button class="btn btn-primary" id="addItemBtn">إضافة جديد</button>
          </div>
        </div>

        ${hasImportExport ? `
        <div class="import-instructions" style="background: #f0f8ff; border: 1px solid #b3d9ff; padding: 1.5rem; margin-bottom: 1rem; border-radius: 4px; direction: ltr; text-align: left;">
          <strong>Import Instructions:</strong>
          <p style="margin: 0.5rem 0;">The CSV file must contain the following columns in order:</p>
          <ol style="margin: 0.5rem 0 0.5rem 1.5rem; padding: 0;">
            ${_section === 'procedure-codes' ? `
            <li><code>uhia_code</code> - UHIA Code</li>
            <li><code>ar_name</code> - Arabic Name</li>
            <li><code>en_name</code> - English Name</li>
            <li><code>category</code> - Category (optional)</li>
            ` : ''}
            ${_section === 'medications' ? `
            <li><code>name</code> - Drug Name</li>
            <li><code>genericName</code> - Generic Name (optional)</li>
            <li><code>prescribingLevel</code> - Prescribing Level (optional)</li>
            <li><code>preAuthorizationProtocol</code> - Pre-Authorization/Protocol (optional)</li>
            ` : ''}
            ${_section === 'diagnoses' ? `
            <li><code>diagnosis_code</code> - Diagnosis Code (optional; left empty cells will be auto-filled randomly)</li>
            <li><code>ar_name</code> - Arabic Name (required)</li>
            <li><code>en_name</code> - English Name (required)</li>
            <li><code>category</code> - Category (optional)</li>
            ` : ''}
          </ol>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #666;">
            Note: The first row must be the header row with the exact column names listed above.
          </p>
        </div>
        ` : ''}

        ${hasSearch ? `
        <div class="search-container" style="margin-bottom: 1rem;">
          <input 
            type="text" 
            id="searchInput" 
            placeholder="${_section === 'medications' ? 'بحث باسم الدواء أو الاسم العلمي...' : 'بحث بالاسم العربي، الإنجليزي، الرمز أو الفئة...'}" 
            class="form-control"
            style="width: 100%; padding: 0.75rem; font-size: 1rem; border: 1px solid #ddd; border-radius: 4px;"
          />
        </div>
        ` : ''}

        <div class="data-table">
          <table class="medications-table">
            <colgroup>
              <col style="width: 3rem;">
              ${fields.map(() => '<col>').join('')}
              <col>
            </colgroup>
            <thead>
              <tr>
                <th>الرقم</th>
                ${fields.map(field => `<th>${field.label}</th>`).join('')}
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${displayData.map((item, index) => `
                <tr>
                  <td>${startIndex + index + 1}</td>
                  ${fields.map(field => `<td>${item[field.key] || ''}</td>`).join('')}
                  <td>
                    <button class="btn btn-small edit-btn" data-id="${item.id}">تعديل</button>
                    <button class="btn btn-small btn-danger delete-btn" data-id="${item.id}" data-name="${item.name || item.levelName || item.routeName || item.frequencyName || item.durationName || item.ar_name || item.en_name}">حذف</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${hasPagination ? `
        <div class="pagination-controls" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-top: 1px solid #ddd;">
          <div class="pagination-info">
            عرض ${startIndex + 1} - ${Math.min(startIndex + this.itemsPerPage, data.length)} من ${data.length}
          </div>
          <div class="pagination-buttons" style="display: flex; gap: 0.5rem;">
            <button class="btn btn-small" id="firstPageBtn" ${this.currentPage === 1 ? 'disabled' : ''}>الأول</button>
            <button class="btn btn-small" id="prevPageBtn" ${this.currentPage === 1 ? 'disabled' : ''}>السابق</button>
            <span style="padding: 0.5rem 1rem; background: #f0f0f0; border-radius: 4px;">
              صفحة ${this.currentPage} من ${totalPages}
            </span>
            <button class="btn btn-small" id="nextPageBtn" ${this.currentPage === totalPages ? 'disabled' : ''}>التالي</button>
            <button class="btn btn-small" id="lastPageBtn" ${this.currentPage === totalPages ? 'disabled' : ''}>الأخير</button>
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Modal for Add/Edit -->
      <div id="adminModal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h4 id="modalTitle">إضافة جديد</h4>
            <span class="modal-close" id="closeModalBtn">&times;</span>
          </div>
          <div class="modal-body">
            <form id="adminForm">
              <!-- Form fields will be populated dynamically -->
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn" id="cancelBtn">إلغاء</button>
            <button type="button" class="btn btn-primary" id="saveItemBtn">حفظ</button>
          </div>
        </div>
      </div>
    `;
  }

  private setupAdminSectionEventListeners(section: string, fields: any[]): void {
    const addBtn = document.getElementById('addItemBtn');
    addBtn?.addEventListener('click', () => this.showAddModal(section, fields));

    const editBtns = document.querySelectorAll('.edit-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const id = parseInt(target.dataset.id!);
        this.editItem(section, id, fields);
      });
    });

    const deleteBtns = document.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const id = parseInt(target.dataset.id!);
        const name = target.dataset.name!;
        this.deleteItem(section, id, name);
      });
    });

    const closeBtn = document.getElementById('closeModalBtn');
    closeBtn?.addEventListener('click', () => this.closeModal());

    const cancelBtn = document.getElementById('cancelBtn');
    cancelBtn?.addEventListener('click', () => this.closeModal());

    const saveBtn = document.getElementById('saveItemBtn');
    saveBtn?.addEventListener('click', () => this.saveItem(section));

    // Add search functionality
    if (section === 'procedure-codes' || section === 'medications' || section === 'diagnoses') {
      const searchInput = document.getElementById('searchInput') as HTMLInputElement;
      searchInput?.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.toLowerCase().trim();
        if (section === 'procedure-codes') {
          this.filterProcedureCodes(query, fields);
        } else if (section === 'medications') {
          this.filterMedications(query, fields);
        } else if (section === 'diagnoses') {
          this.filterDiagnoses(query, fields);
        }
      });

      // Add import/export functionality
      const exportBtn = document.getElementById('exportProceduresBtn');
      exportBtn?.addEventListener('click', () => {
        if (section === 'procedure-codes') {
          this.exportProceduresToCSV();
        } else if (section === 'medications') {
          this.exportMedicationsToCSV();
        } else if (section === 'diagnoses') {
          this.exportDiagnosesToCSV();
        }
      });

      const importBtn = document.getElementById('importProceduresBtn');
      importBtn?.addEventListener('click', () => {
        if (section === 'procedure-codes') {
          this.importProceduresFromCSV();
        } else if (section === 'medications') {
          this.importMedicationsFromCSV();
        } else if (section === 'diagnoses') {
          this.importDiagnosesFromCSV();
        }
      });
    }

    // Add pagination event listeners
    if (section === 'medications' || section === 'procedure-codes' || section === 'diagnoses') {
      const firstPageBtn = document.getElementById('firstPageBtn');
      firstPageBtn?.addEventListener('click', () => this.goToPage(1, section, fields));

      const prevPageBtn = document.getElementById('prevPageBtn');
      prevPageBtn?.addEventListener('click', () => this.goToPage(this.currentPage - 1, section, fields));

      const nextPageBtn = document.getElementById('nextPageBtn');
      nextPageBtn?.addEventListener('click', () => this.goToPage(this.currentPage + 1, section, fields));

      const lastPageBtn = document.getElementById('lastPageBtn');
      const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
      lastPageBtn?.addEventListener('click', () => this.goToPage(totalPages, section, fields));
    }
  }

  private showAddModal(section: string, fields: any[]): void {
    const modal = document.getElementById('adminModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('adminForm');

    if (!modal || !modalTitle || !form) return;

    modalTitle.textContent = 'إضافة جديد';
    form.innerHTML = fields.map(field => `
      <div class="form-group">
        <label>${field.label}${field.required ? ' *' : ''}</label>
        <input type="${field.type}" name="${field.key}" ${field.required ? 'required' : ''} placeholder="${field.label}">
      </div>
    `).join('');

    modal.style.display = 'flex';
    
    // Focus the first input in the modal
    setTimeout(() => {
      const firstInput = form.querySelector('input') as HTMLInputElement;
      if (firstInput) {
        try {
          firstInput.focus();
          firstInput.select?.();
        } catch {}
      }
    }, 100);
  }

  private async editItem(section: string, id: number, fields: any[]): Promise<void> {
    try {
      const item = await apiService.getAdminItem(section, id);
      if (!item) {
        await Dialog.alert('العنصر غير موجود');
        return;
      }

      const modal = document.getElementById('adminModal');
      const modalTitle = document.getElementById('modalTitle');
      const form = document.getElementById('adminForm');

      if (!modal || !modalTitle || !form) return;

      modalTitle.textContent = 'تعديل العنصر';
      form.innerHTML = fields.map(field => `
        <div class="form-group">
          <label>${field.label}${field.required ? ' *' : ''}</label>
          <input type="${field.type}" name="${field.key}" ${field.required ? 'required' : ''} placeholder="${field.label}" value="${item[field.key] || ''}">
        </div>
      `).join('');

      // Store the current item ID for saving
      (modal as any).dataset.itemId = id;
      (modal as any).dataset.isEdit = 'true';

      modal.style.display = 'flex';
      
      // Focus the first input in the modal
      setTimeout(() => {
        const firstInput = form.querySelector('input') as HTMLInputElement;
        if (firstInput) {
          try {
            firstInput.focus();
            firstInput.select?.();
          } catch {}
        }
      }, 100);
    } catch (error) {
      console.error('Error loading item for edit:', error);
      void Dialog.alert('خطأ في تحميل البيانات');
    }
  }

  private async deleteItem(section: string, id: number, name: string): Promise<void> {
    const confirmed = await Dialog.confirm(`هل أنت متأكد من حذف "${name}"؟`);
    if (!confirmed) return;

    try {
      await apiService.deleteAdminItem(section, id);
      await this.loadSection(section);
      // Success alert removed for streamlined user experience
    } catch (error) {
      console.error('Error deleting item:', error);
      void Dialog.alert('خطأ في الحذف');
    }
  }

  private async saveItem(section: string): Promise<void> {
    const form = document.getElementById('adminForm') as HTMLFormElement;
    const modal = document.getElementById('adminModal');
    if (!form || !modal) return;

    const formData = new FormData(form);
    const data: any = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    try {
      const isEdit = (modal as any).dataset.isEdit === 'true';
      const itemId = (modal as any).dataset.itemId;

      if (isEdit && itemId) {
        await apiService.updateAdminItem(section, parseInt(itemId), data);
      } else {
        await apiService.createAdminItem(section, data);
      }

      this.closeModal();
      await this.loadSection(section);
      // Success alert removed for streamlined user experience
    } catch (error) {
      console.error('Error saving item:', error);
      void Dialog.alert('خطأ في الحفظ');
    }
  }

  private closeModal(): void {
    const modal = document.getElementById('adminModal');
    if (modal) {
      modal.style.display = 'none';
      // Clear edit state
      delete (modal as any).dataset.itemId;
      delete (modal as any).dataset.isEdit;
    }
  }

  private goToPage(page: number, section: string, fields: any[]): void {
    this.currentPage = page;
    this.renderTable(section, this.filteredData, fields);
  }

  private renderTable(section: string, data: any[], fields: any[]): void {
    const tbody = document.querySelector('.medications-table tbody');
    const paginationInfo = document.querySelector('.pagination-info');
    const paginationButtons = document.querySelector('.pagination-buttons');
    
    if (!tbody) return;

    // Calculate pagination
    const totalPages = Math.ceil(data.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const displayData = data.slice(startIndex, endIndex);

    // Update table
    tbody.innerHTML = displayData.map((item, index) => `
      <tr>
        <td>${startIndex + index + 1}</td>
        ${fields.map(field => `<td>${item[field.key] || ''}</td>`).join('')}
        <td>
          <button class="btn btn-small edit-btn" data-id="${item.id}">تعديل</button>
          <button class="btn btn-small btn-danger delete-btn" data-id="${item.id}" data-name="${item.name || item.ar_name || item.en_name}">حذف</button>
        </td>
      </tr>
    `).join('');

    // Update pagination info
    if (paginationInfo) {
      paginationInfo.textContent = `عرض ${startIndex + 1} - ${Math.min(endIndex, data.length)} من ${data.length}`;
    }

    // Update pagination buttons
    if (paginationButtons) {
      paginationButtons.innerHTML = `
        <button class="btn btn-small" id="firstPageBtn" ${this.currentPage === 1 ? 'disabled' : ''}>الأول</button>
        <button class="btn btn-small" id="prevPageBtn" ${this.currentPage === 1 ? 'disabled' : ''}>السابق</button>
        <span style="padding: 0.5rem 1rem; background: #f0f0f0; border-radius: 4px;">
          صفحة ${this.currentPage} من ${totalPages}
        </span>
        <button class="btn btn-small" id="nextPageBtn" ${this.currentPage === totalPages ? 'disabled' : ''}>التالي</button>
        <button class="btn btn-small" id="lastPageBtn" ${this.currentPage === totalPages ? 'disabled' : ''}>الأخير</button>
      `;

      // Re-attach pagination event listeners
      const firstPageBtn = document.getElementById('firstPageBtn');
      firstPageBtn?.addEventListener('click', () => this.goToPage(1, section, fields));

      const prevPageBtn = document.getElementById('prevPageBtn');
      prevPageBtn?.addEventListener('click', () => this.goToPage(this.currentPage - 1, section, fields));

      const nextPageBtn = document.getElementById('nextPageBtn');
      nextPageBtn?.addEventListener('click', () => this.goToPage(this.currentPage + 1, section, fields));

      const lastPageBtn = document.getElementById('lastPageBtn');
      lastPageBtn?.addEventListener('click', () => this.goToPage(totalPages, section, fields));
    }

    // Re-attach edit/delete event listeners
    const editBtns = tbody.querySelectorAll('.edit-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const id = parseInt(target.dataset.id!);
        this.editItem(section, id, fields);
      });
    });

    const deleteBtns = tbody.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const id = parseInt(target.dataset.id!);
        const name = target.dataset.name!;
        this.deleteItem(section, id, name);
      });
    });
  }

  private filterProcedureCodes(query: string, fields: any[]): void {
    // Reset to first page when filtering
    this.currentPage = 1;

    if (query) {
      this.filteredData = this.procedureCodesData.filter(item => {
        const arName = (item.ar_name || '').toLowerCase();
        const enName = (item.en_name || '').toLowerCase();
        const code = (item.uhia_code || '').toLowerCase();
        const category = (item.category || '').toLowerCase();

        return arName.includes(query) || 
               enName.includes(query) || 
               code.includes(query) || 
               category.includes(query);
      });
    } else {
      this.filteredData = this.procedureCodesData;
    }

    this.renderTable('procedure-codes', this.filteredData, fields);
  }

  private exportProceduresToCSV(): void {
    try {
      // Create CSV content with headers
      const headers = ['uhia_code', 'ar_name', 'en_name', 'category'];
      const csvRows = [headers.join(',')];

      // Add data rows
      this.procedureCodesData.forEach(item => {
        const row = [
          this.escapeCSVField(item.uhia_code || ''),
          this.escapeCSVField(item.ar_name || ''),
          this.escapeCSVField(item.en_name || ''),
          this.escapeCSVField(item.category || '')
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      // Create a Blob and download
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `procedure-codes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      void Dialog.alert('تم تصدير البيانات بنجاح');
    } catch (error) {
      console.error('Error exporting procedures:', error);
      void Dialog.alert('خطأ في تصدير البيانات');
    }
  }

  private escapeCSVField(field: string): string {
    // Escape quotes and wrap in quotes if needed
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private async importProceduresFromCSV(): Promise<void> {
    try {
      // Create a file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.csv';
      
      fileInput.onchange = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const csvContent = event.target?.result as string;
            const lines = csvContent.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
              await Dialog.alert('الملف فارغ أو غير صحيح');
              return;
            }

            // Parse header
            const headers = this.parseCSVLine(lines[0]);
            
            // Validate headers
            const requiredHeaders = ['uhia_code', 'ar_name', 'en_name'];
            const hasRequiredHeaders = requiredHeaders.every(h => 
              headers.some(header => header.toLowerCase().trim() === h.toLowerCase())
            );

            if (!hasRequiredHeaders) {
              await Dialog.alert('رؤوس الأعمدة غير صحيحة. يجب أن تحتوي على: uhia_code, ar_name, en_name');
              return;
            }

            // Find header indices
            const uhiaCodeIndex = headers.findIndex(h => h.toLowerCase().trim() === 'uhia_code');
            const arNameIndex = headers.findIndex(h => h.toLowerCase().trim() === 'ar_name');
            const enNameIndex = headers.findIndex(h => h.toLowerCase().trim() === 'en_name');
            const categoryIndex = headers.findIndex(h => h.toLowerCase().trim() === 'category');

            // Parse data rows
            const procedures: any[] = [];
            const skippedRows: number[] = [];
            
            for (let i = 1; i < lines.length; i++) {
              const values = this.parseCSVLine(lines[i]);
              
              // Validate that all required fields are present and not empty
              const uhiaCode = values[uhiaCodeIndex]?.trim();
              const arName = values[arNameIndex]?.trim();
              const enName = values[enNameIndex]?.trim();
              
              // Skip rows that don't have all required fields
              if (!uhiaCode || !arName || !enName) {
                skippedRows.push(i + 1); // +1 for human-readable line number
                continue;
              }
              
              // Additional validation: check for commas in uhia_code (indicates malformed data)
              if (uhiaCode.includes(',')) {
                skippedRows.push(i + 1);
                continue;
              }
              
              procedures.push({
                uhia_code: uhiaCode,
                ar_name: arName,
                en_name: enName,
                category: categoryIndex >= 0 ? (values[categoryIndex]?.trim() || '') : ''
              });
            }

            if (procedures.length === 0) {
              await Dialog.alert('لا توجد بيانات صالحة للاستيراد');
              return;
            }

            // Show warning if some rows were skipped
            let confirmMessage = `هل تريد استيراد ${procedures.length} إجراء؟\nملاحظة: سيتم إضافة الإجراءات الجديدة فقط (لن يتم تحديث الموجود).`;
            if (skippedRows.length > 0) {
              confirmMessage += `\n\nتحذير: تم تجاهل ${skippedRows.length} صف بسبب بيانات غير صالحة أو ناقصة.`;
            }

            const confirmed = await Dialog.confirm(confirmMessage);

            if (!confirmed) return;

            // Import procedures one by one
            let successCount = 0;
            let errorCount = 0;
            let duplicateCount = 0;

            for (const procedure of procedures) {
              try {
                await apiService.createAdminItem('procedure-codes', procedure);
                successCount++;
              } catch (error: any) {
                // Check if it's a duplicate key error
                if (error?.message?.includes('UNIQUE constraint failed')) {
                  duplicateCount++;
                } else {
                  console.error('Error importing procedure:', procedure, error);
                  errorCount++;
                }
              }
            }

            // Reload the section to show new data
            await this.loadSection('procedure-codes');

            // Build result message
            let resultMessage = `Import completed:\n✓ Successfully imported: ${successCount}`;
            if (duplicateCount > 0) {
              resultMessage += `\n⚠ Skipped (duplicates): ${duplicateCount}`;
            }
            if (errorCount > 0) {
              resultMessage += `\n✗ Failed: ${errorCount}`;
            }

            await Dialog.alert(resultMessage);
          } catch (error) {
            console.error('Error parsing CSV:', error);
            await Dialog.alert('خطأ في قراءة الملف. تأكد من صحة التنسيق.');
          }
        };

        reader.readAsText(file, 'UTF-8');
      };

      fileInput.click();
    } catch (error) {
      console.error('Error importing procedures:', error);
      void Dialog.alert('خطأ في استيراد البيانات');
    }
  }

  private filterMedications(query: string, fields: any[]): void {
    // Reset to first page when filtering
    this.currentPage = 1;

    if (query) {
      this.filteredData = this.medicationsData.filter(item => {
        const name = (item.name || '').toLowerCase();
        const genericName = (item.genericName || '').toLowerCase();
        const prescribingLevel = (item.prescribingLevel || '').toLowerCase();

        return name.includes(query) || 
               genericName.includes(query) || 
               prescribingLevel.includes(query);
      });
    } else {
      this.filteredData = this.medicationsData;
    }

    this.renderTable('medications', this.filteredData, fields);
  }

  private filterDiagnoses(query: string, fields: any[]): void {
    // Reset to first page when filtering
    this.currentPage = 1;

    if (query) {
      this.filteredData = this.diagnosesData.filter(item => {
        const arName = (item.ar_name || '').toLowerCase();
        const enName = (item.en_name || '').toLowerCase();
        const code = (item.diagnosis_code || '').toLowerCase();
        const category = (item.category || '').toLowerCase();

        return arName.includes(query) ||
               enName.includes(query) ||
               code.includes(query) ||
               category.includes(query);
      });
    } else {
      this.filteredData = this.diagnosesData;
    }

    this.renderTable('diagnoses', this.filteredData, fields);
  }

  private exportDiagnosesToCSV(): void {
    try {
      const headers = ['diagnosis_code', 'ar_name', 'en_name', 'category'];
      const csvRows = [headers.join(',')];

      this.diagnosesData.forEach(item => {
        const row = [
          this.escapeCSVField(item.diagnosis_code || ''),
          this.escapeCSVField(item.ar_name || ''),
          this.escapeCSVField(item.en_name || ''),
          this.escapeCSVField(item.category || '')
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diagnoses-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      void Dialog.alert('تم تصدير البيانات بنجاح');
    } catch (error) {
      console.error('Error exporting diagnoses:', error);
      void Dialog.alert('خطأ في تصدير البيانات');
    }
  }

  private async importDiagnosesFromCSV(): Promise<void> {
    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.csv';

      fileInput.onchange = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const csvContent = event.target?.result as string;
            const lines = csvContent.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
              await Dialog.alert('الملف فارغ أو غير صحيح');
              return;
            }

            const headers = this.parseCSVLine(lines[0]);
            // Required: ar_name, en_name; Optional: diagnosis_code, category
            const arNameIdx = headers.findIndex(h => h.toLowerCase().trim() === 'ar_name');
            const enNameIdx = headers.findIndex(h => h.toLowerCase().trim() === 'en_name');
            const codeIdx = headers.findIndex(h => h.toLowerCase().trim() === 'diagnosis_code');
            const categoryIdx = headers.findIndex(h => h.toLowerCase().trim() === 'category');

            if (arNameIdx < 0 || enNameIdx < 0) {
              await Dialog.alert('رؤوس الأعمدة غير صحيحة. يجب أن تحتوي على: ar_name, en_name');
              return;
            }

            const diagnoses: any[] = [];
            const skippedRows: number[] = [];

            for (let i = 1; i < lines.length; i++) {
              const values = this.parseCSVLine(lines[i]);
              const arName = (values[arNameIdx] || '').trim();
              const enName = (values[enNameIdx] || '').trim();
              let diagnosisCode = codeIdx >= 0 ? (values[codeIdx] || '').trim() : '';
              const category = categoryIdx >= 0 ? (values[categoryIdx] || '').trim() : '';

              if (!arName || !enName) {
                skippedRows.push(i + 1);
                continue;
              }

              if (!diagnosisCode) {
                diagnosisCode = this.generateRandomDiagnosisCode();
              }

              diagnoses.push({ diagnosis_code: diagnosisCode, ar_name: arName, en_name: enName, category });
            }

            if (diagnoses.length === 0) {
              await Dialog.alert('لا توجد بيانات صالحة للاستيراد');
              return;
            }

            let confirmMessage = `هل تريد استيراد ${diagnoses.length} تشخيص؟`;
            if (skippedRows.length > 0) {
              confirmMessage += `\n\nتحذير: تم تجاهل ${skippedRows.length} صف بسبب بيانات ناقصة.`;
            }

            const confirmed = await Dialog.confirm(confirmMessage);
            if (!confirmed) return;

            let successCount = 0;
            let errorCount = 0;
            let duplicateCount = 0;

            for (const dx of diagnoses) {
              try {
                await apiService.createAdminItem('diagnoses', dx);
                successCount++;
              } catch (error: any) {
                if (error?.message?.includes('UNIQUE constraint failed')) {
                  // Try regenerate a few times if duplicate on randomly generated code
                  let retried = 0;
                  let inserted = false;
                  while (retried < 5 && !inserted) {
                    try {
                      const retryDx = { ...dx, diagnosis_code: this.generateRandomDiagnosisCode() };
                      await apiService.createAdminItem('diagnoses', retryDx);
                      successCount++;
                      inserted = true;
                    } catch (err: any) {
                      if (err?.message?.includes('UNIQUE constraint failed')) {
                        retried++;
                        continue;
                      } else {
                        errorCount++;
                        break;
                      }
                    }
                  }
                  if (!inserted) duplicateCount++;
                } else {
                  console.error('Error importing diagnosis:', dx, error);
                  errorCount++;
                }
              }
            }

            await this.loadSection('diagnoses');

            let resultMessage = `Import completed:\n✓ Successfully imported: ${successCount}`;
            if (duplicateCount > 0) resultMessage += `\n⚠ Skipped (duplicates): ${duplicateCount}`;
            if (errorCount > 0) resultMessage += `\n✗ Failed: ${errorCount}`;
            await Dialog.alert(resultMessage);
          } catch (error) {
            console.error('Error parsing CSV:', error);
            await Dialog.alert('خطأ في قراءة الملف. تأكد من صحة التنسيق.');
          }
        };

        reader.readAsText(file, 'UTF-8');
      };

      fileInput.click();
    } catch (error) {
      console.error('Error importing diagnoses:', error);
      void Dialog.alert('خطأ في استيراد البيانات');
    }
  }

  private generateRandomDiagnosisCode(): string {
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    const ts = Date.now().toString(36).toUpperCase();
    return `DX-${ts}-${rand}`;
  }

  private exportMedicationsToCSV(): void {
    try {
      // Create CSV content with headers
      const headers = ['name', 'genericName', 'prescribingLevel', 'preAuthorizationProtocol'];
      const csvRows = [headers.join(',')];

      // Add data rows
      this.medicationsData.forEach(item => {
        const row = [
          this.escapeCSVField(item.name || ''),
          this.escapeCSVField(item.genericName || ''),
          this.escapeCSVField(item.prescribingLevel || ''),
          this.escapeCSVField(item.preAuthorizationProtocol || '')
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      // Create a Blob and download
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medications-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      void Dialog.alert('تم تصدير البيانات بنجاح');
    } catch (error) {
      console.error('Error exporting medications:', error);
      void Dialog.alert('خطأ في تصدير البيانات');
    }
  }

  private async importMedicationsFromCSV(): Promise<void> {
    try {
      // Create a file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.csv';
      
      fileInput.onchange = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const csvContent = event.target?.result as string;
            const lines = csvContent.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
              await Dialog.alert('الملف فارغ أو غير صحيح');
              return;
            }

            // Parse header
            const headers = this.parseCSVLine(lines[0]);
            
            // Validate headers - only 'name' is required
            const hasNameHeader = headers.some(h => h.toLowerCase().trim() === 'name');

            if (!hasNameHeader) {
              await Dialog.alert('رؤوس الأعمدة غير صحيحة. يجب أن تحتوي على: name');
              return;
            }

            // Find header indices
            const nameIndex = headers.findIndex(h => h.toLowerCase().trim() === 'name');
            const genericNameIndex = headers.findIndex(h => h.toLowerCase().trim() === 'genericname');
            const prescribingLevelIndex = headers.findIndex(h => h.toLowerCase().trim() === 'prescribinglevel');
            const preAuthIndex = headers.findIndex(h => h.toLowerCase().trim() === 'preauthorizationprotocol');

            // Parse data rows
            const medications: any[] = [];
            const skippedRows: number[] = [];
            
            for (let i = 1; i < lines.length; i++) {
              const values = this.parseCSVLine(lines[i]);
              
              // Validate that name field is present and not empty
              const name = values[nameIndex]?.trim();
              
              // Skip rows that don't have a name
              if (!name) {
                skippedRows.push(i + 1);
                continue;
              }
              
              medications.push({
                name: name,
                genericName: genericNameIndex >= 0 ? (values[genericNameIndex]?.trim() || '') : '',
                prescribingLevel: prescribingLevelIndex >= 0 ? (values[prescribingLevelIndex]?.trim() || '') : '',
                preAuthorizationProtocol: preAuthIndex >= 0 ? (values[preAuthIndex]?.trim() || '') : ''
              });
            }

            if (medications.length === 0) {
              await Dialog.alert('لا توجد بيانات صالحة للاستيراد');
              return;
            }

            // Show warning if some rows were skipped
            let confirmMessage = `هل تريد استيراد ${medications.length} دواء؟\nملاحظة: سيتم إضافة الأدوية الجديدة فقط (لن يتم تحديث الموجود).`;
            if (skippedRows.length > 0) {
              confirmMessage += `\n\nتحذير: تم تجاهل ${skippedRows.length} صف بسبب بيانات غير صالحة أو ناقصة.`;
            }

            const confirmed = await Dialog.confirm(confirmMessage);

            if (!confirmed) return;

            // Import medications one by one
            let successCount = 0;
            let errorCount = 0;
            let duplicateCount = 0;

            for (const medication of medications) {
              try {
                await apiService.createAdminItem('medications', medication);
                successCount++;
              } catch (error: any) {
                // Check if it's a duplicate key error
                if (error?.message?.includes('UNIQUE constraint failed')) {
                  duplicateCount++;
                } else {
                  console.error('Error importing medication:', medication, error);
                  errorCount++;
                }
              }
            }

            // Reload the section to show new data
            await this.loadSection('medications');

            // Build result message
            let resultMessage = `Import completed:\n✓ Successfully imported: ${successCount}`;
            if (duplicateCount > 0) {
              resultMessage += `\n⚠ Skipped (duplicates): ${duplicateCount}`;
            }
            if (errorCount > 0) {
              resultMessage += `\n✗ Failed: ${errorCount}`;
            }

            await Dialog.alert(resultMessage);
          } catch (error) {
            console.error('Error parsing CSV:', error);
            await Dialog.alert('خطأ في قراءة الملف. تأكد من صحة التنسيق.');
          }
        };

        reader.readAsText(file, 'UTF-8');
      };

      fileInput.click();
    } catch (error) {
      console.error('Error importing medications:', error);
      void Dialog.alert('خطأ في استيراد البيانات');
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current);

    return result;
  }
}
