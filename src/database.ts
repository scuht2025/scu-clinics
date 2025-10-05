import Database from 'better-sqlite3';
import { join } from 'path';

import { mkdirSync, existsSync } from 'fs';

let db: Database.Database;

export interface Patient {
  id?: number;
  name: string;
  dateOfBirth?: string;
}

export interface Doctor {
  id?: number;
  name: string;
  specialization: string;
}

export interface Prescription {
  id?: number;
  patientName: string;
  patientId: string;
  diagnoses: string;
  doctorName: string;
  doctorDegree: string;
  consultation: string;
  prescriptionDate: string;
  prescriptionTime: string;
  medications: string; // JSON string of medication array
  pharmacies: string; // JSON string of selected pharmacies
}

export interface DoctorsList {
  id?: number;
  name: string;
}

export interface Clinic {
  id?: number;
  name: string;
}

export interface MedicationLevel {
  id?: number;
  levelName: string;
}

export interface AdministrationRoute {
  id?: number;
  routeName: string;
}

export interface Frequency {
  id?: number;
  frequencyName: string;
}

export interface Duration {
  id?: number;
  durationName: string;
}

export interface Medication {
  id?: number;
  name: string;
  genericName?: string;
  prescribingLevel?: string;
  preAuthorizationProtocol?: string;
}

export interface Pharmacy {
  id?: number;
  name: string;
}

export interface ProcedureCode {
  id?: number;
  ar_name: string;
  en_name: string;
  uhia_code: string;
  category?: string;
  description?: string;
}

export interface Report {
  id?: number;
  patientName: string;
  patientId: string;
  doctorName: string;
  reportDate: string;
  reportTime: string;
  content: string; // HTML content from WYSIWYG editor
  created_at?: string;
}

export interface Appointment {
  id?: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
}

export interface HospitalConfig {
  id?: number; // always 1
  name: string;
  address?: string;
  phone?: string;
}

export function initializeDatabase(): Database.Database {
  // Create the clinics-db folder on C drive if it doesn't exist
  const dbDir = 'C:\\clinics-db';
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = join(dbDir, 'clinics.db');
  db = new Database(dbPath);

  // Enable foreign keys and optimize performance
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
  db.pragma('synchronous = NORMAL'); // Balance between safety and performance
  db.pragma('cache_size = 10000'); // Increase cache size for better performance
  db.pragma('temp_store = MEMORY'); // Store temp tables in memory
  db.pragma('mmap_size = 268435456'); // 256MB memory mapping

  createTables();
  createIndexes();
  return db;
}

function createTables() {
  // Patients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dateOfBirth TEXT
    )
  `);

  // Doctors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specialization TEXT NOT NULL
    )
  `);

  // Prescriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientName TEXT NOT NULL,
      patientId TEXT NOT NULL,
      diagnoses TEXT,
      doctorName TEXT NOT NULL,
      doctorDegree TEXT,
      consultation TEXT NOT NULL,
      prescriptionDate TEXT NOT NULL,
      prescriptionTime TEXT NOT NULL,
      medications TEXT NOT NULL,
      pharmacies TEXT,
      specialCategory TEXT
    )
  `);

  // Appointments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientId INTEGER NOT NULL,
      doctorId INTEGER NOT NULL,
      appointmentDate TEXT NOT NULL,
      appointmentTime TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (patientId) REFERENCES patients (id),
      FOREIGN KEY (doctorId) REFERENCES doctors (id)
    )
  `);

  // Dynamic data tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS doctors_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS clinics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS medication_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      levelName TEXT NOT NULL UNIQUE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS administration_routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routeName TEXT NOT NULL UNIQUE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS frequencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      frequencyName TEXT NOT NULL UNIQUE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS durations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      durationName TEXT NOT NULL UNIQUE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      genericName TEXT,
      prescribingLevel TEXT,
      preAuthorizationProtocol TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pharmacies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // Procedure codes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS procedure_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ar_name TEXT NOT NULL,
      en_name TEXT NOT NULL,
      uhia_code TEXT NOT NULL UNIQUE,
      category TEXT,
      description TEXT
    )
  `);

  // Reports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientName TEXT NOT NULL,
      patientId TEXT NOT NULL,
      doctorName TEXT NOT NULL,
      reportDate TEXT NOT NULL,
      reportTime TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Hospital configuration (single row with id=1)
  db.exec(`
    CREATE TABLE IF NOT EXISTS hospital_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT,
      address TEXT,
      phone TEXT
    )
  `);

  // Seed and migrations
  migrateMedicationsTable();
  migratePrescriptionsTable();
  removeLegacyColumns();
  seedInitialData();
}

function migrateMedicationsTable() {
  try {
    const pragmaStatement = db.prepare(`PRAGMA table_info('medications')`);
    const existingColumns = pragmaStatement.all() as { name: string }[];
    const hasPrescribingLevel = existingColumns.some(col => col.name === 'prescribingLevel');
    const hasPreAuth = existingColumns.some(col => col.name === 'preAuthorizationProtocol');

    if (!hasPrescribingLevel) {
      try {
        db.exec(`ALTER TABLE medications ADD COLUMN prescribingLevel TEXT`);
      } catch (err) {
        console.warn('Failed to add prescribingLevel column to medications:', err);
      }
    }

    if (!hasPreAuth) {
      try {
        db.exec(`ALTER TABLE medications ADD COLUMN preAuthorizationProtocol TEXT`);
      } catch (err) {
        console.warn('Failed to add preAuthorizationProtocol column to medications:', err);
      }
    }
  } catch (error) {
    console.warn('Failed to migrate medications table:', error);
  }
}

function migratePrescriptionsTable() {
  try {
    const pragmaStatement = db.prepare(`PRAGMA table_info('prescriptions')`);
    const existingColumns = pragmaStatement.all() as { name: string }[];
    const hasDiagnoses = existingColumns.some(col => col.name === 'diagnoses');
    const hasDoctorDegree = existingColumns.some(col => col.name === 'doctorDegree');

    if (!hasDiagnoses) {
      try {
        db.exec(`ALTER TABLE prescriptions ADD COLUMN diagnoses TEXT`);
      } catch (err) {
        console.warn('Failed to add diagnoses column to prescriptions:', err);
      }
    }

    if (!hasDoctorDegree) {
      try {
        db.exec(`ALTER TABLE prescriptions ADD COLUMN doctorDegree TEXT`);
      } catch (err) {
        console.warn('Failed to add doctorDegree column to prescriptions:', err);
      }
    }
  } catch (error) {
    console.warn('Failed to migrate prescriptions table:', error);
  }
}

function createIndexes() {
  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
    CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors(name);
    CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_name ON prescriptions(patientName);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_name ON prescriptions(doctorName);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(prescriptionDate);
    CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patientId);
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctorId);
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointmentDate);
    CREATE INDEX IF NOT EXISTS idx_doctors_list_name ON doctors_list(name);
    CREATE INDEX IF NOT EXISTS idx_clinics_name ON clinics(name);
    CREATE INDEX IF NOT EXISTS idx_medication_levels_name ON medication_levels(levelName);
    CREATE INDEX IF NOT EXISTS idx_administration_routes_name ON administration_routes(routeName);
    CREATE INDEX IF NOT EXISTS idx_frequencies_name ON frequencies(frequencyName);
    CREATE INDEX IF NOT EXISTS idx_durations_name ON durations(durationName);
    CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name);
    CREATE INDEX IF NOT EXISTS idx_pharmacies_name ON pharmacies(name);
    CREATE INDEX IF NOT EXISTS idx_procedure_codes_ar_name ON procedure_codes(ar_name);
    CREATE INDEX IF NOT EXISTS idx_procedure_codes_en_name ON procedure_codes(en_name);
    CREATE INDEX IF NOT EXISTS idx_procedure_codes_uhia_code ON procedure_codes(uhia_code);
    CREATE INDEX IF NOT EXISTS idx_reports_patient_name ON reports(patientName);
    CREATE INDEX IF NOT EXISTS idx_reports_doctor_name ON reports(doctorName);
    CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(reportDate);
  `);
}

export function getDatabase(): Database.Database {
  return db;
}

// Patient operations
export const patientService = {
  create: (patient: Omit<Patient, 'id'>) => {
    const stmt = db.prepare(`
      INSERT INTO patients (name, dateOfBirth)
      VALUES (?, ?)
    `);
    return stmt.run(patient.name, patient.dateOfBirth ?? null);
  },

  findAll: (): Patient[] => {
    const stmt = db.prepare('SELECT * FROM patients ORDER BY name');
    return stmt.all() as Patient[];
  },

  findById: (id: number): Patient | null => {
    const stmt = db.prepare('SELECT * FROM patients WHERE id = ?');
    return stmt.get(id) as Patient || null;
  },

  update: (id: number, patient: Partial<Patient>) => {
    const fields = Object.keys(patient).filter(key => key !== 'id');
    const values = fields.map(key => patient[key as keyof Patient]);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const stmt = db.prepare(`UPDATE patients SET ${setClause} WHERE id = ?`);
    return stmt.run(...values, id);
  },

  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM patients WHERE id = ?');
    return stmt.run(id);
  }
};

// Doctor operations
export const doctorService = {
  create: (doctor: Omit<Doctor, 'id'>) => {
    const stmt = db.prepare(`
      INSERT INTO doctors (name, specialization)
      VALUES (?, ?)
    `);
    return stmt.run(doctor.name, doctor.specialization);
  },

  findAll: (): Doctor[] => {
    const stmt = db.prepare('SELECT * FROM doctors ORDER BY name');
    return stmt.all() as Doctor[];
  },

  findById: (id: number): Doctor | null => {
    const stmt = db.prepare('SELECT * FROM doctors WHERE id = ?');
    return stmt.get(id) as Doctor || null;
  },

  update: (id: number, doctor: Partial<Doctor>) => {
    const fields = Object.keys(doctor).filter(key => key !== 'id');
    const values = fields.map(key => doctor[key as keyof Doctor]);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const stmt = db.prepare(`UPDATE doctors SET ${setClause} WHERE id = ?`);
    return stmt.run(...values, id);
  },

  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM doctors WHERE id = ?');
    return stmt.run(id);
  }
};

// Appointment operations
export const appointmentService = {
  create: (appointment: Omit<Appointment, 'id'>) => {
    const stmt = db.prepare(`
      INSERT INTO appointments (patientId, doctorId, appointmentDate, appointmentTime, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      appointment.patientId,
      appointment.doctorId,
      appointment.appointmentDate,
      appointment.appointmentTime,
      appointment.notes
    );
  },

  findAll: (): (Appointment & { patientName: string; doctorName: string })[] => {
    const stmt = db.prepare(`
      SELECT a.*, p.name as patientName, d.name as doctorName
      FROM appointments a
      JOIN patients p ON a.patientId = p.id
      JOIN doctors d ON a.doctorId = d.id
      ORDER BY a.appointmentDate, a.appointmentTime
    `);
    return stmt.all() as (Appointment & { patientName: string; doctorName: string })[];
  },

  findById: (id: number): Appointment | null => {
    const stmt = db.prepare('SELECT * FROM appointments WHERE id = ?');
    return stmt.get(id) as Appointment || null;
  },

  update: (id: number, appointment: Partial<Appointment>) => {
    const fields = Object.keys(appointment).filter(key => key !== 'id');
    const values = fields.map(key => appointment[key as keyof Appointment]);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const stmt = db.prepare(`UPDATE appointments SET ${setClause} WHERE id = ?`);
    return stmt.run(...values, id);
  },

  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM appointments WHERE id = ?');
    return stmt.run(id);
  }
};

// Prescription operations
export const prescriptionService = {
  create: (prescription: Omit<Prescription, 'id'>) => {
    const stmt = db.prepare(`
      INSERT INTO prescriptions (patientName, patientId, diagnoses, doctorName, doctorDegree, consultation, prescriptionDate, prescriptionTime, medications, pharmacies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      prescription.patientName,
      prescription.patientId,
      prescription.diagnoses,
      prescription.doctorName,
      prescription.doctorDegree,
      prescription.consultation,
      prescription.prescriptionDate,
      prescription.prescriptionTime,
      prescription.medications,
      prescription.pharmacies
    );
  },

  findAll: (): Prescription[] => {
    const stmt = db.prepare('SELECT * FROM prescriptions ORDER BY id DESC');
    return stmt.all() as Prescription[];
  },

  findById: (id: number): Prescription | null => {
    const stmt = db.prepare('SELECT * FROM prescriptions WHERE id = ?');
    return stmt.get(id) as Prescription || null;
  },

  update: (id: number, prescription: Partial<Prescription>) => {
    const fields = Object.keys(prescription).filter(key => key !== 'id');
    const values = fields.map(key => prescription[key as keyof Prescription]);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const stmt = db.prepare(`UPDATE prescriptions SET ${setClause} WHERE id = ?`);
    return stmt.run(...values, id);
  },

  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM prescriptions WHERE id = ?');
    return stmt.run(id);
  },

  search: (searchTerm: string): Prescription[] => {
    const stmt = db.prepare(`
      SELECT * FROM prescriptions
      WHERE patientName LIKE ? OR patientId LIKE ? OR diagnoses LIKE ? OR doctorName LIKE ? OR doctorDegree LIKE ? OR consultation LIKE ?
      ORDER BY prescriptionDate DESC, id DESC
      LIMIT 100
    `);
    const term = `%${searchTerm}%`;
    return stmt.all(term, term, term, term, term, term) as Prescription[];
  },

  findByDateRange: (startDate: string, endDate: string): Prescription[] => {
    const stmt = db.prepare(`
      SELECT * FROM prescriptions
      WHERE prescriptionDate BETWEEN ? AND ?
      ORDER BY prescriptionDate DESC, prescriptionTime DESC
    `);
    return stmt.all(startDate, endDate) as Prescription[];
  },

  findByDoctor: (doctorName: string): Prescription[] => {
    const stmt = db.prepare(`
      SELECT * FROM prescriptions
      WHERE doctorName LIKE ?
      ORDER BY prescriptionDate DESC, prescriptionTime DESC
    `);
    return stmt.all(`%${doctorName}%`) as Prescription[];
  },

  getStats: () => {
    const totalStmt = db.prepare('SELECT COUNT(*) as total FROM prescriptions');
    const todayStmt = db.prepare(`
      SELECT COUNT(*) as today FROM prescriptions 
      WHERE prescriptionDate = date('now')
    `);
    const thisMonthStmt = db.prepare(`
      SELECT COUNT(*) as thisMonth FROM prescriptions 
      WHERE prescriptionDate >= date('now', 'start of month')
    `);
    
    return {
      total: (totalStmt.get() as { total: number }).total,
      today: (todayStmt.get() as { today: number }).today,
      thisMonth: (thisMonthStmt.get() as { thisMonth: number }).thisMonth
    };
  }
};

// Seed initial data function
function seedInitialData() {
  // Check if data already exists
  const doctorCount = db.prepare('SELECT COUNT(*) as count FROM doctors_list').get() as { count: number };
  if (doctorCount.count > 0) return; // Data already seeded

  // Seed doctors list
  const doctorsData = [
    'د./حسن سعد', 'أ.د./ خالد السيد',
    'أ.د/محسن بدوي', 'أ.د/ ايمن سالم', 'أ.د/ايمان فهمي', 'أ.د/بسمة عثمان', 'أ.د/أشرف ابو حلاوة', 'أ.د/طارق الأمام', 'د/هبة صابر', 'أ.د/محمد القرقاري', 'د/احمد أنور', 'أ.د/أيمن جمعة', 'د/عمر منسي', 'د/محمد عبد الفتاح', 'د/محمد صابر', 'أ.د/شريف رفعت', 'أ.د/على يوسف', 'أ.د/سيد لبيب', 'أ.د/رضوى السيد', 'أ.د/خالد محمود', 'أ.د/حسن سعد', 'أ.د/محمد نبيل', 'أ.د/أيمن الحناوي', 'أ.د/مي عبد الرحيم'
  ];
  const doctorStmt = db.prepare('INSERT INTO doctors_list (name) VALUES (?)');
  doctorsData.forEach(name => doctorStmt.run(name));

  // Seed clinics
  const clinicsData = ['جراحة القلب و الصدر', 'جراحة الأطفال', 'جراحة الأوعية الدموية', 'أمراض القلب', 'أمراض الصدر', 'المسالك البولية', 'العظام', 'الروماتيزم والتأهيل', 'الرمد', 'الباطنه والكبد والجهاز الهضمي والمناظير', 'أمراض الباطنة و الكلى', 'الأنف والأذن و الحنجرة', 'جراحة المخ و الاعصاب والعمود الفقري', 'النسا والتوليد', 'الجراحة العامة', 'جراحة الأورام'
  ];
  const clinicStmt = db.prepare('INSERT INTO clinics (name) VALUES (?)');
  clinicsData.forEach(name => clinicStmt.run(name));

  // Seed medication levels
  const levelData = ['لا', 'بروتوكول'];
  const levelStmt = db.prepare('INSERT INTO medication_levels (levelName) VALUES (?)');
  levelData.forEach(level => levelStmt.run(level));

  // Seed administration routes
  const routeData = ['عن طريق الفم', 'عضل', 'وريد'];
  const routeStmt = db.prepare('INSERT INTO administration_routes (routeName) VALUES (?)');
  routeData.forEach(route => routeStmt.run(route));

  // Seed frequencies
  const frequencyData = [' مرة', 'مرتين', 'ثلاث مرات'];
  const frequencyStmt = db.prepare('INSERT INTO frequencies (frequencyName) VALUES (?)');
  frequencyData.forEach(freq => frequencyStmt.run(freq));

  // Seed durations
  const durationData = ['3 أيام', '5 أيام', ' أسبوع', 'أسبوعين', '3 أسابيع', 'شهر'];
  const durationStmt = db.prepare('INSERT INTO durations (durationName) VALUES (?)');
  durationData.forEach(duration => durationStmt.run(duration));

  // Seed pharmacies
  const pharmacyData = [
    'د/ عبدالعزيز عليان',
    'د/ ندى شومان',
    'د/ دينا الشاطوري',
    'د /يوسف علي',
    'د / حسين رأفت '
  ];
  const pharmacyStmt = db.prepare('INSERT INTO pharmacies (name) VALUES (?)');
  pharmacyData.forEach(name => pharmacyStmt.run(name));

  
}

// Generic CRUD service generator
function createCRUDService<T>(tableName: string, orderColumn: string = 'id') {
  return {
    create: (data: Omit<T, 'id'>) => {
      const fields = Object.keys(data);
      const placeholders = fields.map(() => '?').join(', ');
      const values = Object.values(data);
      const stmt = db.prepare(`INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`);
      return stmt.run(...values);
    },

    findAll: (): T[] => {
      const stmt = db.prepare(`SELECT * FROM ${tableName} ORDER BY ${orderColumn}`);
      return stmt.all() as T[];
    },

    findAllIncludingInactive: (): T[] => {
      const stmt = db.prepare(`SELECT * FROM ${tableName} ORDER BY ${orderColumn}`);
      return stmt.all() as T[];
    },

    findById: (id: number): T | null => {
      const stmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
      return stmt.get(id) as T || null;
    },

    update: (id: number, data: Partial<T>) => {
      const fields = Object.keys(data).filter(key => key !== 'id');
      const values = fields.map(key => data[key as keyof T]);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const stmt = db.prepare(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`);
      return stmt.run(...values, id);
    },

    delete: (id: number) => {
      const stmt = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
      return stmt.run(id);
    },

    hardDelete: (id: number) => {
      const stmt = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
      return stmt.run(id);
    }
  };
}

// Dynamic data services
export const doctorsListService = createCRUDService<DoctorsList>('doctors_list', 'name');
export const clinicsService = createCRUDService<Clinic>('clinics', 'name');
export const medicationLevelsService = createCRUDService<MedicationLevel>('medication_levels', 'levelName');
export const administrationRoutesService = createCRUDService<AdministrationRoute>('administration_routes', 'routeName');
export const frequenciesService = createCRUDService<Frequency>('frequencies', 'frequencyName');
export const durationsService = createCRUDService<Duration>('durations', 'durationName');
export const medicationsService = createCRUDService<Medication>('medications', 'name');
export const pharmaciesService = createCRUDService<Pharmacy>('pharmacies', 'name');
export const procedureCodesService = {
  ...createCRUDService<ProcedureCode>('procedure_codes', 'ar_name'),
  
  search: (searchTerm: string): ProcedureCode[] => {
    const stmt = db.prepare(`
      SELECT * FROM procedure_codes
      WHERE ar_name LIKE ? OR en_name LIKE ? OR uhia_code LIKE ?
      ORDER BY ar_name
      LIMIT 20
    `);
    const term = `%${searchTerm}%`;
    return stmt.all(term, term, term) as ProcedureCode[];
  }
};

export const reportsService = createCRUDService<Report>('reports', 'reportDate');

// Hospital configuration service (single row)
export const hospitalConfigService = {
  get: (): HospitalConfig => {
    const stmt = db.prepare('SELECT id, name, address, phone FROM hospital_config WHERE id = 1');
    const row = stmt.get() as HospitalConfig | undefined;
    // Provide sensible defaults if not configured
    return row ?? { id: 1, name: 'مستشفى جامعة قناة السويس التخصصي', address: '', phone: '' };
  },
  save: (data: Partial<HospitalConfig>) => {
    const existing = db.prepare('SELECT id FROM hospital_config WHERE id = 1').get() as { id: number } | undefined;
    if (existing) {
      const fields = Object.keys(data).filter(k => k !== 'id');
      if (fields.length === 0) return { changes: 0 };
      const setClause = fields.map(f => `${f} = ?`).join(', ');
      const values = fields.map(f => (data as any)[f]);
      const stmt = db.prepare(`UPDATE hospital_config SET ${setClause} WHERE id = 1`);
      return stmt.run(...values);
    } else {
      const stmt = db.prepare('INSERT INTO hospital_config (id, name, address, phone) VALUES (1, ?, ?, ?)');
      return stmt.run(data.name ?? null, data.address ?? null, data.phone ?? null);
    }
  }
};

function removeLegacyColumns() {
  const columnsToDrop: Record<string, string[]> = {
    appointments: ['status', 'createdAt'],
    clinics: ['description', 'status', 'createdAt'],
    doctors_list: ['status', 'createdAt'],
    medication_levels: ['status', 'createdAt'],
    administration_routes: ['status', 'createdAt'],
    frequencies: ['status', 'createdAt'],
    durations: ['status', 'createdAt'],
    medications: ['status', 'createdAt', 'strength', 'form'],
    pharmacies: ['status', 'createdAt', 'address', 'phone'],
    patients: ['createdAt', 'phone', 'email', 'address'],
    doctors: ['createdAt', 'phone', 'email'],
    prescriptions: ['createdAt', 'updatedAt']
  };

  Object.entries(columnsToDrop).forEach(([tableName, columns]) => {
    const pragmaStatement = db.prepare(`PRAGMA table_info('${tableName}')`);
    const existingColumns = pragmaStatement.all() as { name: string }[];

    columns.forEach(column => {
      if (existingColumns.some(col => col.name === column)) {
        try {
          db.exec(`ALTER TABLE ${tableName} DROP COLUMN ${column}`);
        } catch (error) {
          console.warn(`Failed to drop column ${column} from ${tableName}:`, error);
        }
      }
    });
  });
}