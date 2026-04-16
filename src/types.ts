export type Gender = 'Laki-laki' | 'Perempuan';
export type MaritalStatus = 'Lajang' | 'Menikah' | 'Duda/Janda';
export type EducationLevel = |'SMA/SMK'|'DIII' | 'DIV' | 'S1' | 'S2' | 'S3';

export interface Education {
  level: EducationLevel;
  graduationYear: number;
  institution: string;
  major: string;
}

export type MainJob = 'Pegawai Swasta' | 'Wiraswasta' | 'Tenaga Medis' | 'Pendidik' | 'TNI/Polri' | 'PNS' | 'BUMN/BUMD' | 'Pensiunan' | 'Belum Bekerja' | 'Lainnya';

export interface Alumni {
  id?: string;
  fullName: string;
  gender: Gender;
  birthPlace: string;
  birthDate: string;
  phone: string;
  email: string;
  maritalStatus: MaritalStatus;
  educations: Education[];
  mainJob: MainJob;
  jobDetail?: string;
  workPlace?: string;
  address: string;
  province: string;
  city: string;
  // Interests & Potential
  skills: string[];
  otherSkill?: string;
  isWillingToServe: boolean;
  serviceInterests: string[];
  otherServiceInterest?: string;
  // KTB Information
  isInKTB: boolean;
  ktbName?: string;
  ktbLeader?: string;
  isWillingToJoinKTB?: boolean;
  password?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Event {
  id?: string;
  title: string;
  theme?: string;
  speaker?: string;
  description?: string;
  date: string; // ISO date string
  time: string; // HH:mm format
  timezone: 'WIB' | 'WITA' | 'WIT';
  location: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  // Manual attendance overrides
  manualAttendanceEnabled?: boolean;
  manualMaleCount?: number;
  manualFemaleCount?: number;
}

export interface EventResponse {
  id?: string;
  eventId: string;
  alumniId: string;
  alumniName: string;
  alumniGender: Gender;
  phone: string;
  status: 'Hadir' | 'Tidak Hadir';
  feedback?: string;
  createdAt: string;
}

export type SuggestionType = 'Saran' | 'Pokok Doa';

export interface Suggestion {
  id?: string;
  type: SuggestionType;
  fullName: string;
  email: string;
  phone: string;
  isAlumni: 'Ya' | 'Tidak';
  perkantasOrigin?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface OrgProfile {
  content: string;
  vision?: string;
  mission?: string;
  updatedAt?: string;
}

export interface HomeSettings {
  heroTitle: string;
  heroSubtitle: string;
  welcomeText: string;
  updatedAt?: string;
}

export type AlumniCategory = 'Junior' | 'Madya' | 'Senior';

export function getAlumniCategory(firstGraduationYear: number): AlumniCategory {
  const currentYear = new Date().getFullYear();
  const yearsSinceGraduation = currentYear - firstGraduationYear;
  
  if (yearsSinceGraduation > 15) return 'Senior';
  if (yearsSinceGraduation >= 5) return 'Madya';
  return 'Junior';
}
