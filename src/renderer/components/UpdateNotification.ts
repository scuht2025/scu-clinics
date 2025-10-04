/**
 * Update Notification component for auto-updater
 */

export class UpdateNotification {
  private container: HTMLElement | null = null;
  private downloadProgress: number = 0;

  constructor() {
    this.setupUpdateListeners();
  }

  private setupUpdateListeners(): void {
    // Listen for update available
    window.electronAPI.onUpdateAvailable((info: any) => {
      this.showUpdateAvailable(info);
    });

    // Listen for download progress
    window.electronAPI.onDownloadProgress((progress: any) => {
      this.updateDownloadProgress(progress);
    });

    // Listen for update downloaded
    window.electronAPI.onUpdateDownloaded((info: any) => {
      this.showUpdateReady(info);
    });

    // Listen for update errors
    window.electronAPI.onUpdateError((message: string) => {
      this.showUpdateError(message);
    });
  }

  private showUpdateAvailable(info: any): void {
    this.removeExisting();

    this.container = document.createElement('div');
    this.container.className = 'update-notification update-available';
    this.container.innerHTML = `
      <div class="update-content">
        <div class="update-icon">🔄</div>
        <div class="update-message">
          <h3>تحديث متاح</h3>
          <p>إصدار جديد ${info.version} متاح للتحميل</p>
        </div>
        <div class="update-actions">
          <button class="btn-primary" id="download-update">تحميل التحديث</button>
          <button class="btn-secondary" id="dismiss-update">لاحقاً</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    const downloadBtn = document.getElementById('download-update');
    const dismissBtn = document.getElementById('dismiss-update');

    downloadBtn?.addEventListener('click', () => {
      this.startDownload();
    });

    dismissBtn?.addEventListener('click', () => {
      this.removeExisting();
    });
  }

  private startDownload(): void {
    window.electronAPI.downloadUpdate();
    
    if (this.container) {
      this.container.className = 'update-notification update-downloading';
      this.container.innerHTML = `
        <div class="update-content">
          <div class="update-icon">⬇️</div>
          <div class="update-message">
            <h3>جاري تحميل التحديث...</h3>
            <div class="progress-bar">
              <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
            </div>
            <p class="progress-text" id="progress-text">0%</p>
          </div>
        </div>
      `;
    }
  }

  private updateDownloadProgress(progress: any): void {
    this.downloadProgress = Math.round(progress.percent);
    
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    if (progressFill) {
      progressFill.style.width = `${this.downloadProgress}%`;
    }

    if (progressText) {
      progressText.textContent = `${this.downloadProgress}%`;
    }
  }

  private showUpdateReady(info: any): void {
    this.removeExisting();

    this.container = document.createElement('div');
    this.container.className = 'update-notification update-ready';
    this.container.innerHTML = `
      <div class="update-content">
        <div class="update-icon">✅</div>
        <div class="update-message">
          <h3>التحديث جاهز للتثبيت</h3>
          <p>إصدار ${info.version} جاهز. سيتم التثبيت عند إعادة تشغيل التطبيق</p>
        </div>
        <div class="update-actions">
          <button class="btn-primary" id="restart-now">إعادة تشغيل الآن</button>
          <button class="btn-secondary" id="restart-later">لاحقاً</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    const restartBtn = document.getElementById('restart-now');
    const laterBtn = document.getElementById('restart-later');

    restartBtn?.addEventListener('click', () => {
      window.electronAPI.quitAndInstall();
    });

    laterBtn?.addEventListener('click', () => {
      this.removeExisting();
    });
  }

  private showUpdateError(message: string): void {
    this.removeExisting();

    this.container = document.createElement('div');
    this.container.className = 'update-notification update-error';
    this.container.innerHTML = `
      <div class="update-content">
        <div class="update-icon">❌</div>
        <div class="update-message">
          <h3>خطأ في التحديث</h3>
          <p>${message}</p>
        </div>
        <div class="update-actions">
          <button class="btn-secondary" id="dismiss-error">إغلاق</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    const dismissBtn = document.getElementById('dismiss-error');
    dismissBtn?.addEventListener('click', () => {
      this.removeExisting();
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      this.removeExisting();
    }, 5000);
  }

  private removeExisting(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  public destroy(): void {
    this.removeExisting();
    window.electronAPI.removeUpdateListeners();
  }
}
