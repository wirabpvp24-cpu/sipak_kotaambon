export type Gender = 'Laki-laki' | 'Perempuan';
export type MaritalStatus = 'Lajang' | 'Menikah' | 'Duda/Janda';
export type EducationLevel = 'DIII' | 'DIV' | 'S1' | 'S2' | 'S3';

export interface Education {
  level: EducationLevel;
  graduationYear: number;
  institution: string;
}

export type MainJob = 'Pegawai Swasta' | 'Wiraswasta' | 'Tenaga Medis' | 'Pendidik' | 'TNI/Polri' | 'PNS' | 'BUMN/BUMD' | 'Pensiunan' | 'Lainnya';

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
  createdAt: string;
}

export interface Event {
  id?: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  time: string; // HH:mm format
  location: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AlumniCategory = 'Junior' | 'Madya' | 'Senior';

export function getAlumniCategory(firstGraduationYear: number): AlumniCategory {
  const currentYear = new Date().getFullYear();
  const yearsSinceGraduation = currentYear - firstGraduationYear;
  
  if (yearsSinceGraduation >= 15) return 'Senior';
  if (yearsSinceGraduation >= 5) return 'Madya';
  return 'Junior';
}
