import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Save, User, Phone, Mail, MapPin, Briefcase, GraduationCap, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const EDUCATION_LEVELS: EducationLevel[] = ['DIII', 'DIV', 'S1', 'S2', 'S3'];
const MAIN_JOBS: MainJob[] = ['Pegawai Swasta', 'Wiraswasta', 'Tenaga Medis', 'Pendidik', 'TNI/Polri', 'PNS', 'BUMN/BUMD', 'Pensiunan', 'Lainnya'];

export default function RegistrationForm({ 
  onComplete, 
  initialData, 
  onCancel 
}: { 
  onComplete: () => void;
  initialData?: Alumni;
  onCancel?: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Alumni>>(() => {
    if (initialData) {
      // Sort educations from lowest to highest level based on EDUCATION_LEVELS order
      const sortedEducations = initialData.educations ? [...initialData.educations].sort((a, b) => {
        return EDUCATION_LEVELS.indexOf(a.level) - EDUCATION_LEVELS.indexOf(b.level);
      }) : [];
      
      return {
        ...initialData,
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
      educations: [{ level: 'S1', graduationYear: new Date().getFullYear(), institution: '' }],
      mainJob: 'Pegawai Swasta',
      jobDetail: '',
      workPlace: '',
      address: '',
      province: '',
      city: '',
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provinces, setProvinces] = useState<{ id: string, name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string, name: string }[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [showError, setShowError] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isEdit = !!initialData;

  const emptyForm: Partial<Alumni> = {
    fullName: '',
    gender: 'Laki-laki',
    birthPlace: '',
    birthDate: '',
    phone: '',
    email: '',
    maritalStatus: 'Lajang',
    educations: [{ level: 'S1', graduationYear: new Date().getFullYear(), institution: '' }],
    mainJob: 'Pegawai Swasta',
    jobDetail: '',
    workPlace: '',
    address: '',
    province: '',
    city: '',
  };

  const handleReset = () => {
    setFormData(emptyForm);
    setShowError(false);
  };

  const RequiredAsterisk = () => <span className="text-red-500 ml-1">*</span>;

  // Fetch Provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        const data = await response.json();
        setProvinces(data);
      } catch (error) {
        console.error('Error fetching provinces:', error);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch Cities when Province changes
  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.province) {
        setCities([]);
        return;
      }

      // Find province ID from name
      const province = provinces.find(p => p.name === formData.province);
      if (!province) return;

      setIsLoadingCities(true);
      try {
        const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${province.id}.json`);
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, [formData.province, provinces]);

  const handleAddEducation = () => {
    setFormData(prev => ({
      ...prev,
      educations: [...(prev.educations || []), { level: 'S1', graduationYear: new Date().getFullYear(), institution: '' }]
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
    const requiredFields = ['fullName', 'birthPlace', 'birthDate', 'phone', 'email', 'address', 'province', 'city', 'mainJob'];
    const hasEmptyFields = requiredFields.some(field => !formData[field as keyof Alumni]) || 
                          formData.educations?.some(edu => !edu.institution);

    if (hasEmptyFields) {
      setShowError(true);
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
    try {
      if (isEdit) {
        await dbService.updateAlumni({
          ...formData,
        } as Alumni);
        onComplete();
      } else {
        await dbService.addAlumni(formData as Alumni);
        setIsSuccess(true);
        setFormData(emptyForm);
        // We don't call onComplete immediately for public users so they see the success message
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      setSubmitError(error.message || "Gagal menyimpan data. Silakan periksa koneksi internet Anda atau coba lagi nanti.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">SIPAK KOTA AMBON</CardTitle>
            <CardDescription className="text-slate-500 text-lg">
              Pendaftaran Database Alumni PAK Kota Ambon
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={cn(isEdit ? "p-0" : "p-6")}>
          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 space-y-6"
            >
              <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <Save className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">Pendaftaran Berhasil!</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Terima kasih telah memperbarui data Anda di Database Alumni PAK Kota Ambon. Data Anda telah tersimpan dengan aman.
                </p>
              </div>
              <Button 
                onClick={() => setIsSuccess(false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Isi Formulir Baru
              </Button>
            </motion.div>
          ) : (
            <>
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
              <form onSubmit={handleSubmit} className={cn("space-y-8", isEdit && "space-y-6")}>
                {/* ... existing form content ... */}
                {/* I will replace the whole form block to ensure correct nesting */}
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
                        type="date" 
                        required 
                        value={formData.birthDate} 
                        onChange={e => setFormData({...formData, birthDate: e.target.value})}
                      />
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
                        value={formData.jobDetail} 
                        onChange={e => setFormData({...formData, jobDetail: e.target.value})}
                        placeholder="Mis. Guru Matematika, Manager IT, dsb"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workPlace">Tempat Bekerja (Opsional)</Label>
                      <Input 
                        id="workPlace" 
                        value={formData.workPlace} 
                        onChange={e => setFormData({...formData, workPlace: e.target.value})}
                        placeholder="Nama Perusahaan / Instansi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Provinsi Domisili <RequiredAsterisk /></Label>
                      <Select 
                        value={formData.province} 
                        onValueChange={(v) => setFormData({...formData, province: v, city: ''})}
                        disabled={isLoadingProvinces}
                      >
                        <SelectTrigger id="province">
                          <SelectValue placeholder={isLoadingProvinces ? "Memuat..." : "Pilih Provinsi"} />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map(p => (
                            <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Kabupaten/Kota Domisili <RequiredAsterisk /></Label>
                      <Select 
                        value={formData.city} 
                        onValueChange={(v) => setFormData({...formData, city: v})}
                        disabled={isLoadingCities || !formData.province}
                      >
                        <SelectTrigger id="city">
                          <SelectValue placeholder={isLoadingCities ? "Memuat..." : !formData.province ? "Pilih provinsi dulu" : "Pilih Kota/Kab"} />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map(c => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
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
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-900">Konfirmasi Data</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Apakah Anda yakin data yang dimasukkan sudah benar? Pastikan Nama, Nomor HP, dan Email sudah sesuai sebelum menyimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-slate-200 text-slate-600">Periksa Kembali</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFinalSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Ya, Simpan Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
