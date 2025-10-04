/**
 * Input validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class Validator {
  static validatePatient(patient: any): ValidationResult {
    const errors: string[] = [];

    if (!patient.name || typeof patient.name !== 'string' || patient.name.trim().length === 0) {
      errors.push('Patient name is required');
    }

    if (patient.name && patient.name.length > 100) {
      errors.push('Patient name must be less than 100 characters');
    }

    if (patient.dateOfBirth && !this.isValidDate(patient.dateOfBirth)) {
      errors.push('Invalid date of birth format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateDoctor(doctor: any): ValidationResult {
    const errors: string[] = [];

    if (!doctor.name || typeof doctor.name !== 'string' || doctor.name.trim().length === 0) {
      errors.push('Doctor name is required');
    }

    if (!doctor.specialization || typeof doctor.specialization !== 'string' || doctor.specialization.trim().length === 0) {
      errors.push('Doctor specialization is required');
    }

    if (doctor.name && doctor.name.length > 100) {
      errors.push('Doctor name must be less than 100 characters');
    }

    if (doctor.specialization && doctor.specialization.length > 100) {
      errors.push('Doctor specialization must be less than 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validatePrescription(prescription: any, options: { partial?: boolean } = {}): ValidationResult {
    const { partial = false } = options;
    const errors: string[] = [];

    if (!partial || Object.prototype.hasOwnProperty.call(prescription, 'patientName')) {
      if (!prescription.patientName || typeof prescription.patientName !== 'string' || prescription.patientName.trim().length === 0) {
        errors.push('Patient name is required');
      }
    }

    if (!partial || Object.prototype.hasOwnProperty.call(prescription, 'doctorName')) {
      if (!prescription.doctorName || typeof prescription.doctorName !== 'string' || prescription.doctorName.trim().length === 0) {
        errors.push('Doctor name is required');
      }
    }

    if (!partial || Object.prototype.hasOwnProperty.call(prescription, 'doctorDegree')) {
      if (!prescription.doctorDegree || typeof prescription.doctorDegree !== 'string' || prescription.doctorDegree.trim().length === 0) {
        errors.push('Doctor degree is required');
      }
    }

    if (!partial || Object.prototype.hasOwnProperty.call(prescription, 'prescriptionDate')) {
      if (!prescription.prescriptionDate || !this.isValidDate(prescription.prescriptionDate)) {
        errors.push('Valid prescription date is required');
      }
    }

    if (!partial || Object.prototype.hasOwnProperty.call(prescription, 'prescriptionTime')) {
      if (!prescription.prescriptionTime || !this.isValidTime(prescription.prescriptionTime)) {
        errors.push('Valid prescription time is required');
      }
    }

    if (prescription.medications && typeof prescription.medications === 'string') {
      try {
        const medications = JSON.parse(prescription.medications);
        if (!Array.isArray(medications)) {
          errors.push('Medications must be an array');
        }
      } catch {
        errors.push('Invalid medications format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateAppointment(appointment: any): ValidationResult {
    const errors: string[] = [];

    if (!appointment.patientId || typeof appointment.patientId !== 'number' || appointment.patientId <= 0) {
      errors.push('Valid patient ID is required');
    }

    if (!appointment.doctorId || typeof appointment.doctorId !== 'number' || appointment.doctorId <= 0) {
      errors.push('Valid doctor ID is required');
    }

    if (!appointment.appointmentDate || !this.isValidDate(appointment.appointmentDate)) {
      errors.push('Valid appointment date is required');
    }

    if (!appointment.appointmentTime || !this.isValidTime(appointment.appointmentTime)) {
      errors.push('Valid appointment time is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  static validateTime(timeString: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }

  private static isValidDate(dateString: string): boolean {
    return this.validateDate(dateString);
  }

  private static isValidTime(timeString: string): boolean {
    return this.validateTime(timeString);
  }

  static sanitizeString(input: any): string {
    if (typeof input !== 'string') {
      return '';
    }
    return input.trim().replace(/[<>]/g, '');
  }

  static sanitizeNumber(input: any): number {
    const num = Number(input);
    return isNaN(num) ? 0 : num;
  }
}
