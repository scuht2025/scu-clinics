const DOCTOR_KEY = 'prescription_doctor_name';
const DOCTOR_DEGREE_KEY = 'prescription_doctor_degree';
const CLINIC_KEY = 'prescription_clinic';

const setLocalStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const getLocalStorage = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

export class PrescriptionPreferences {
  persistSelections() {
    const doctorSelect = document.getElementById('doctorName') as HTMLSelectElement | null;
    const doctorDegreeSelect = document.getElementById('doctorDegree') as HTMLSelectElement | null;
    const clinicSelect = document.getElementById('consultation') as HTMLSelectElement | null;

    if (doctorSelect?.value) {
      setLocalStorage(DOCTOR_KEY, doctorSelect.value);
    }
    if (doctorDegreeSelect?.value) {
      setLocalStorage(DOCTOR_DEGREE_KEY, doctorDegreeSelect.value);
    }
    if (clinicSelect?.value) {
      setLocalStorage(CLINIC_KEY, clinicSelect.value);
    }
  }

  restoreSelections() {
    const doctorSelect = document.getElementById('doctorName') as HTMLSelectElement | null;
    const doctorDegreeSelect = document.getElementById('doctorDegree') as HTMLSelectElement | null;
    const clinicSelect = document.getElementById('consultation') as HTMLSelectElement | null;
    const savedDoctor = getLocalStorage(DOCTOR_KEY);
    const savedDoctorDegree = getLocalStorage(DOCTOR_DEGREE_KEY);
    const savedClinic = getLocalStorage(CLINIC_KEY);

    if (doctorSelect && savedDoctor) {
      doctorSelect.value = savedDoctor;
    }

    if (doctorDegreeSelect && savedDoctorDegree) {
      doctorDegreeSelect.value = savedDoctorDegree;
    }

    if (clinicSelect && savedClinic) {
      clinicSelect.value = savedClinic;
    }
  }
}
