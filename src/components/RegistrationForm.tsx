import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Save, User, Phone, Mail, MapPin, Briefcase, GraduationCap, Calendar, Loader2, AlertCircle, History, UserCheck, UserPlus, Heart, Sparkles, Eye, EyeOff, Upload, Image as ImageIcon, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { Alumni, Education, EducationLevel, Gender, MaritalStatus, MainJob } from '@/types';
import { dbService } from '@/lib/db';
import { INDONESIA_REGIONS } from '@/constants/regions';

const EDUCATION_LEVELS: EducationLevel[] = ['DIII', 'DIV', 'S1', 'S2', 'S3'];
const MAIN_JOBS: MainJob[] = ['Pegawai Swasta', 'Wiraswasta', 'Tenaga Medis', 'Pendidik', 'TNI/Polri', 'PNS', 'BUMN/BUMD', 'Pensiunan', 'Lainnya'];

const SKILLS_OPTIONS = [
  'Pendidikan & Pengajaran',
  'Teknologi Informasi (IT)',
  'Desain Grafis & Multimedia',
  'Administrasi & Perkantoran',
  'Bisnis & Kewirausahaan',
  'Keuangan & Akuntansi',
  'Kesehatan',
  'Teknik & Industri',
  'Hukum',
  'Pertanian / Perkebunan',
  'Perikanan / Kelautan',
  'Seni & Budaya',
  'Sosial & Pelayanan',
  'Lainnya'
];

const SERVICE_OPTIONS = [
  'Pengajaran Firman (PA, sharing, pemateri)',
  'Pemuridan / Pendampingan (membina, mentoring)',
  'Doa & Konseling',
  'Worship Leader',
  'Pemusik',
  'MC / Host Acara',
  'Multimedia (desain dan publikasi)',
  'Event & Kepanitiaan',
  'Kontributor Konten (penulisan, media sosial, dll)',
  'Donatur / Support Dana',
  'Lainnya'
];

export default function RegistrationForm({ 
  onComplete, 
  initialData, 
  onCancel,
  mode = 'public'
}: { 
  onComplete: () => void;
  initialData?: Alumni;
  onCancel?: () => void;
  mode?: 'public' | 'admin';
}) {
  const formatToInputDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  };

  const [formData, setFormData] = useState<Partial<Alumni>>(() => {
    if (initialData) {
      // Sort educations from lowest to highest level based on EDUCATION_LEVELS order
      const sortedEducations = initialData.educations ? [...initialData.educations].sort((a, b) => {
        return EDUCATION_LEVELS.indexOf(a.level) - EDUCATION_LEVELS.indexOf(b.level);
      }) : [];
      
      return {
        isInKTB: false,
        ktbName: '',
        ktbLeader: '',
        isWillingToJoinKTB: false,
        ...initialData,
        birthDate: formatToInputDate(initialData.birthDate),
        educations: sortedEducations
      };
    }
    return {
      fullName: '',
      gender: 'Laki-laki',
      birthPlace: '',
      birthDate: '',
      phone: '',
      email: '',
      maritalStatus: 'Lajang',
      educations: [{ level: 'S1', graduationYear: new Date().getFullYear(), institution: '', major: '' }],
      mainJob: 'Pegawai Swasta',
      jobDetail: '',
      workPlace: '',
      address: '',
      province: '',
      city: '',
      skills: [],
      otherSkill: '',
      isWillingToServe: false,
      serviceInterests: [],
      otherServiceInterest: '',
      isInKTB: false,
      ktbName: '',
      ktbLeader: '',
      isWillingToJoinKTB: false,
      password: '',
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [flowState, setFlowState] = useState<'select' | 'register' | 'verify' | 'update'>(
    mode === 'admin' ? 'register' : 'select'
  );
  const [verificationData, setVerificationData] = useState({ code: '' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationPassword, setShowVerificationPassword] = useState(false);
  const isEdit = !!initialData;

  const emptyForm: Partial<Alumni> = {
    fullName: '',
    gender: 'Laki-laki',
    birthPlace: '',
    birthDate: '',
    phone: '',
    email: '',
    maritalStatus: 'Lajang',
    educations: [{ level: 'S1', graduationYear: new Date().getFullYear(), institution: '', major: '' }],
    mainJob: 'Pegawai Swasta',
    jobDetail: '',
    workPlace: '',
    address: '',
    province: '',
    city: '',
    skills: [],
    otherSkill: '',
    isWillingToServe: false,
    serviceInterests: [],
    otherServiceInterest: '',
    isInKTB: false,
    ktbName: '',
    ktbLeader: '',
    isWillingToJoinKTB: false,
    password: '',
  };

  const handleReset = () => {
    setFormData(emptyForm);
    setShowError(false);
    setFlowState('select');
    setVerificationData({ code: '' });
  };

  const handleVerify = async () => {
    if (!verificationData.code) {
      setVerificationError("Mohon masukkan Password Alumni Anda.");
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);
    try {
      // Find alumni by password
      const foundAlumni = await dbService.findAlumniByPassword(verificationData.code.trim());
      
      if (foundAlumni) {
        setFormData({
          ...foundAlumni,
          birthDate: formatToInputDate(foundAlumni.birthDate)
        });
        setFlowState('update');
      } else {
        setVerificationError("Password tidak ditemukan. Pastikan data yang Anda masukkan sesuai.");
      }
    } catch (error) {
      setVerificationError("Terjadi kesalahan saat mengecek data.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    
    let formatted = value;
    if (value.length > 2) {
      formatted = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length > 4) {
      formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
    }
    
    setFormData({ ...formData, birthDate: formatted });
  };

  const RequiredAsterisk = () => <span className="text-red-500 ml-1">*</span>;

  const handleAddEducation = () => {
    setFormData(prev => ({
      ...prev,
      educations: [...(prev.educations || []), { level: 'S1', graduationYear: new Date().getFullYear(), institution: '', major: '' }]
    }));
  };

  const handleRemoveEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      educations: prev.educations?.filter((_, i) => i !== index)
    }));
  };

  const handleEducationChange = (index: number, field: keyof Education, value: any) => {
    setFormData(prev => {
      const newEducations = [...(prev.educations || [])];
      newEducations[index] = { ...newEducations[index], [field]: value };
      return { ...prev, educations: newEducations };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation check
    const requiredFields = ['fullName', 'birthPlace', 'birthDate', 'phone', 'email', 'address', 'province', 'city', 'mainJob', 'password'];
    
    const ktbValid = formData.isInKTB 
      ? (!!formData.ktbName && !!formData.ktbLeader)
      : (formData.isWillingToJoinKTB !== undefined && formData.isWillingToJoinKTB !== null);

    // Password validation: 8 chars, alphanumeric + symbols
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    const isPasswordValid = formData.password && passwordRegex.test(formData.password);

    // BirthDate validation: DD/MM/YYYY
    const birthDateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    const isBirthDateValid = formData.birthDate && birthDateRegex.test(formData.birthDate);

    const hasEmptyFields = requiredFields.some(field => !formData[field as keyof Alumni]) || 
                          formData.educations?.some(edu => !edu.institution || !edu.major) ||
                          (formData.skills?.length === 0) ||
                          !ktbValid;

    if (hasEmptyFields) {
      setShowError(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!isBirthDateValid) {
      setSubmitError("Format Tanggal Lahir harus DD/MM/YYYY (Contoh: 31/12/1990).");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!isPasswordValid) {
      setSubmitError("Password harus minimal 8 karakter dan kombinasi angka, huruf, serta simbol.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setShowError(false);
    setShowConfirmDialog(true);
  };

  const handleFinalSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    setSubmitError(null);

    // Clean up undefined values for Firestore
    const cleanedData = { ...formData };
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key as keyof Alumni] === undefined) {
        delete cleanedData[key as keyof Alumni];
      }
    });

    try {
      if (isEdit || flowState === 'update') {
        // Check if password is used by someone else
        if (formData.password) {
          const existingPassword = await dbService.findAlumniByPassword(formData.password);
          if (existingPassword && existingPassword.id !== formData.id) {
            setSubmitError("Password ini sudah digunakan oleh alumni lain. Silakan buat password yang berbeda untuk keamanan Anda.");
            setIsSubmitting(false);
            return;
          }
        }

        await dbService.updateAlumni(cleanedData as Alumni);
        if (isEdit) onComplete();
        else {
          setIsSuccess(true);
          setFlowState('select');
          setFormData(emptyForm);
        }
      } else {
        // Check for duplicates one last time before adding
        const existingEmail = await dbService.findAlumniByEmailOrPhone(formData.email!);
        const existingPhone = await dbService.findAlumniByEmailOrPhone(formData.phone!);
        const existingPassword = await dbService.findAlumniByPassword(formData.password!);
        
        if (existingEmail || existingPhone) {
          setSubmitError("Email atau Nomor HP sudah terdaftar. Silakan gunakan menu 'Update Data' untuk mengubah data Anda.");
          setIsSubmitting(false);
          return;
        }

        if (existingPassword) {
          setSubmitError("Password ini sudah digunakan oleh alumni lain. Silakan buat password yang berbeda untuk keamanan Anda.");
          setIsSubmitting(false);
          return;
        }

        await dbService.addAlumni(cleanedData as Alumni);
        setIsSuccess(true);
        setFormData(emptyForm);
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      let errorMessage = "Gagal menyimpan data. Silakan periksa koneksi internet Anda atau coba lagi nanti.";
      
      try {
        // Try to parse if it's our custom JSON error
        const errObj = JSON.parse(error.message);
        if (errObj.error) {
          if (errObj.error.includes("Missing or insufficient permissions")) {
            errorMessage = "Anda tidak memiliki izin untuk melakukan operasi ini. Pastikan Anda sudah login sebagai admin.";
          } else {
            errorMessage = `Terjadi kesalahan: ${errObj.error}`;
          }
        }
      } catch (e) {
        // Not a JSON error, use the raw message if available
        if (error.message && !error.message.includes("[object Object]")) {
          errorMessage = error.message;
        }
      }

      setSubmitError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => (
    <>
      {/* Personal Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600 font-semibold">
          <User className="w-5 h-5" />
          <span>Informasi Pribadi</span>
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap (beserta gelar) <RequiredAsterisk /></Label>
            <Input 
              id="fullName" 
              required 
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})}
              placeholder="Contoh: Dr. Nama Alumni, S.Pd., M.Pd."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Jenis Kelamin <RequiredAsterisk /></Label>
            <Select 
              value={formData.gender} 
              onValueChange={(v: Gender) => setFormData({...formData, gender: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                <SelectItem value="Perempuan">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthPlace">Tempat Lahir <RequiredAsterisk /></Label>
            <Input 
              id="birthPlace" 
              required 
              value={formData.birthPlace} 
              onChange={e => setFormData({...formData, birthPlace: e.target.value})}
              placeholder="Kota kelahiran"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">Tanggal Lahir <RequiredAsterisk /></Label>
            <Input 
              id="birthDate" 
              type="text" 
              required 
              value={formData.birthDate} 
              onChange={handleBirthDateChange}
              placeholder="DD/MM/YYYY"
              className="block"
              maxLength={10}
            />
            <p className="text-[10px] text-slate-400 italic">Format: Tanggal/Bulan/Tahun (Contoh: 31/12/1990)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Handphone <RequiredAsterisk /></Label>
            <Input 
              id="phone" 
              type="tel" 
              required 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="0812..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email <RequiredAsterisk /></Label>
            <Input 
              id="email" 
              type="email" 
              required 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="email@contoh.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Status Pernikahan <RequiredAsterisk /></Label>
            <Select 
              value={formData.maritalStatus} 
              onValueChange={(v: MaritalStatus) => setFormData({...formData, maritalStatus: v})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lajang">Lajang</SelectItem>
                <SelectItem value="Menikah">Menikah</SelectItem>
                <SelectItem value="Duda/Janda">Duda/Janda</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password Alumni <RequiredAsterisk /></Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"}
                required 
                value={formData.password || ''} 
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Min. 8 karakter (Huruf, Angka, Simbol)"
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              *Password ini akan digunakan untuk memperbarui data Anda di masa mendatang. 
              Contoh: <span className="font-mono font-bold text-slate-500">Alumni2024!</span>
            </p>
          </div>
        </div>
      </div>

      {/* Education History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            <GraduationCap className="w-5 h-5" />
            <span>Riwayat Pendidikan</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddEducation} className="gap-2">
            <Plus className="w-4 h-4" /> Tambah Jenjang
          </Button>
        </div>
        <Separator />
        <div className="space-y-4">
          <AnimatePresence>
            {formData.educations?.map((edu, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 border rounded-lg bg-slate-50/50 relative group"
              >
                {formData.educations!.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                    onClick={() => handleRemoveEducation(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Jenjang <RequiredAsterisk /></Label>
                    <Select 
                      value={edu.level} 
                      onValueChange={(v: EducationLevel) => handleEducationChange(index, 'level', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tahun Kelulusan <RequiredAsterisk /></Label>
                    <Input 
                      type="number" 
                      value={edu.graduationYear || ''} 
                      onChange={e => {
                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                        handleEducationChange(index, 'graduationYear', val);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Asal Institusi <RequiredAsterisk /></Label>
                    <Input 
                      value={edu.institution} 
                      onChange={e => handleEducationChange(index, 'institution', e.target.value)}
                      placeholder="Nama Universitas/Sekolah"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label>Program Studi <RequiredAsterisk /></Label>
                    <Input 
                      value={edu.major} 
                      onChange={e => handleEducationChange(index, 'major', e.target.value)}
                      placeholder="Contoh: Teknik Informatika, Akuntansi, dsb"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Professional & Address */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600 font-semibold">
          <Briefcase className="w-5 h-5" />
          <span>Pekerjaan & Domisili</span>
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="mainJob">Pekerjaan Utama <RequiredAsterisk /></Label>
            <Select 
              value={formData.mainJob} 
              onValueChange={(v: MainJob) => setFormData({...formData, mainJob: v})}
            >
              <SelectTrigger id="mainJob">
                <SelectValue placeholder="Pilih pekerjaan utama" />
              </SelectTrigger>
              <SelectContent>
                {MAIN_JOBS.map(job => (
                  <SelectItem key={job} value={job}>{job}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobDetail">Detail Pekerjaan (Opsional)</Label>
            <Input 
              id="jobDetail" 
              value={formData.jobDetail || ''} 
              onChange={e => setFormData({...formData, jobDetail: e.target.value})}
              placeholder="Mis. Guru Matematika, Manager IT, dsb"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workPlace">Tempat Bekerja (Opsional)</Label>
            <Input 
              id="workPlace" 
              value={formData.workPlace || ''} 
              onChange={e => setFormData({...formData, workPlace: e.target.value})}
              placeholder="Nama Perusahaan / Instansi"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">Provinsi Domisili <RequiredAsterisk /></Label>
            <Select 
              value={formData.province} 
              onValueChange={(v) => setFormData({...formData, province: v, city: ''})}
            >
              <SelectTrigger id="province">
                <SelectValue placeholder="Pilih Provinsi" />
              </SelectTrigger>
              <SelectContent>
                {INDONESIA_REGIONS.provinces.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Kabupaten/Kota Domisili <RequiredAsterisk /></Label>
            <Select 
              value={formData.city} 
              onValueChange={(v) => setFormData({...formData, city: v})}
              disabled={!formData.province}
            >
              <SelectTrigger id="city">
                <SelectValue placeholder={!formData.province ? "Pilih provinsi dulu" : "Pilih Kota/Kab"} />
              </SelectTrigger>
              <SelectContent>
                {formData.province && INDONESIA_REGIONS.regencies[formData.province]?.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Alamat Lengkap <RequiredAsterisk /></Label>
            <Input 
              id="address" 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="Jalan, No Rumah, RT/RW"
            />
          </div>
        </div>
      </div>

      {/* Interests & Potential */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600 font-semibold">
          <Sparkles className="w-5 h-5" />
          <span>Minat & Potensi</span>
        </div>
        <Separator />
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base">Bidang Keahlian (ditekuni minimal {'>'} 1 tahun) <RequiredAsterisk /></Label>
            <p className="text-xs text-slate-500">Pilih maksimal 5 keahlian yang Anda miliki.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SKILLS_OPTIONS.map(skill => (
                <div key={skill} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`skill-${skill}`} 
                    checked={formData.skills?.includes(skill)}
                    onCheckedChange={(checked) => {
                      const currentSkills = formData.skills || [];
                      if (checked) {
                        if (currentSkills.length < 5) {
                          setFormData({ ...formData, skills: [...currentSkills, skill] });
                        }
                      } else {
                        setFormData({ ...formData, skills: currentSkills.filter(s => s !== skill) });
                      }
                    }}
                    disabled={!formData.skills?.includes(skill) && (formData.skills?.length || 0) >= 5}
                  />
                  <Label htmlFor={`skill-${skill}`} className="text-sm font-normal cursor-pointer">{skill}</Label>
                </div>
              ))}
            </div>
            {formData.skills?.includes('Lainnya') && (
              <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                <Input 
                  placeholder="Sebutkan keahlian lainnya (mis. Pariwisata, Transportasi, dsb)" 
                  value={formData.otherSkill || ''}
                  onChange={e => setFormData({ ...formData, otherSkill: e.target.value })}
                  className="max-w-md"
                />
              </div>
            )}
          </div>

          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="space-y-2">
              <Label className="text-base">Kesediaan terlibat dalam pelayanan PAK Kota Ambon? <RequiredAsterisk /></Label>
              <RadioGroup 
                value={formData.isWillingToServe ? "Ya" : "Tidak"} 
                onValueChange={(val) => setFormData({ 
                  ...formData, 
                  isWillingToServe: val === "Ya",
                  serviceInterests: val === "Tidak" ? [] : formData.serviceInterests 
                })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Ya" id="serve-yes" />
                  <Label htmlFor="serve-yes">Ya</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Tidak" id="serve-no" />
                  <Label htmlFor="serve-no">Tidak</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.isWillingToServe && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-2 border-t border-slate-200"
              >
                <Label className="text-sm font-semibold">Bidang Pelayanan yang Diminati</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SERVICE_OPTIONS.map(service => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`service-${service}`} 
                        checked={formData.serviceInterests?.includes(service)}
                        onCheckedChange={(checked) => {
                          const currentServices = formData.serviceInterests || [];
                          if (checked) {
                            setFormData({ ...formData, serviceInterests: [...currentServices, service] });
                          } else {
                            setFormData({ ...formData, serviceInterests: currentServices.filter(s => s !== service) });
                          }
                        }}
                      />
                      <Label htmlFor={`service-${service}`} className="text-sm font-normal cursor-pointer">{service}</Label>
                    </div>
                  ))}
                </div>
                {formData.serviceInterests?.includes('Lainnya') && (
                  <div className="mt-2">
                    <Input 
                      placeholder="Sebutkan bidang pelayanan lainnya" 
                      value={formData.otherServiceInterest || ''}
                      onChange={e => setFormData({ ...formData, otherServiceInterest: e.target.value })}
                      className="max-w-md"
                    />
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* KTB Section */}
          <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="space-y-2">
              <Label className="text-base">Apakah anda sudah ber-KTB (Kelompok Tumbuh Bersama)? <RequiredAsterisk /></Label>
              <RadioGroup 
                value={formData.isInKTB ? "Ya" : "Tidak"} 
                onValueChange={(val) => setFormData({ 
                  ...formData, 
                  isInKTB: val === "Ya",
                  ktbName: val === "Tidak" ? '' : (formData.ktbName || ''),
                  ktbLeader: val === "Tidak" ? '' : (formData.ktbLeader || ''),
                  isWillingToJoinKTB: val === "Ya" ? false : (formData.isWillingToJoinKTB ?? false)
                })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Ya" id="ktb-yes" />
                  <Label htmlFor="ktb-yes">Ya</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Tidak" id="ktb-no" />
                  <Label htmlFor="ktb-no">Tidak</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.isInKTB ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-blue-200"
              >
                <div className="space-y-2">
                  <Label htmlFor="ktbName">Nama KTB <RequiredAsterisk /></Label>
                  <Input 
                    id="ktbName" 
                    value={formData.ktbName || ''} 
                    onChange={e => setFormData({ ...formData, ktbName: e.target.value })}
                    placeholder="mis. KTB SYALOM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ktbLeader">Pemimpin KTB <RequiredAsterisk /></Label>
                  <Input 
                    id="ktbLeader" 
                    value={formData.ktbLeader || ''} 
                    onChange={e => setFormData({ ...formData, ktbLeader: e.target.value })}
                    placeholder="mis. Semy Salaka, S.T."
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2 pt-2 border-t border-blue-200"
              >
                <Label className="text-sm font-semibold">Apakah anda bersedia bergabung di dalam KTB? <RequiredAsterisk /></Label>
                <RadioGroup 
                  value={formData.isWillingToJoinKTB === true ? "Ya" : formData.isWillingToJoinKTB === false ? "Tidak" : ""} 
                  onValueChange={(val) => setFormData({ ...formData, isWillingToJoinKTB: val === "Ya" })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Ya" id="join-ktb-yes" />
                    <Label htmlFor="join-ktb-yes">Ya</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Tidak" id="join-ktb-no" />
                    <Label htmlFor="join-ktb-no">Tidak</Label>
                  </div>
                </RadioGroup>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {isEdit ? (
          <Button type="button" variant="outline" className="flex-1 h-12 text-lg font-semibold" onClick={onCancel}>
            Batal
          </Button>
        ) : (
          <Button type="button" variant="outline" className="flex-1 h-12 text-lg font-semibold border-slate-200 text-slate-500" onClick={handleReset}>
            Reset Formulir
          </Button>
        )}
        <Button type="submit" className="flex-[2] h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : isEdit ? 'Perbarui Data' : 'Simpan Data Alumni'}
          <Save className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className={cn(
        "border-none shadow-xl bg-white/80 backdrop-blur-md",
        isEdit && "shadow-none bg-transparent backdrop-blur-none p-0"
      )}>
        {!isEdit && (
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-800 leading-snug">
              Mari ambil bagian dalam pelayanan alumni Kristen di Kota Ambon dengan mengisi data alumni. Bersama, kita saling terhubung dan menjadi berkat.
            </CardTitle>
            <CardDescription className="text-slate-600 text-sm italic">
              “Dan marilah kita saling memperhatikan supaya kita saling mendorong dalam kasih dan dalam pekerjaan baik. Janganlah kita menjauhkan diri dari pertemuan-pertemuan ibadah kita…” <br />
              <span className="font-bold">Ibrani 10:24-25</span>
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={cn(isEdit ? "p-0" : "p-6")}>
          {isEdit ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {renderForm()}
            </form>
          ) : isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 space-y-6"
            >
              <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <Save className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">Berhasil!</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Data Anda telah berhasil disimpan di Database Alumni PAK Kota Ambon.
                  </p>
                </div>

                {formData.password && (
                  <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-2xl max-w-sm mx-auto space-y-3">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Password Alumni Anda</p>
                    <div className="text-3xl font-mono font-bold text-blue-900 tracking-wider">
                      {formData.password}
                    </div>
                    <p className="text-xs text-blue-500 italic">
                      *Simpan password ini untuk melakukan pembaruan data di masa mendatang.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => {
                    setIsSuccess(false);
                    setFlowState(mode === 'admin' ? 'register' : 'select');
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {mode === 'admin' ? 'Tambah Alumni Lagi' : 'Kembali ke Menu Utama'}
                </Button>
                {mode === 'admin' && (
                  <Button variant="outline" onClick={onComplete}>
                    Selesai
                  </Button>
                )}
              </div>
            </motion.div>
          ) : flowState === 'select' ? (
            <div className="py-8 space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Pilih Jenis Pendaftaran</h3>
                <p className="text-slate-500">Apakah Anda baru pertama kali mendaftar atau ingin memperbarui data?</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => setFlowState('register')}
                  className="group p-8 rounded-3xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50/50 transition-all text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-blue-600 transition-colors">
                    <UserPlus className="w-8 h-8 text-blue-600 group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">Daftar Baru</h4>
                    <p className="text-sm text-slate-500">Belum pernah mengisi data alumni sebelumnya</p>
                  </div>
                </button>

                <button 
                  onClick={() => setFlowState('verify')}
                  className="group p-8 rounded-3xl border-2 border-slate-100 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-emerald-600 transition-colors">
                    <History className="w-8 h-8 text-emerald-600 group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">Update Data</h4>
                    <p className="text-sm text-slate-500">Sudah pernah mendaftar dan ingin mengubah data</p>
                  </div>
                </button>
              </div>
            </div>
          ) : flowState === 'verify' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto py-8 space-y-6"
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Verifikasi Data Alumni</h3>
                <p className="text-sm text-slate-500">Masukkan Password Alumni yang Anda tentukan saat mendaftar</p>
              </div>

              {verificationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{verificationError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Password Alumni</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                      type={showVerificationPassword ? "text" : "password"}
                      placeholder="Masukkan password Anda"
                      className="pl-10 pr-10"
                      value={verificationData.code}
                      onChange={e => setVerificationData({...verificationData, code: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowVerificationPassword(!showVerificationPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showVerificationPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    *Gunakan password yang Anda buat saat pertama kali mendaftar.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setFlowState('select')}
                  >
                    Kembali
                  </Button>
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={handleVerify}
                    disabled={isVerifying}
                  >
                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Cari Data
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {flowState === 'update' && (
                <Alert className="mb-6 bg-blue-50 border-blue-200">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Data Ditemukan</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Silakan perbarui informasi Anda pada formulir di bawah ini.
                  </AlertDescription>
                </Alert>
              )}
              {showError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6"
                >
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Data Belum Lengkap</AlertTitle>
                    <AlertDescription>
                      Mohon lengkapi semua kolom yang bertanda bintang (*) sebelum menyimpan data.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
              {submitError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6"
                >
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Gagal Menyimpan</AlertTitle>
                    <AlertDescription>
                      {submitError}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
              <form onSubmit={handleSubmit} className="space-y-8">
                {renderForm()}
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Tinjau Data Anda
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Silakan periksa kembali data Anda sebelum dikirim ke sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-slate-400 block">Nama Lengkap</span>
                <span className="font-medium text-slate-900">{formData.fullName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block">Jenis Kelamin</span>
                <span className="font-medium text-slate-900">{formData.gender}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block">Kontak</span>
                <span className="font-medium text-slate-900">{formData.phone} / {formData.email}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block">Pekerjaan</span>
                <span className="font-medium text-slate-900">{formData.mainJob} {formData.jobDetail ? `(${formData.jobDetail})` : ''}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block">Password Alumni</span>
                <span className="font-medium text-blue-600 font-mono">{formData.password}</span>
              </div>
              {formData.updatedAt && (
                <div className="space-y-1">
                  <span className="text-slate-400 block">Tanggal Data Update</span>
                  <span className="font-medium text-slate-900">
                    {new Date(formData.updatedAt).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              <div className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 block">Alamat Domisili</span>
                <span className="font-medium text-slate-900">{formData.address}, {formData.city}, {formData.province}</span>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 block">Bidang Keahlian</span>
                <span className="font-medium text-slate-900">{formData.skills?.join(', ')} {formData.otherSkill ? `(${formData.otherSkill})` : ''}</span>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 block">Kesediaan Melayani</span>
                <span className="font-medium text-slate-900">
                  {formData.isWillingToServe ? `Ya (${formData.serviceInterests?.join(', ')}${formData.otherServiceInterest ? `, ${formData.otherServiceInterest}` : ''})` : 'Tidak'}
                </span>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <span className="text-slate-400 block">Status KTB (Kelompok Tumbuh Bersama)</span>
                <span className="font-medium text-slate-900">
                  {formData.isInKTB 
                    ? `Sudah Ber-KTB (Nama: ${formData.ktbName}, Pemimpin: ${formData.ktbLeader})` 
                    : `Belum Ber-KTB (${formData.isWillingToJoinKTB ? 'Bersedia Bergabung' : 'Belum Bersedia Bergabung'})`
                  }
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Riwayat Pendidikan</span>
              <div className="space-y-2">
                {formData.educations?.map((edu, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm space-y-1">
                    <div className="font-bold text-blue-700">{edu.level} - {edu.major}</div>
                    <div className="flex justify-between text-slate-600">
                      <span>{edu.institution}</span>
                      <span className="text-xs">Lulus {edu.graduationYear}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <AlertDialogFooter className="gap-2 pt-4 border-t">
            <AlertDialogCancel className="border-slate-200 text-slate-600">Perbaiki Data</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFinalSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Ya, Kirim Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
