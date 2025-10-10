/**
 * IPC handlers for main process
 * Separated from main.ts for better organization
 */

import { ipcMain, BrowserWindow, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import { join } from 'path';
import { copyFileSync, statSync } from 'fs';
import {
  patientService,
  doctorService,
  appointmentService,
  prescriptionService,
  doctorsListService,
  clinicsService,
  medicationLevelsService,
  administrationRoutesService,
  frequenciesService,
  durationsService,
  medicationsService,
  pharmaciesService,
  procedureCodesService,
  diagnosesService,
  reportsService,
  hospitalConfigService
} from './database';
import { logger } from './utils/logger';
import { Validator } from './utils/validation';

export function setupIpcHandlers(): void {
  logger.info('Setting up IPC handlers');

  // Patient handlers
  ipcMain.handle('create-patient', async (_event, patient) => {
    try {
      const validation = Validator.validatePatient(patient);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      return patientService.create(patient);
    } catch (error) {
      logger.error('Error creating patient:', error);
      throw error;
    }
  });

  ipcMain.handle('get-patients', async () => {
    try {
      return patientService.findAll();
    } catch (error) {
      logger.error('Error getting patients:', error);
      throw error;
    }
  });

  ipcMain.handle('get-patient', async (_event, id) => {
    try {
      const patientId = Validator.sanitizeNumber(id);
      if (patientId <= 0) {
        throw new Error('Invalid patient ID');
      }
      return patientService.findById(patientId);
    } catch (error) {
      logger.error('Error getting patient:', error);
      throw error;
    }
  });

  ipcMain.handle('update-patient', async (_event, id, patient) => {
    try {
      const patientId = Validator.sanitizeNumber(id);
      if (patientId <= 0) {
        throw new Error('Invalid patient ID');
      }
      const validation = Validator.validatePatient(patient);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      return patientService.update(patientId, patient);
    } catch (error) {
      logger.error('Error updating patient:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-patient', async (_event, id) => {
    try {
      const patientId = Validator.sanitizeNumber(id);
      if (patientId <= 0) {
        throw new Error('Invalid patient ID');
      }
      return patientService.delete(patientId);
    } catch (error) {
      logger.error('Error deleting patient:', error);
      throw error;
    }
  });

  // Doctor handlers
  ipcMain.handle('create-doctor', async (_event, doctor) => {
    try {
      const validation = Validator.validateDoctor(doctor);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      return doctorService.create(doctor);
    } catch (error) {
      logger.error('Error creating doctor:', error);
      throw error;
    }
  });

  ipcMain.handle('get-doctors', async () => {
    try {
      return doctorService.findAll();
    } catch (error) {
      logger.error('Error getting doctors:', error);
      throw error;
    }
  });

  ipcMain.handle('get-doctor', async (_event, id) => {
    try {
      const doctorId = Validator.sanitizeNumber(id);
      if (doctorId <= 0) {
        throw new Error('Invalid doctor ID');
      }
      return doctorService.findById(doctorId);
    } catch (error) {
      logger.error('Error getting doctor:', error);
      throw error;
    }
  });

  ipcMain.handle('update-doctor', async (_event, id, doctor) => {
    try {
      const doctorId = Validator.sanitizeNumber(id);
      if (doctorId <= 0) {
        throw new Error('Invalid doctor ID');
      }
      const validation = Validator.validateDoctor(doctor);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      return doctorService.update(doctorId, doctor);
    } catch (error) {
      logger.error('Error updating doctor:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-doctor', async (_event, id) => {
    try {
      const doctorId = Validator.sanitizeNumber(id);
      if (doctorId <= 0) {
        throw new Error('Invalid doctor ID');
      }
      return doctorService.delete(doctorId);
    } catch (error) {
      logger.error('Error deleting doctor:', error);
      throw error;
    }
  });

  // Appointment handlers
  ipcMain.handle('create-appointment', async (_event, appointment) => {
    try {
      const validation = Validator.validateAppointment(appointment);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      return appointmentService.create(appointment);
    } catch (error) {
      logger.error('Error creating appointment:', error);
      throw error;
    }
  });

  ipcMain.handle('get-appointments', async () => {
    try {
      return appointmentService.findAll();
    } catch (error) {
      logger.error('Error getting appointments:', error);
      throw error;
    }
  });

  ipcMain.handle('get-appointment', async (_event, id) => {
    try {
      const appointmentId = Validator.sanitizeNumber(id);
      if (appointmentId <= 0) {
        throw new Error('Invalid appointment ID');
      }
      return appointmentService.findById(appointmentId);
    } catch (error) {
      logger.error('Error getting appointment:', error);
      throw error;
    }
  });

  ipcMain.handle('update-appointment', async (_event, id, appointment) => {
    try {
      const appointmentId = Validator.sanitizeNumber(id);
      if (appointmentId <= 0) {
        throw new Error('Invalid appointment ID');
      }
      const validation = Validator.validateAppointment(appointment);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      return appointmentService.update(appointmentId, appointment);
    } catch (error) {
      logger.error('Error updating appointment:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-appointment', async (_event, id) => {
    try {
      const appointmentId = Validator.sanitizeNumber(id);
      if (appointmentId <= 0) {
        throw new Error('Invalid appointment ID');
      }
      return appointmentService.delete(appointmentId);
    } catch (error) {
      logger.error('Error deleting appointment:', error);
      throw error;
    }
  });

  // Prescription handlers
  ipcMain.handle('create-prescription', async (_event, prescription) => {
    try {
      const validation = Validator.validatePrescription(prescription);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      return prescriptionService.create(prescription);
    } catch (error) {
      logger.error('Error creating prescription:', error);
      throw error;
    }
  });

  ipcMain.handle('get-prescriptions', async () => {
    try {
      return prescriptionService.findAll();
    } catch (error) {
      logger.error('Error getting prescriptions:', error);
      throw error;
    }
  });

  ipcMain.handle('get-prescription', async (_event, id) => {
    try {
      const prescriptionId = Validator.sanitizeNumber(id);
      if (prescriptionId <= 0) {
        throw new Error('Invalid prescription ID');
      }
      return prescriptionService.findById(prescriptionId);
    } catch (error) {
      logger.error('Error getting prescription:', error);
      throw error;
    }
  });

  ipcMain.handle('update-prescription', async (_event, id, prescription) => {
    try {
      const prescriptionId = Validator.sanitizeNumber(id);
      if (prescriptionId <= 0) {
        throw new Error('Invalid prescription ID');
      }
      const validation = Validator.validatePrescription(prescription);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      return prescriptionService.update(prescriptionId, prescription);
    } catch (error) {
      logger.error('Error updating prescription:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-prescription', async (_event, id) => {
    try {
      const prescriptionId = Validator.sanitizeNumber(id);
      if (prescriptionId <= 0) {
        throw new Error('Invalid prescription ID');
      }
      return prescriptionService.delete(prescriptionId);
    } catch (error) {
      logger.error('Error deleting prescription:', error);
      throw error;
    }
  });

  ipcMain.handle('search-prescriptions', async (_event, searchTerm) => {
    try {
      const sanitizedTerm = Validator.sanitizeString(searchTerm);
      if (sanitizedTerm.length < 2) {
        throw new Error('Search term must be at least 2 characters');
      }
      return prescriptionService.search(sanitizedTerm);
    } catch (error) {
      logger.error('Error searching prescriptions:', error);
      throw error;
    }
  });

  // Print preview handler
  ipcMain.handle('print-with-preview', async (_event) => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (!focusedWindow) {
        throw new Error('No focused window found');
      }
      
      await focusedWindow.webContents.print({
        silent: false,
        printBackground: true,
        color: true,
        margins: {
          marginType: 'none'
        },
        landscape: false,
        scaleFactor: 100
      });
    } catch (error) {
      logger.error('Error printing with preview:', error);
      throw error;
    }
  });

  // Dynamic data handlers
  ipcMain.handle('get-doctors-list', async () => {
    try {
      return doctorsListService.findAll();
    } catch (error) {
      logger.error('Error getting doctors list:', error);
      throw error;
    }
  });

  ipcMain.handle('get-clinics', async () => {
    try {
      return clinicsService.findAll();
    } catch (error) {
      logger.error('Error getting clinics:', error);
      throw error;
    }
  });

  ipcMain.handle('get-medication-levels', async () => {
    try {
      return medicationLevelsService.findAll();
    } catch (error) {
      logger.error('Error getting medication levels:', error);
      throw error;
    }
  });

  ipcMain.handle('get-administration-routes', async () => {
    try {
      return administrationRoutesService.findAll();
    } catch (error) {
      logger.error('Error getting administration routes:', error);
      throw error;
    }
  });

  ipcMain.handle('get-frequencies', async () => {
    try {
      return frequenciesService.findAll();
    } catch (error) {
      logger.error('Error getting frequencies:', error);
      throw error;
    }
  });

  ipcMain.handle('get-durations', async () => {
    try {
      return durationsService.findAll();
    } catch (error) {
      logger.error('Error getting durations:', error);
      throw error;
    }
  });

  ipcMain.handle('get-medications', async () => {
    try {
      return medicationsService.findAll();
    } catch (error) {
      logger.error('Error getting medications:', error);
      throw error;
    }
  });

  ipcMain.handle('get-pharmacies', async () => {
    try {
      return pharmaciesService.findAll();
    } catch (error) {
      logger.error('Error getting pharmacies:', error);
      throw error;
    }
  });

  // Procedure codes handlers
  ipcMain.handle('get-procedure-codes', async () => {
    try {
      return procedureCodesService.findAll();
    } catch (error) {
      logger.error('Error getting procedure codes:', error);
      throw error;
    }
  });

  ipcMain.handle('search-procedure-codes', async (_event, searchTerm) => {
    try {
      const sanitizedTerm = Validator.sanitizeString(searchTerm);
      if (sanitizedTerm.length < 1) {
        return [];
      }
      return procedureCodesService.search(sanitizedTerm);
    } catch (error) {
      logger.error('Error searching procedure codes:', error);
      throw error;
    }
  });

  // Diagnoses handlers
  ipcMain.handle('get-diagnoses', async () => {
    try {
      return diagnosesService.findAll();
    } catch (error) {
      logger.error('Error getting diagnoses:', error);
      throw error;
    }
  });

  ipcMain.handle('search-diagnoses', async (_event, searchTerm) => {
    try {
      const sanitizedTerm = Validator.sanitizeString(searchTerm);
      if (sanitizedTerm.length < 1) {
        return [];
      }
      return diagnosesService.search(sanitizedTerm);
    } catch (error) {
      logger.error('Error searching diagnoses:', error);
      throw error;
    }
  });

  // Reports handlers
  ipcMain.handle('create-report', async (_event, report) => {
    try {
      return reportsService.create(report);
    } catch (error) {
      logger.error('Error creating report:', error);
      throw error;
    }
  });

  ipcMain.handle('get-reports', async () => {
    try {
      return reportsService.findAll();
    } catch (error) {
      logger.error('Error getting reports:', error);
      throw error;
    }
  });

  ipcMain.handle('get-report', async (_event, id) => {
    try {
      const reportId = Validator.sanitizeNumber(id);
      if (reportId <= 0) {
        throw new Error('Invalid report ID');
      }
      return reportsService.findById(reportId);
    } catch (error) {
      logger.error('Error getting report:', error);
      throw error;
    }
  });

  ipcMain.handle('update-report', async (_event, id, report) => {
    try {
      const reportId = Validator.sanitizeNumber(id);
      if (reportId <= 0) {
        throw new Error('Invalid report ID');
      }
      return reportsService.update(reportId, report);
    } catch (error) {
      logger.error('Error updating report:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-report', async (_event, id) => {
    try {
      const reportId = Validator.sanitizeNumber(id);
      if (reportId <= 0) {
        throw new Error('Invalid report ID');
      }
      return reportsService.delete(reportId);
    } catch (error) {
      logger.error('Error deleting report:', error);
      throw error;
    }
  });

  ipcMain.handle('search-reports', async (_event, searchTerm) => {
    try {
      const sanitizedTerm = Validator.sanitizeString(searchTerm);
      if (sanitizedTerm.length < 2) {
        throw new Error('Search term must be at least 2 characters');
      }
      return reportsService.search(sanitizedTerm);
    } catch (error) {
      logger.error('Error searching reports:', error);
      throw error;
    }
  });

  // Generic admin CRUD handlers
  ipcMain.handle('create-admin-item', async (_event, section, data) => {
    try {
      const service = getServiceBySection(section);
      if (!service) {
        throw new Error(`Unknown section: ${section}`);
      }
      return service.create(data);
    } catch (error) {
      logger.error('Error creating admin item:', error);
      throw error;
    }
  });

  ipcMain.handle('update-admin-item', async (_event, section, id, data) => {
    try {
      const service = getServiceBySection(section);
      if (!service) {
        throw new Error(`Unknown section: ${section}`);
      }
      const itemId = Validator.sanitizeNumber(id);
      if (itemId <= 0) {
        throw new Error('Invalid item ID');
      }
      return service.update(itemId, data);
    } catch (error) {
      logger.error('Error updating admin item:', error);
      throw error;
    }
  });

  ipcMain.handle('get-admin-item', async (_event, section, id) => {
    try {
      const service = getServiceBySection(section);
      if (!service) {
        throw new Error(`Unknown section: ${section}`);
      }
      const itemId = Validator.sanitizeNumber(id);
      if (itemId <= 0) {
        throw new Error('Invalid item ID');
      }
      return service.findById(itemId);
    } catch (error) {
      logger.error('Error getting admin item:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-admin-item', async (_event, section, id) => {
    try {
      const service = getServiceBySection(section);
      if (!service) {
        throw new Error(`Unknown section: ${section}`);
      }
      const itemId = Validator.sanitizeNumber(id);
      if (itemId <= 0) {
        throw new Error('Invalid item ID');
      }
      return service.delete(itemId);
    } catch (error) {
      logger.error('Error deleting admin item:', error);
      throw error;
    }
  });

  // Database path management handlers
  ipcMain.handle('get-database-path', async () => {
    try {
      return join('C:\\clinics-db', 'clinics.db');
    } catch (error) {
      logger.error('Error getting database path:', error);
      throw error;
    }
  });

  ipcMain.handle('select-database-path', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'اختر مجلد قاعدة البيانات'
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = join(result.filePaths[0], 'clinics.db');
        // TODO: Implement database migration logic
        logger.info('Database path selected:', selectedPath);
        return selectedPath;
      }
      return null;
    } catch (error) {
      logger.error('Error selecting database path:', error);
      throw error;
    }
  });

  ipcMain.handle('reset-database-path', async () => {
    try {
      // TODO: Implement database path reset logic
      logger.info('Reset database path to default');
    } catch (error) {
      logger.error('Error resetting database path:', error);
      throw error;
    }
  });

  ipcMain.handle('create-database-backup', async () => {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: `clinic-backup-${new Date().toISOString().split('T')[0]}.db`,
        filters: [
          { name: 'Database files', extensions: ['db'] },
          { name: 'All files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        const currentDbPath = join('C:\\clinics-db', 'clinics.db');
        copyFileSync(currentDbPath, result.filePath);
        logger.info('Database backup created:', result.filePath);
        return result.filePath;
      }
      return null;
    } catch (error) {
      logger.error('Error creating database backup:', error);
      throw error;
    }
  });

  ipcMain.handle('get-database-info', async () => {
    try {
      const dbPath = join('C:\\clinics-db', 'clinics.db');
      const stats = statSync(dbPath);
      const prescriptionsCount = prescriptionService.findAll().length;
      const doctorsCount = doctorsListService.findAll().length;

      return {
        size: `${(stats.size / 1024).toFixed(2)} KB`,
        lastModified: stats.mtime.toLocaleDateString('ar-EG'),
        prescriptionsCount,
        doctorsCount
      };
    } catch (error) {
      logger.error('Error getting database info:', error);
      throw error;
    }
  });

  // Hospital configuration handlers
  ipcMain.handle('get-hospital-config', async () => {
    try {
      return hospitalConfigService.get();
    } catch (error) {
      logger.error('Error getting hospital config:', error);
      throw error;
    }
  });

  ipcMain.handle('save-hospital-config', async (_event, data) => {
    try {
      return hospitalConfigService.save({
        name: Validator.sanitizeString(data?.name || ''),
        address: Validator.sanitizeString(data?.address || ''),
        phone: Validator.sanitizeString(data?.phone || ''),
        logo: typeof data?.logo === 'string' && data.logo.startsWith('data:image/') ? data.logo : null
      });
    } catch (error) {
      logger.error('Error saving hospital config:', error);
      throw error;
    }
  });

  // Auto-updater IPC handlers
  ipcMain.handle('check-for-updates', async () => {
    try {
      logger.info('Manual update check triggered');
      await autoUpdater.checkForUpdates();
    } catch (error) {
      logger.error('Error checking for updates:', error);
      throw error;
    }
  });

  ipcMain.handle('download-update', async () => {
    try {
      logger.info('Download update triggered');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      logger.error('Error downloading update:', error);
      throw error;
    }
  });

  ipcMain.handle('quit-and-install', async () => {
    try {
      logger.info('Quit and install triggered');
      // Ensure installer is applied immediately and app restarts automatically
      autoUpdater.quitAndInstall(true, true);
    } catch (error) {
      logger.error('Error quitting and installing:', error);
      throw error;
    }
  });
}

// Helper function to get service by section name
function getServiceBySection(section: string) {
  switch (section) {
    case 'doctors':
      return doctorsListService;
    case 'clinics':
      return clinicsService;
    case 'medication-levels':
      return medicationLevelsService;
    case 'routes':
      return administrationRoutesService;
    case 'frequencies':
      return frequenciesService;
    case 'durations':
      return durationsService;
    case 'medications':
      return medicationsService;
    case 'pharmacies':
      return pharmaciesService;
    case 'procedure-codes':
      return procedureCodesService;
    case 'diagnoses':
      return diagnosesService;
    default:
      return null;
  }
}
