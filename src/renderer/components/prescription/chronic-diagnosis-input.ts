import Fuse from 'fuse.js';
import { apiService } from '../../services/ApiService';

interface DiagnosisItem {
  id?: number;
  diagnosis_code?: string;
  ar_name: string;
  en_name: string;
  category?: string;
}

export class ChronicDiagnosisAutocomplete {
  private static fuse: Fuse<DiagnosisItem> | null = null;
  private static data: DiagnosisItem[] = [];

  private static async ensureIndex() {
    if (this.fuse) return;
    try {
      this.data = await apiService.getDiagnoses();
      const options: Fuse.IFuseOptions<DiagnosisItem> = {
        includeScore: true,
        shouldSort: true,
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 1,
        keys: [
          { name: 'ar_name', weight: 2 },
          { name: 'en_name', weight: 1.5 },
          { name: 'diagnosis_code', weight: 1.2 },
          { name: 'category', weight: 0.5 }
        ]
      };
      this.fuse = new Fuse(this.data, options);
    } catch (e) {
      console.error('Failed to build diagnoses index:', e);
    }
  }

  public static async attachToInputById(inputId: string): Promise<void> {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input) return;
    await this.attach(input);
  }

  public static async attach(input: HTMLInputElement): Promise<void> {
    await this.ensureIndex();
    if (!this.fuse) return;

    // Input direction should remain RTL for Arabic UX
    input.style.direction = 'rtl';
    input.style.textAlign = 'right';

    const box = this.createSuggestionBox(input);

    let suggestions: DiagnosisItem[] = [];
    let currentIndex = -1;

    const select = (idx: number) => {
      if (idx < 0 || idx >= suggestions.length) return;
      const chosen = suggestions[idx];
      input.value = chosen.ar_name || '';
      input.setAttribute('data-dx-code', chosen.diagnosis_code || '');
      input.setAttribute('data-dx-en', chosen.en_name || '');
      this.hide(box);
      input.dispatchEvent(new Event('change'));
    };

    const esc = (s: string) => (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const render = (items: DiagnosisItem[]) => {
      box.innerHTML = '';
      items.forEach((item, idx) => {
        const el = document.createElement('div');
        el.style.fontSize = '16px';
        el.style.padding = '8px 10px';
        el.style.cursor = 'pointer';
        el.style.whiteSpace = 'wrap';
        el.style.overflow = 'hidden';
        el.style.textOverflow = 'ellipsis';
        el.dataset.index = String(idx);

        if (idx % 2 === 1) el.style.backgroundColor = '#f7fafc';

        const ar = esc(item.ar_name || '');
        const en = esc(item.en_name || '');
        const code = esc(item.diagnosis_code || '');
        const cat = esc(item.category || '');
        const codeChip = code ? `<span style="background:#e6fffa;color:#0b7285;border:1px solid #99e9f2;border-radius:10px;padding:1px 6px;margin-inline-start:8px;font-size:12px;">${code}</span>` : '';
        const catChip = cat ? `<span style="background:#fff3bf;color:#8a6d3b;border:1px solid #ffe08a;border-radius:10px;padding:1px 6px;margin-inline-start:6px;font-size:12px;">${cat}</span>` : '';
        el.innerHTML = `<div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
            <div style="flex:1; text-align:right;">${ar}</div>
            <div style="flex:1; text-align:left; color:#555; direction:ltr;">${en}</div>
            <div style="flex:0; white-space:nowrap;">${codeChip}${catChip}</div>
          </div>`;
        el.addEventListener('mousedown', (e) => {
          e.preventDefault();
          select(idx);
        });
        box.appendChild(el);
      });
      box.style.display = items.length ? 'block' : 'none';
      (box as any).__reposition?.();
    };

    const update = () => {
      const q = input.value.trim();
      if (!q) {
        suggestions = [];
        render(suggestions);
        return;
      }
      const results = this.fuse!.search(q, { limit: 20 });
      suggestions = results.map(r => r.item);
      currentIndex = -1;
      render(suggestions);
    };

    let debounce: number | undefined;
    input.addEventListener('input', () => {
      if (debounce) window.clearTimeout(debounce);
      debounce = window.setTimeout(update, 120);
    });

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (box.style.display === 'none') return;
      const max = suggestions.length - 1;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentIndex = currentIndex < max ? currentIndex + 1 : 0;
        this.highlight(box, currentIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentIndex = currentIndex > 0 ? currentIndex - 1 : max;
        this.highlight(box, currentIndex);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentIndex >= 0) select(currentIndex);
      } else if (e.key === 'Escape') {
        this.hide(box);
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => this.hide(box), 150);
    });
  }

  private static createSuggestionBox(input: HTMLInputElement) {
    const box = document.createElement('div');
    box.style.position = 'fixed';
    box.style.overflowY = 'auto';
    box.style.background = '#fff';
    box.style.border = '1px solid #ccc';
    box.style.borderRadius = '4px';
    box.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    box.style.zIndex = '9999';
    box.style.display = 'none';
    document.body.appendChild(box);

    const reposition = () => {
      const r = input.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const margin = 8;
      const maxAllowedWidth = viewportW - margin * 2;
      const desiredWidth = Math.min(maxAllowedWidth, Math.max(r.width, 320));

      // RTL friendly positioning: align right edge with input's right edge when possible
      const isRTL = true;
      let left: number;
      if (isRTL) {
        const proposedLeft = r.right - desiredWidth;
        left = Math.min(Math.max(proposedLeft, margin), Math.max(margin, viewportW - desiredWidth - margin));
      } else {
        left = Math.min(Math.max(r.left, margin), Math.max(margin, viewportW - desiredWidth - margin));
      }

      const spaceBelow = viewportH - r.bottom - margin;
      const spaceAbove = r.top - margin;
      const placeBelow = spaceBelow >= 160 || spaceBelow >= spaceAbove;
      const maxHeight = Math.max(120, Math.min(280, placeBelow ? spaceBelow : spaceAbove));
      const top = placeBelow ? Math.min(r.bottom, viewportH - margin) : Math.max(margin, r.top - maxHeight);

      box.style.left = `${Math.round(left)}px`;
      box.style.top = `${Math.round(top)}px`;
      box.style.minWidth = `${Math.round(desiredWidth)}px`;
      box.style.maxHeight = `${Math.round(maxHeight)}px`;
      box.style.direction = 'rtl';
      box.style.textAlign = 'right';
    };

    (box as any).__reposition = reposition;
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    input.addEventListener('focus', reposition);
    reposition();
    return box;
  }

  private static hide(box: HTMLElement) {
    box.style.display = 'none';
  }

  private static highlight(box: HTMLElement, index: number) {
    const children = Array.from(box.children) as HTMLElement[];
    children.forEach((el, i) => {
      el.style.background = i === index ? '#f0f6ff' : '#fff';
    });
  }
}
