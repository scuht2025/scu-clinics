/**
 * State management utility
 */

export class StateManager {
  private state: Map<string, any> = new Map();
  private listeners: Map<string, Function[]> = new Map();

  setState(key: string, value: any): void {
    const oldValue = this.state.get(key);
    this.state.set(key, value);
    
    // Notify listeners if value changed
    if (oldValue !== value) {
      this.notifyListeners(key, value, oldValue);
    }
  }

  getState(key: string): any {
    return this.state.get(key);
  }

  hasState(key: string): boolean {
    return this.state.has(key);
  }

  removeState(key: string): void {
    this.state.delete(key);
  }

  subscribe(key: string, callback: (newValue: any, oldValue: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private notifyListeners(key: string, newValue: any, oldValue: any): void {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`Error in state listener for ${key}:`, error);
        }
      });
    }
  }

  // Prescription-specific state management
  setPrescriptionData(data: any): void {
    this.setState('prescription', data);
  }

  getPrescriptionData(): any {
    return this.getState('prescription');
  }

  setCurrentPrescriptionId(id: number): void {
    this.setState('currentPrescriptionId', id);
  }

  getCurrentPrescriptionId(): number | null {
    return this.getState('currentPrescriptionId');
  }

  clearPrescriptionData(): void {
    this.removeState('prescription');
    this.removeState('currentPrescriptionId');
  }

  // Report-specific state management
  setReportData(data: any): void {
    this.setState('report', data);
  }

  getReportData(): any {
    return this.getState('report');
  }

  setCurrentReportId(id: number): void {
    this.setState('currentReportId', id);
  }

  getCurrentReportId(): number | null {
    return this.getState('currentReportId');
  }

  clearReportData(): void {
    this.removeState('report');
    this.removeState('currentReportId');
  }

  // Admin data caching
  setAdminData(section: string, data: any[]): void {
    this.setState(`admin:${section}`, data);
  }

  getAdminData(section: string): any[] {
    return this.getState(`admin:${section}`) || [];
  }

  clearAdminData(section?: string): void {
    if (section) {
      this.removeState(`admin:${section}`);
    } else {
      // Clear all admin data
      for (const key of this.state.keys()) {
        if (key.startsWith('admin:')) {
          this.removeState(key);
        }
      }
    }
  }
}
