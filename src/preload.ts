// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import {
  Patient,
  Doctor,
  Appointment,
  Prescription,
  DoctorsList,
  Clinic,
  MedicationLevel,
  AdministrationRoute,
  Frequency,
  Duration,
  Medication,
  Pharmacy
} from './database';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Patient operations
  createPatient: (patient: Omit<Patient, 'id'>) =>
    ipcRenderer.invoke('create-patient', patient),
  getPatients: () =>
    ipcRenderer.invoke('get-patients'),
  getPatient: (id: number) =>
    ipcRenderer.invoke('get-patient', id),
  updatePatient: (id: number, patient: Partial<Patient>) =>
    ipcRenderer.invoke('update-patient', id, patient),
  deletePatient: (id: number) =>
    ipcRenderer.invoke('delete-patient', id),

  // Doctor operations
  createDoctor: (doctor: Omit<Doctor, 'id'>) =>
    ipcRenderer.invoke('create-doctor', doctor),
  getDoctors: () =>
    ipcRenderer.invoke('get-doctors'),
  getDoctor: (id: number) =>
    ipcRenderer.invoke('get-doctor', id),
  updateDoctor: (id: number, doctor: Partial<Doctor>) =>
    ipcRenderer.invoke('update-doctor', id, doctor),
  deleteDoctor: (id: number) =>
    ipcRenderer.invoke('delete-doctor', id),

  // Appointment operations
  createAppointment: (appointment: Omit<Appointment, 'id'>) =>
    ipcRenderer.invoke('create-appointment', appointment),
  getAppointments: () =>
    ipcRenderer.invoke('get-appointments'),
  getAppointment: (id: number) =>
    ipcRenderer.invoke('get-appointment', id),
  updateAppointment: (id: number, appointment: Partial<Appointment>) =>
    ipcRenderer.invoke('update-appointment', id, appointment),
  deleteAppointment: (id: number) =>
    ipcRenderer.invoke('delete-appointment', id),

  // Prescription operations
  createPrescription: (prescription: Omit<Prescription, 'id'>) =>
    ipcRenderer.invoke('create-prescription', prescription),
  getPrescriptions: () =>
    ipcRenderer.invoke('get-prescriptions'),
  getPrescription: (id: number) =>
    ipcRenderer.invoke('get-prescription', id),
  updatePrescription: (id: number, prescription: Partial<Prescription>) =>
    ipcRenderer.invoke('update-prescription', id, prescription),
  deletePrescription: (id: number) =>
    ipcRenderer.invoke('delete-prescription', id),
  searchPrescriptions: (searchTerm: string) =>
    ipcRenderer.invoke('search-prescriptions', searchTerm),

  // Print with preview
  printWithPreview: () =>
    ipcRenderer.invoke('print-with-preview'),

  // Dynamic data operations
  getDoctorsList: () =>
    ipcRenderer.invoke('get-doctors-list'),
  getClinics: () =>
    ipcRenderer.invoke('get-clinics'),
  getMedicationLevels: () =>
    ipcRenderer.invoke('get-medication-levels'),
  getAdministrationRoutes: () =>
    ipcRenderer.invoke('get-administration-routes'),
  getFrequencies: () =>
    ipcRenderer.invoke('get-frequencies'),
  getDurations: () =>
    ipcRenderer.invoke('get-durations'),
  getMedications: () =>
    ipcRenderer.invoke('get-medications'),
  getPharmacies: () =>
    ipcRenderer.invoke('get-pharmacies'),

  // Procedure codes operations
  getProcedureCodes: () =>
    ipcRenderer.invoke('get-procedure-codes'),
  searchProcedureCodes: (searchTerm: string) =>
    ipcRenderer.invoke('search-procedure-codes', searchTerm),

  // Reports operations
  createReport: (report: any) =>
    ipcRenderer.invoke('create-report', report),
  getReports: () =>
    ipcRenderer.invoke('get-reports'),
  getReport: (id: number) =>
    ipcRenderer.invoke('get-report', id),
  updateReport: (id: number, report: any) =>
    ipcRenderer.invoke('update-report', id, report),
  deleteReport: (id: number) =>
    ipcRenderer.invoke('delete-report', id),

  // Admin CRUD operations
  createAdminItem: (section: string, data: any) =>
    ipcRenderer.invoke('create-admin-item', section, data),
  getAdminItem: (section: string, id: number) =>
    ipcRenderer.invoke('get-admin-item', section, id),
  updateAdminItem: (section: string, id: number, data: any) =>
    ipcRenderer.invoke('update-admin-item', section, id, data),
  deleteAdminItem: (section: string, id: number) =>
    ipcRenderer.invoke('delete-admin-item', section, id),

  // Database path operations
  getDatabasePath: () =>
    ipcRenderer.invoke('get-database-path'),
  selectDatabasePath: () =>
    ipcRenderer.invoke('select-database-path'),
  resetDatabasePath: () =>
    ipcRenderer.invoke('reset-database-path'),
  createDatabaseBackup: () =>
    ipcRenderer.invoke('create-database-backup'),
  getDatabaseInfo: () =>
    ipcRenderer.invoke('get-database-info'),

  // Hospital configuration
  getHospitalConfig: () =>
    ipcRenderer.invoke('get-hospital-config'),
  saveHospitalConfig: (data: { name?: string; address?: string; phone?: string }) =>
    ipcRenderer.invoke('save-hospital-config', data),

  // Focus management
  onWindowFocus: (callback: () => void) =>
    ipcRenderer.on('window-focused', callback),
  onWindowBlur: (callback: () => void) =>
    ipcRenderer.on('window-blurred', callback),
  removeWindowFocusListeners: () => {
    ipcRenderer.removeAllListeners('window-focused');
    ipcRenderer.removeAllListeners('window-blurred');
  },

  // Auto-updater APIs
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  onUpdateAvailable: (callback: (info: any) => void) =>
    ipcRenderer.on('update-available', (_event, info) => callback(info)),
  onUpdateNotAvailable: (callback: () => void) =>
    ipcRenderer.on('update-not-available', callback),
  onUpdateError: (callback: (message: string) => void) =>
    ipcRenderer.on('update-error', (_event, message) => callback(message)),
  onDownloadProgress: (callback: (progress: any) => void) =>
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress)),
  onUpdateDownloaded: (callback: (info: any) => void) =>
    ipcRenderer.on('update-downloaded', (_event, info) => callback(info)),
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-available');
    ipcRenderer.removeAllListeners('update-not-available');
    ipcRenderer.removeAllListeners('update-error');
    ipcRenderer.removeAllListeners('download-progress');
    ipcRenderer.removeAllListeners('update-downloaded');
  },
});

// Type definitions for the exposed API
export interface ElectronAPI {
  createPatient: (patient: Omit<Patient, 'id'>) => Promise<any>;
  getPatients: () => Promise<Patient[]>;
  getPatient: (id: number) => Promise<Patient | null>;
  updatePatient: (id: number, patient: Partial<Patient>) => Promise<any>;
  deletePatient: (id: number) => Promise<any>;

  createDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<any>;
  getDoctors: () => Promise<Doctor[]>;
  getDoctor: (id: number) => Promise<Doctor | null>;
  updateDoctor: (id: number, doctor: Partial<Doctor>) => Promise<any>;
  deleteDoctor: (id: number) => Promise<any>;

  createAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<any>;
  getAppointments: () => Promise<(Appointment & { patientName: string; doctorName: string })[]>;
  getAppointment: (id: number) => Promise<Appointment | null>;
  updateAppointment: (id: number, appointment: Partial<Appointment>) => Promise<any>;
  deleteAppointment: (id: number) => Promise<any>;

  createPrescription: (prescription: Omit<Prescription, 'id'>) => Promise<any>;
  getPrescriptions: () => Promise<Prescription[]>;
  getPrescription: (id: number) => Promise<Prescription | null>;
  updatePrescription: (id: number, prescription: Partial<Prescription>) => Promise<any>;
  deletePrescription: (id: number) => Promise<any>;
  searchPrescriptions: (searchTerm: string) => Promise<Prescription[]>;

  printWithPreview: () => Promise<void>;

  // Dynamic data operations
  getDoctorsList: () => Promise<DoctorsList[]>;
  getClinics: () => Promise<Clinic[]>;
  getMedicationLevels: () => Promise<MedicationLevel[]>;
  getAdministrationRoutes: () => Promise<AdministrationRoute[]>;
  getFrequencies: () => Promise<Frequency[]>;
  getDurations: () => Promise<Duration[]>;
  getMedications: () => Promise<Medication[]>;
  getPharmacies: () => Promise<Pharmacy[]>;

  // Procedure codes operations
  getProcedureCodes: () => Promise<any[]>;
  searchProcedureCodes: (searchTerm: string) => Promise<any[]>;

  // Reports operations
  createReport: (report: any) => Promise<any>;
  getReports: () => Promise<any[]>;
  getReport: (id: number) => Promise<any>;
  updateReport: (id: number, report: any) => Promise<any>;
  deleteReport: (id: number) => Promise<any>;

  // Admin CRUD operations
  createAdminItem: (section: string, data: any) => Promise<any>;
  getAdminItem: (section: string, id: number) => Promise<any>;
  updateAdminItem: (section: string, id: number, data: any) => Promise<any>;
  deleteAdminItem: (section: string, id: number) => Promise<any>;

  // Database path operations
  getDatabasePath: () => Promise<string>;
  selectDatabasePath: () => Promise<string | null>;
  resetDatabasePath: () => Promise<void>;
  createDatabaseBackup: () => Promise<string>;
  getDatabaseInfo: () => Promise<any>;

  // Hospital configuration
  getHospitalConfig: () => Promise<{ id?: number; name?: string; address?: string; phone?: string }>;
  saveHospitalConfig: (data: { name?: string; address?: string; phone?: string }) => Promise<any>;

  // Focus management
  onWindowFocus: (callback: () => void) => void;
  onWindowBlur: (callback: () => void) => void;
  removeWindowFocusListeners: () => void;

  // Auto-updater APIs
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  quitAndInstall: () => Promise<void>;
  onUpdateAvailable: (callback: (info: any) => void) => void;
  onUpdateNotAvailable: (callback: () => void) => void;
  onUpdateError: (callback: (message: string) => void) => void;
  onDownloadProgress: (callback: (progress: any) => void) => void;
  onUpdateDownloaded: (callback: (info: any) => void) => void;
  removeUpdateListeners: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
