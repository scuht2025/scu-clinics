/**
 * Prescription service with business logic
 */

import { Prescription } from '../database';
import { prescriptionService } from '../database';
import { logger } from '../utils/logger';
import { Validator } from '../utils/validation';

export class PrescriptionService {
  async createPrescription(data: Omit<Prescription, 'id'>): Promise<any> {
    try {
      // Validate input
      const validation = Validator.validatePrescription(data, { partial: true });
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Sanitize data
      const sanitizedData = {
        ...data,
        patientName: Validator.sanitizeString(data.patientName),
        patientId: Validator.sanitizeString(data.patientId),
        diagnoses: Validator.sanitizeString(data.diagnoses),
        doctorName: Validator.sanitizeString(data.doctorName),
        doctorDegree: Validator.sanitizeString(data.doctorDegree),
        consultation: Validator.sanitizeString(data.consultation)
      };

      const result = prescriptionService.create(sanitizedData);
      logger.info('Prescription created successfully', { id: result.lastInsertRowid });
      return result;
    } catch (error) {
      logger.error('Error creating prescription:', error);
      throw error;
    }
  }

  async getPrescriptions(): Promise<Prescription[]> {
    try {
      return prescriptionService.findAll();
    } catch (error) {
      logger.error('Error getting prescriptions:', error);
      throw error;
    }
  }

  async getPrescription(id: number): Promise<Prescription | null> {
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
  }

  async updatePrescription(id: number, data: Partial<Prescription>): Promise<any> {
    try {
      const prescriptionId = Validator.sanitizeNumber(id);
      if (prescriptionId <= 0) {
        throw new Error('Invalid prescription ID');
      }

      // Validate input
      const validation = Validator.validatePrescription(data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Sanitize data
      const sanitizedData = { ...data };
      if (data.patientName) sanitizedData.patientName = Validator.sanitizeString(data.patientName);
      if (data.patientId) sanitizedData.patientId = Validator.sanitizeString(data.patientId);
      if (data.diagnoses) sanitizedData.diagnoses = Validator.sanitizeString(data.diagnoses);
      if (data.doctorName) sanitizedData.doctorName = Validator.sanitizeString(data.doctorName);
      if (data.doctorDegree) sanitizedData.doctorDegree = Validator.sanitizeString(data.doctorDegree);
      if (data.consultation) sanitizedData.consultation = Validator.sanitizeString(data.consultation);

      const result = prescriptionService.update(prescriptionId, sanitizedData);
      logger.info('Prescription updated successfully', { id: prescriptionId });
      return result;
    } catch (error) {
      logger.error('Error updating prescription:', error);
      throw error;
    }
  }

  async deletePrescription(id: number): Promise<any> {
    try {
      const prescriptionId = Validator.sanitizeNumber(id);
      if (prescriptionId <= 0) {
        throw new Error('Invalid prescription ID');
      }

      const result = prescriptionService.delete(prescriptionId);
      logger.info('Prescription deleted successfully', { id: prescriptionId });
      return result;
    } catch (error) {
      logger.error('Error deleting prescription:', error);
      throw error;
    }
  }

  async searchPrescriptions(searchTerm: string): Promise<Prescription[]> {
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
  }

  async getPrescriptionsByDateRange(startDate: string, endDate: string): Promise<Prescription[]> {
    try {
      if (!Validator.validateDate(startDate) || !Validator.validateDate(endDate)) {
        throw new Error('Invalid date format');
      }
      return prescriptionService.findByDateRange(startDate, endDate);
    } catch (error) {
      logger.error('Error getting prescriptions by date range:', error);
      throw error;
    }
  }

  async getPrescriptionsByDoctor(doctorName: string): Promise<Prescription[]> {
    try {
      const sanitizedDoctorName = Validator.sanitizeString(doctorName);
      if (sanitizedDoctorName.length < 2) {
        throw new Error('Doctor name must be at least 2 characters');
      }
      return prescriptionService.findByDoctor(sanitizedDoctorName);
    } catch (error) {
      logger.error('Error getting prescriptions by doctor:', error);
      throw error;
    }
  }

  async getPrescriptionStats(): Promise<{
    total: number;
    today: number;
    thisMonth: number;
  }> {
    try {
      return prescriptionService.getStats();
    } catch (error) {
      logger.error('Error getting prescription stats:', error);
      throw error;
    }
  }
}

export const prescriptionServiceInstance = new PrescriptionService();
