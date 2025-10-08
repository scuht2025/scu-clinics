/**
 * API service for communicating with main process
 */

export class ApiService {
  private static instance: ApiService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Generic API call method
  private async callApi<T>(method: string, ...args: any[]): Promise<T> {
    try {
      if (!(window as any).electronAPI) {
        throw new Error('Electron API not available');
      }

      const result = await (window as any).electronAPI[method](...args);
      return result;
    } catch (error: any) {
      // Don't log UNIQUE constraint errors (expected during bulk imports with duplicates)
      const isUniqueConstraintError = error?.message?.includes('UNIQUE constraint failed');
      if (!isUniqueConstraintError) {
        console.error(`API call failed for ${method}:`, error);
      }
      throw error;
    }
  }

  // Prescription methods
  async createPrescription(prescription: any): Promise<any> {
    return this.callApi('createPrescription', prescription);
  }

  async getPrescriptions(): Promise<any[]> {
    return this.callApi('getPrescriptions');
  }

  async getPrescription(id: number): Promise<any> {
    return this.callApi('getPrescription', id);
  }

  async updatePrescription(id: number, prescription: any): Promise<any> {
    return this.callApi('updatePrescription', id, prescription);
  }

  async deletePrescription(id: number): Promise<any> {
    return this.callApi('deletePrescription', id);
  }

  async searchPrescriptions(searchTerm: string): Promise<any[]> {
    return this.callApi('searchPrescriptions', searchTerm);
  }

  // Dynamic data methods with caching
  async getDoctorsList(): Promise<any[]> {
    return this.getCachedData('doctors-list', () => this.callApi('getDoctorsList'));
  }

  async getClinics(): Promise<any[]> {
    return this.getCachedData('clinics', () => this.callApi('getClinics'));
  }

  async getMedicationLevels(): Promise<any[]> {
    return this.getCachedData('medication-levels', () => this.callApi('getMedicationLevels'));
  }

  async getAdministrationRoutes(): Promise<any[]> {
    return this.getCachedData('administration-routes', () => this.callApi('getAdministrationRoutes'));
  }

  async getFrequencies(): Promise<any[]> {
    return this.getCachedData('frequencies', () => this.callApi('getFrequencies'));
  }

  async getDurations(): Promise<any[]> {
    return this.getCachedData('durations', () => this.callApi('getDurations'));
  }

  async getMedications(): Promise<any[]> {
    return this.getCachedData('medications', () => this.callApi('getMedications'));
  }

  async getPharmacies(): Promise<any[]> {
    return this.getCachedData('pharmacies', () => this.callApi('getPharmacies'));
  }

  async getProcedureCodes(): Promise<any[]> {
    return this.getCachedData('procedure-codes', () => this.callApi('getProcedureCodes'));
  }

  async searchProcedureCodes(searchTerm: string): Promise<any[]> {
    return this.callApi('searchProcedureCodes', searchTerm);
  }

  // Reports methods
  async createReport(report: any): Promise<any> {
    return this.callApi('createReport', report);
  }

  async getReports(): Promise<any[]> {
    return this.callApi('getReports');
  }

  async getReport(id: number): Promise<any> {
    return this.callApi('getReport', id);
  }

  async updateReport(id: number, report: any): Promise<any> {
    return this.callApi('updateReport', id, report);
  }

  async deleteReport(id: number): Promise<any> {
    return this.callApi('deleteReport', id);
  }

  async searchReports(searchTerm: string): Promise<any[]> {
    return this.callApi('searchReports', searchTerm);
  }

  // Admin CRUD methods
  async createAdminItem(section: string, data: any): Promise<any> {
    this.clearSectionCache(section);
    return this.callApi('createAdminItem', section, data);
  }

  async getAdminItem(section: string, id: number): Promise<any> {
    return this.callApi('getAdminItem', section, id);
  }

  async updateAdminItem(section: string, id: number, data: any): Promise<any> {
    this.clearSectionCache(section);
    return this.callApi('updateAdminItem', section, id, data);
  }

  async deleteAdminItem(section: string, id: number): Promise<any> {
    this.clearSectionCache(section);
    return this.callApi('deleteAdminItem', section, id);
  }

  // Database management methods
  async getDatabasePath(): Promise<string> {
    return this.callApi('getDatabasePath');
  }

  async selectDatabasePath(): Promise<string | null> {
    return this.callApi('selectDatabasePath');
  }

  async resetDatabasePath(): Promise<void> {
    return this.callApi('resetDatabasePath');
  }

  async createDatabaseBackup(): Promise<string | null> {
    return this.callApi('createDatabaseBackup');
  }

  async getDatabaseInfo(): Promise<any> {
    return this.callApi('getDatabaseInfo');
  }

  // Print methods
  async printWithPreview(): Promise<void> {
    return this.callApi('printWithPreview');
  }

  // Hospital configuration
  async getHospitalConfig(): Promise<{ id?: number; name?: string; address?: string; phone?: string; logo?: string | null }> {
    return this.getCachedData('hospital-config', () => this.callApi('getHospitalConfig'));
  }

  async saveHospitalConfig(data: { name?: string; address?: string; phone?: string; logo?: string | null }): Promise<any> {
    // Invalidate cache before saving
    this.clearCache('hospital-config');
    return this.callApi('saveHospitalConfig', data);
  }

  // Cache management
  private async getCachedData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: now });
    return data;
  }

  private clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Clear cache for specific section
  public clearSectionCache(section: string): void {
    // Map section names to their corresponding cache keys
    const cacheKeyMap: { [key: string]: string } = {
      'doctors': 'doctors-list',
      'clinics': 'clinics',
      'medication-levels': 'medication-levels',
      'routes': 'administration-routes',
      'frequencies': 'frequencies',
      'durations': 'durations',
      'medications': 'medications',
      'pharmacies': 'pharmacies',
      'procedure-codes': 'procedure-codes'
    };
    
    const cacheKey = cacheKeyMap[section];
    if (cacheKey) {
      this.clearCache(cacheKey);
    }
  }

  // Clear all cache
  public clearAllCache(): void {
    this.clearCache();
  }
}

export const apiService = ApiService.getInstance();
