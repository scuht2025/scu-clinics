/**
 * Dialog component for alerts and confirmations (non-native)
 */


export type DialogOptions = {
  title?: string;
  okText?: string;
  cancelText?: string;
};

export class Dialog {
  // Simple, local focus trap per dialog instance
  private static prevActiveElement: HTMLElement | null = null;

  static async alert(message: string, options: DialogOptions = {}): Promise<void> {
    const { title = 'تنبيه', okText = 'حسناً' } = options;
    await new Promise<void>((resolve) => {
      const { overlay, content, cleanup } = this.createBase(title, message);

      // Footer buttons
      const footer = document.createElement('div');
      footer.className = 'modal-footer';

      const okBtn = document.createElement('button');
      okBtn.className = 'btn btn-primary';
      okBtn.textContent = okText;
      okBtn.addEventListener('click', () => {
        this.close(cleanup);
        resolve();
      });

      footer.appendChild(okBtn);
      content.appendChild(footer);

      // Keyboard handlers
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          okBtn.click();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          okBtn.click();
        }
      };
      overlay.addEventListener('keydown', onKeyDown);

      this.open(overlay, okBtn);
    });
  }

  static async confirm(message: string, options: DialogOptions = {}): Promise<boolean> {
    const { title = 'تأكيد', okText = 'نعم', cancelText = 'إلغاء' } = options;
    return await new Promise<boolean>((resolve) => {
      const { overlay, content, cleanup } = this.createBase(title, message);

      const footer = document.createElement('div');
      footer.className = 'modal-footer';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn';
      cancelBtn.textContent = cancelText;
      cancelBtn.addEventListener('click', () => {
        this.close(cleanup);
        resolve(false);
      });

      const okBtn = document.createElement('button');
      okBtn.className = 'btn btn-primary';
      okBtn.textContent = okText;
      okBtn.addEventListener('click', () => {
        this.close(cleanup);
        resolve(true);
      });

      footer.appendChild(cancelBtn);
      footer.appendChild(okBtn);
      content.appendChild(footer);

      // Keyboard handlers
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          okBtn.click();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelBtn.click();
        }
      };
      overlay.addEventListener('keydown', onKeyDown);

      this.open(overlay, okBtn);
    });
  }

  // Create base modal structure
  private static createBase(title: string, message: string) {
    const overlay = document.createElement('div');
    overlay.className = 'modal';
    overlay.style.display = 'flex';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.maxWidth = '480px';

    const header = document.createElement('div');
    header.className = 'modal-header';

    const titleEl = document.createElement('h4');
    titleEl.textContent = title;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.setAttribute('aria-label', 'إغلاق');
    closeBtn.innerHTML = '&times;';

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'modal-body';
    const p = document.createElement('p');
    p.textContent = message;
    body.appendChild(p);

    content.appendChild(header);
    content.appendChild(body);
    overlay.appendChild(content);

    const previousOverflow = document.body.style.overflow;

    const cleanup = () => {
      document.body.style.overflow = previousOverflow;
      if (overlay.parentElement) {
        overlay.parentElement.removeChild(overlay);
      }
      // Restore previous focus if still in document
      const toRestore = this.prevActiveElement;
      this.prevActiveElement = null;
      if (toRestore && document.contains(toRestore)) {
        try { toRestore.focus(); } catch {}
      }
    };

    // Close on close button
    closeBtn.addEventListener('click', () => {
      this.close(cleanup);
    });

    // Prevent clicks on overlay from closing to avoid accidental dismiss
    overlay.addEventListener('mousedown', (e) => {
      // If click is outside the content, just keep focus inside
      if (!content.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    return { overlay, content, cleanup };
  }

  private static open(overlay: HTMLElement, initialFocusEl?: HTMLElement) {
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Record previously focused element
    this.prevActiveElement = (document.activeElement as HTMLElement) || null;

    // Trap focus within overlay
    const getFocusable = () => {
      const selectors = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(',');
      return Array.from(overlay.querySelectorAll(selectors)) as HTMLElement[];
    };

    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable().filter(el => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !overlay.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !overlay.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    overlay.addEventListener('keydown', keydownHandler);

    // Set initial focus
    setTimeout(() => {
      const target = initialFocusEl || getFocusable()[0];
      if (target) {
        try {
          target.focus();
          (target as HTMLInputElement).select?.();
        } catch {}
      }
    }, 0);
  }

  private static close(cleanup: () => void) {
    // Close with a tiny delay to allow any pending focus events to settle
    setTimeout(() => cleanup(), 0);
  }
}
