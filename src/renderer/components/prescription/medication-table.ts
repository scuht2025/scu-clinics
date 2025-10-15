import Fuse from 'fuse.js';
import { apiService } from '../../services/ApiService';

const MEDICATION_TEMPLATE_KEY = 'prescription_medications_template';

const setTemplateStorage = (medications: any[]) => {
  try {
    localStorage.setItem(MEDICATION_TEMPLATE_KEY, JSON.stringify(medications));
  } catch (error) {
    console.error('Error saving medications template:', error);
  }
};

const getTemplateStorage = (): any[] => {
  try {
    const raw = localStorage.getItem(MEDICATION_TEMPLATE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading medications template:', error);
    return [];
  }
};

const clearTemplateStorage = () => {
  try {
    localStorage.removeItem(MEDICATION_TEMPLATE_KEY);
  } catch (error) {
    console.error('Error clearing medications template:', error);
  }
};

export class MedicationTableManager {
  private rowCount = 0;
  private medsCatalog: any[] = [];
  private medsFuse: Fuse<any> | null = null;

  async initialize() {
    await this.restoreTemplate();
  }

  async addRow() {
    const tbody = document.getElementById('medicationsBody');
    if (!tbody) return;

    try {
      const [routes, frequencies, durations] = await Promise.all([
        apiService.getAdministrationRoutes(),
        apiService.getFrequencies(),
        apiService.getDurations()
      ]);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input type="text" class="medication-input" placeholder="اسم الدواء والجرعة"></td>
        <td><input type="text" class="medication-input" placeholder="مستوى الوصف" readonly></td>
        <td><input type="text" class="medication-input" placeholder="موافقة مسبقة/بروتوكول" readonly></td>
        <td>
          <select class="medication-select">
            <option value="">اختر</option>
            ${routes.map((route: any) => `<option value="${route.routeName}">${route.routeName}</option>`).join('')}
          </select>
        </td>
        <td><input type="text" class="medication-input" placeholder="الجرعة"></td>
        <td>
          <select class="medication-select">
            <option value="">اختر</option>
            ${frequencies.map((freq: any) => `<option value="${freq.frequencyName}">${freq.frequencyName}</option>`).join('')}
          </select>
        </td>
        <td><input type="text" class="medication-input" placeholder="احتياطات"></td>
        <td>
          <select class="medication-select">
            <option value="">اختر</option>
            ${durations.map((duration: any) => `<option value="${duration.durationName}">${duration.durationName}</option>`).join('')}
          </select>
        </td>
        <td class="no-print">
          <button type="button" class="btn btn-small btn-danger remove-medication-btn" aria-label="حذف الدواء">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
      this.rowCount++;

      this.registerRowListeners(row);

      const medInput = row.querySelector('input.medication-input') as HTMLInputElement | null;
      if (medInput) {
        await this.attachMedicationAutocomplete(medInput);
      }
    } catch (error) {
      console.error('Error adding medication row:', error);
      this.addFallbackRow(tbody);
    }
  }

  async resetTable() {
    const tbody = document.getElementById('medicationsBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    this.rowCount = 0;
    await this.addRow();
  }

  async populateMedications(medications: any[]) {
    if (!medications?.length) return;
    const tbody = document.getElementById('medicationsBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    this.rowCount = 0;

    for (const medication of medications) {
      await this.addRow();
      const rows = tbody.querySelectorAll('tr');
      const lastRow = rows[rows.length - 1];
      if (!lastRow) continue;

      const inputs = lastRow.querySelectorAll('input, select');
      if (inputs.length < 8) continue;

      (inputs[0] as HTMLInputElement).value = medication.drug || '';
      (inputs[1] as HTMLInputElement).value = medication.prescribingLevel || '';
      (inputs[2] as HTMLInputElement).value = medication.preAuthorizationProtocol || '';
      (inputs[3] as HTMLSelectElement).value = medication.route || '';
      (inputs[4] as HTMLInputElement).value = medication.dose || '';
      (inputs[5] as HTMLSelectElement).value = medication.frequency || '';
      (inputs[6] as HTMLInputElement).value = medication.precautions || '';
      (inputs[7] as HTMLSelectElement).value = medication.duration || '';
    }
  }

  collectMedicationData() {
    const tbody = document.getElementById('medicationsBody');
    if (!tbody) return [] as any[];

    const rows = tbody.querySelectorAll('tr');
    const medications: any[] = [];

    rows.forEach(row => {
      const inputs = row.querySelectorAll('input, select');
      if (inputs.length >= 8) {
        const medication = {
          drug: (inputs[0] as HTMLInputElement).value,
          prescribingLevel: (inputs[1] as HTMLInputElement).value,
          preAuthorizationProtocol: (inputs[2] as HTMLInputElement).value,
          route: (inputs[3] as HTMLSelectElement).value,
          dose: (inputs[4] as HTMLInputElement).value,
          frequency: (inputs[5] as HTMLSelectElement).value,
          precautions: (inputs[6] as HTMLInputElement).value,
          duration: (inputs[7] as HTMLSelectElement).value
        };

        if (this.hasMedicationValue(medication)) {
          medications.push(medication);
        }
      }
    });

    return medications;
  }

  private hasMedicationValue(medication: Record<string, string>): boolean {
    return Object.values(medication).some(value => typeof value === 'string' && value.trim().length > 0);
  }

  public persistTemplate(existing?: any[]): void {
    const medications = (existing ?? this.collectMedicationData()).filter(med => this.hasMedicationValue(med));

    if (medications.length > 0) {
      setTemplateStorage(medications);
    } else {
      clearTemplateStorage();
    }
  }

  public async restoreTemplate(): Promise<void> {
    const template = getTemplateStorage();
    if (template.length > 0) {
      await this.populateMedications(template);
    } else {
      await this.resetTable();
    }
  }

  private registerRowListeners(row: HTMLTableRowElement): void {
    const removeBtn = row.querySelector('.remove-medication-btn') as HTMLButtonElement | null;
    if (removeBtn) {
      removeBtn.addEventListener('click', event => {
        event.preventDefault();
        void this.removeRow(row);
      });
    }
  }

  private async removeRow(row: HTMLTableRowElement): Promise<void> {
    if (!row.isConnected) return;

    row.remove();
    this.rowCount = Math.max(0, this.rowCount - 1);

    if (this.rowCount === 0) {
      await this.addRow();
    }

    this.persistTemplate();
  }

  private addFallbackRow(tbody: HTMLElement) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" class="medication-input" placeholder="اسم الدواء والجرعة"></td>
      <td><input type="text" class="medication-input" placeholder="مستوى الوصف" readonly></td>
      <td><input type="text" class="medication-input" placeholder="موافقة مسبقة/بروتوكول" readonly></td>
      <td><select class="medication-select"><option value="">اختر</option></select></td>
      <td><input type="text" class="medication-input" placeholder="الجرعة"></td>
      <td><select class="medication-select"><option value="">اختر</option></select></td>
      <td><input type="text" class="medication-input" placeholder="احتياطات"></td>
      <td><select class="medication-select"><option value="">اختر</option></select></td>
      <td class="no-print">
        <button type="button" class="btn btn-small btn-danger remove-medication-btn" aria-label="حذف الدواء">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
    this.rowCount++;

    this.registerRowListeners(row);

    const medInput = row.querySelector('input.medication-input') as HTMLInputElement | null;
    if (medInput) {
      void this.attachMedicationAutocomplete(medInput);
    }
  }

  private async ensureMedicationsIndex() {
    if (this.medsFuse) return;
    try {
      this.medsCatalog = await apiService.getMedications();
      const options: Fuse.IFuseOptions<any> = {
        includeScore: true,
        shouldSort: true,
        threshold: 0.4, // More lenient for better fuzzy matching
        ignoreLocation: true,
        minMatchCharLength: 1,
        keys: [
          { name: 'genericName', weight: 2 },
          { name: 'name', weight: 1.5 }
        ]
      };
      this.medsFuse = new Fuse(this.medsCatalog, options);
    } catch (error) {
      console.error('Failed to build medications index:', error);
    }
  }

  private async attachMedicationAutocomplete(input: HTMLInputElement) {
    await this.ensureMedicationsIndex();
    if (!this.medsFuse) return;

    let currentIndex = -1;
    let suggestions: any[] = [];

    input.style.direction = 'ltr';
    input.style.textAlign = 'left';

    const box = this.createSuggestionBox(input);
    box.style.direction = 'ltr';
    box.style.textAlign = 'left';

    const select = (idx: number) => {
      if (idx < 0 || idx >= suggestions.length) return;
      const chosen = suggestions[idx];
      input.value = chosen.genericName || chosen.name || '';
      input.setAttribute('data-generic-name', chosen.genericName || chosen.name || '');
      const row = input.closest('tr');
      if (row) {
        const cells = row.querySelectorAll('input, select');
        if (cells.length >= 8) {
          (cells[1] as HTMLInputElement).value = chosen.prescribingLevel || '';
          (cells[2] as HTMLInputElement).value = chosen.preAuthorizationProtocol || '';
        }
      }
      this.hideSuggestions(box);
      const next = row?.querySelectorAll('input, select')[4] as HTMLElement | undefined;
      next?.focus();
    };

    const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    // Enhanced highlighting function that highlights matching characters
    const highlightMatches = (text: string, searchTerm: string): string => {
      if (!searchTerm || !text) return esc(text);

      const searchLower = searchTerm.toLowerCase();
      const textLower = text.toLowerCase();

      // Find all character matches regardless of order
      let highlighted = '';
      let lastIndex = 0;

      // For each character in the search term, find matches in the text
      for (let i = 0; i < searchTerm.length; i++) {
        const char = searchLower[i];
        const charIndex = textLower.indexOf(char, lastIndex);

        if (charIndex !== -1) {
          // Add non-matching part
          if (charIndex > lastIndex) {
            highlighted += esc(text.substring(lastIndex, charIndex));
          }
          // Add highlighted matching character
          highlighted += `<mark class="search-highlight">${esc(text.substring(charIndex, charIndex + 1))}</mark>`;
          lastIndex = charIndex + 1;
        }
      }

      // Add remaining text
      if (lastIndex < text.length) {
        highlighted += esc(text.substring(lastIndex));
      }

      return highlighted || esc(text);
    };

    const render = (items: any[], searchTerm: string) => {
      box.innerHTML = '';
      items.forEach((item, idx) => {
        const el = document.createElement('div');

        el.style.fontSize = '16px';
        el.style.padding = '6px 8px';
        el.style.cursor = 'pointer';
        el.style.whiteSpace = 'wrap';
        el.style.overflow = 'hidden';
        el.style.textOverflow = 'ellipsis';
        el.style.direction = 'ltr';
        el.style.textAlign = 'left';
        el.dataset.index = String(idx);

        // Make odd divs have a light gray background color
        if (idx % 2 === 1) {
          el.style.backgroundColor = '#e2e8f0'; // Tailwind's gray-100
        }

        // Show Generic (Trade) and highlight trade with a soft teal chip
        const generic = (item.genericName || '').trim();
        const trade = (item.name || '').trim();

        if (generic && trade && generic.toLowerCase() !== trade.toLowerCase()) {
          const highlightedGeneric = highlightMatches(generic, searchTerm);
          const highlightedTrade = highlightMatches(trade, searchTerm);
          el.innerHTML = `${highlightedGeneric} <span class="med-suggest-trade">(${highlightedTrade})</span>`;
        } else {
          const displayText = generic || trade;
          el.innerHTML = highlightMatches(displayText, searchTerm);
        }

        el.addEventListener('mousedown', e => {
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
        render(suggestions, q);
        return;
      }
      const results = this.medsFuse!.search(q, { limit: 20});
      suggestions = results.map(r => r.item);
      currentIndex = -1;
      render(suggestions, q);
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
        this.highlightSuggestion(box, currentIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentIndex = currentIndex > 0 ? currentIndex - 1 : max;
        this.highlightSuggestion(box, currentIndex);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentIndex >= 0) select(currentIndex);
      } else if (e.key === 'Escape') {
        this.hideSuggestions(box);
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => this.hideSuggestions(box), 150);
    });
  }

  private createSuggestionBox(input: HTMLInputElement) {
    const box = document.createElement('div');
    box.style.position = 'fixed';
    box.style.overflowY = 'auto';
    box.style.overflowX = 'hidden';
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
      const desiredWidth = Math.min(maxAllowedWidth, Math.max(r.width, 240));
      const isRTL = (document.documentElement.getAttribute('dir') || document.body.getAttribute('dir') || 'rtl').toLowerCase() === 'rtl';
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
      const maxHeight = Math.max(80, Math.min(220, placeBelow ? spaceBelow : spaceAbove));
      const top = placeBelow ? Math.min(r.bottom, viewportH - margin) : Math.max(margin, r.top - maxHeight);

      box.style.left = `${Math.round(left)}px`;
      box.style.top = `${Math.round(top)}px`;
      box.style.minWidth = `${Math.round(desiredWidth)}px`;
      box.style.maxHeight = `${Math.round(maxHeight)}px`;
    };

    (box as any).__reposition = reposition;

    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    input.addEventListener('focus', reposition);
    reposition();

    return box;
  }

  private hideSuggestions(box: HTMLElement) {
    box.style.display = 'none';
  }

  private highlightSuggestion(box: HTMLElement, index: number) {
    const children = Array.from(box.children) as HTMLElement[];
    children.forEach((el, i) => {
      el.style.background = i === index ? '#f0f6ff' : '#fff';
    });
  }
}
