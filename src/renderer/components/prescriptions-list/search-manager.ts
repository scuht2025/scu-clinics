/**
 * Search functionality for prescriptions list
 * Handles Fuse.js integration and search operations
 */

import Fuse from 'fuse.js';

export interface SearchablePrescription {
  id: number;
  patientName: string;
  patientId: string;
  diagnoses?: string;
  chronicDiagnosis?: string;
  doctorName: string;
  doctorDegree?: string;
  consultation: string;
  medications?: string;
  medicationsText?: string;
}

export class PrescriptionsSearchManager {
  private fuse: Fuse<SearchablePrescription> | null = null;

  buildSearchIndex(prescriptions: SearchablePrescription[]): void {
    // Prepare a flattened text field that includes medication names and their generic names
    const prepared = prescriptions.map(p => ({
      ...p,
      medicationsText: this.extractMedicationsText(p)
    }));

    const options: Fuse.IFuseOptions<SearchablePrescription> = {
      includeScore: true,
      threshold: 0.35, // fuzzy strictness; lower is stricter
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: 'patientName', weight: 2 },
        { name: 'patientId', weight: 1.5 },
        { name: 'diagnoses', weight: 1.5 },
        { name: 'chronicDiagnosis', weight: 1.2 },
        { name: 'doctorName', weight: 1.5 },
        { name: 'consultation', weight: 1 },
        { name: 'medicationsText', weight: 2 }
      ]
    };

    this.fuse = new Fuse(prepared, options);
  }

  search(searchTerm: string): SearchablePrescription[] {
    if (!this.fuse || !searchTerm.trim()) {
      return [];
    }

    const results = this.fuse.search(searchTerm);
    return results.map(r => r.item);
  }

  isReady(): boolean {
    return this.fuse !== null;
  }

  private extractMedicationsText(prescription: SearchablePrescription): string {
    try {
      const meds = JSON.parse(prescription.medications || '[]');
      if (!Array.isArray(meds)) return '';
      return meds
        .map((m: any) => [m?.drug || '', m?.genericName || ''].filter(Boolean).join(' '))
        .join(' ')
        .trim();
    } catch {
      return '';
    }
  }
}
