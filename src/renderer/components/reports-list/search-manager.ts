/**
 * Search functionality for reports list
 * Handles Fuse.js integration and search operations
 */

import Fuse from 'fuse.js';

export interface SearchableReport {
  id: number;
  patientName: string;
  patientId: string;
  age?: string;
  socialNumber?: string;
  gender?: string;
  doctorName: string;
  doctorDegree?: string;
  consultation?: string;
  reportDate?: string;
  reportTime?: string;
  content?: string;
  contentText?: string;
}

export class ReportsSearchManager {
  private fuse: Fuse<SearchableReport> | null = null;

  buildSearchIndex(reports: SearchableReport[]): void {
    // Prepare a flattened text field that includes report content
    const prepared = reports.map(r => ({
      ...r,
      contentText: this.extractContentText(r)
    }));

    const options: Fuse.IFuseOptions<SearchableReport> = {
      includeScore: true,
      threshold: 0.35, // fuzzy strictness; lower is stricter
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: 'patientName', weight: 2 },
        { name: 'patientId', weight: 1.5 },
        { name: 'doctorName', weight: 1.5 },
        { name: 'contentText', weight: 2 }
      ]
    };

    this.fuse = new Fuse(prepared, options);
  }

  search(searchTerm: string): SearchableReport[] {
    if (!this.fuse || !searchTerm.trim()) {
      return [];
    }

    const results = this.fuse.search(searchTerm);
    return results.map(r => r.item);
  }

  isReady(): boolean {
    return this.fuse !== null;
  }

  private extractContentText(report: SearchableReport): string {
    if (!report.content) return '';
    
    // Strip HTML tags and get clean text
    const tmp = document.createElement('div');
    tmp.innerHTML = report.content;
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  }
}
