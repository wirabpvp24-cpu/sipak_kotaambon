import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search, User, Mail, Phone, GraduationCap, MapPin, Eye, EyeOff, Calendar, Briefcase, Heart, Globe, Filter, Edit, Trash2, Users, ArrowUpDown, Download, Plus, Lock, Sparkles, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RegistrationForm from './RegistrationForm';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alumni, getAlumniCategory, AlumniCategory } from '@/types';
import { dbService } from '@/lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = [
  { value: 'all', label: 'Semua Bulan Lahir' },
  { value: '0', label: 'Januari' },
  { value: '1', label: 'Februari' },
  { value: '2', label: 'Maret' },
  { value: '3', label: 'April' },
  { value: '4', label: 'Mei' },
  { value: '5', label: 'Juni' },
  { value: '6', label: 'Juli' },
  { value: '7', label: 'Agustus' },
  { value: '8', label: 'September' },
  { value: '9', label: 'Oktober' },
  { value: '10', label: 'November' },
  { value: '11', label: 'Desember' },
];

function DetailItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="space-y-0.5">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

type SortOrder = 'newest' | 'oldest' | 'birth-youngest' | 'birth-oldest' | 'name-asc' | 'name-desc';

// Helper to parse date strings that might be in DD/MM/YYYY or YYYY-MM-DD format
function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    return new Date(`${y}-${m}-${d}`);
  }
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date(0) : date;
}

// Helper to format date strings that might be in DD/MM/YYYY or YYYY-MM-DD format
function formatDisplayDate(dateStr: string) {
  if (!dateStr) return '-';
  
  // If it's already DD/MM/YYYY, just return it
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  
  // If it's YYYY-MM-DD, convert to DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  
  // Fallback to native Date if possible
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  } catch (e) {
    // ignore
  }
  
  return dateStr;
}

// Helper for long date format (e.g. 31 Desember 1990)
function formatLongDate(dateStr: string) {
  if (!dateStr) return '-';
  
  let date: Date;
  
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    date = new Date(`${y}-${m}-${d}`);
  } else {
    date = new Date(dateStr);
  }
  
  if (isNaN(date.getTime())) return dateStr;
  
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AlumniList() {
  const [alumniList, setAlumniList] = useState<Alumni[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('name-asc');
  const [loading, setLoading] = useState(true);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [editingAlumni, setEditingAlumni] = useState<Alumni | null>(null);
  const [isAddingAlumni, setIsAddingAlumni] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = dbService.subscribeAlumni((data) => {
      setAlumniList(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const exportToCSV = () => {
    if (alumniList.length === 0) return;

    // Define headers
    const headers = [
      'Nama Lengkap',
      'Jenis Kelamin',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Email',
      'No. HP',
      'Status Pernikahan',
      'Pekerjaan Utama',
      'Detail Pekerjaan',
      'Tempat Kerja',
      'Alamat',
      'Kota',
      'Provinsi',
      'Bidang Keahlian',
      'Keahlian Lainnya',
      'Bersedia Melayani',
      'Minat Pelayanan',
      'Minat Pelayanan Lainnya',
      'Status KTB',
      'Nama KTB',
      'Pemimpin KTB',
      'Bersedia Gabung KTB',
      'Riwayat Pendidikan Lengkap',
      'Pendidikan Terakhir',
      'Program Studi Terakhir',
      'Tahun Lulus Terakhir',
      'Institusi Terakhir',
      'Tanggal Pendaftaran'
    ];

    // Map data to rows
    const rows = alumniList.map(alumni => {
      const sortedEducations = [...alumni.educations].sort((a, b) => b.graduationYear - a.graduationYear);
      const lastEdu = sortedEducations[0];
      const allEducations = sortedEducations.map(edu => 
        `${edu.level} - ${edu.major} - ${edu.institution} (${edu.graduationYear})`
      ).join(' | ');

      return [
        `"${alumni.fullName}"`,
        `"${alumni.gender}"`,
        `"${alumni.birthPlace}"`,
        `"${alumni.birthDate}"`,
        `"${alumni.email}"`,
        `"${alumni.phone}"`,
        `"${alumni.maritalStatus}"`,
        `"${alumni.mainJob}"`,
        `"${alumni.jobDetail || ''}"`,
        `"${alumni.workPlace || ''}"`,
        `"${alumni.address.replace(/"/g, '""')}"`,
        `"${alumni.city}"`,
        `"${alumni.province}"`,
        `"${(alumni.skills || []).join(', ')}"`,
        `"${alumni.otherSkill || ''}"`,
        `"${alumni.isWillingToServe ? 'Ya' : 'Tidak'}"`,
        `"${(alumni.serviceInterests || []).join(', ')}"`,
        `"${alumni.otherServiceInterest || ''}"`,
        `"${alumni.isInKTB ? 'Sudah' : 'Belum'}"`,
        `"${alumni.ktbName || ''}"`,
        `"${alumni.ktbLeader || ''}"`,
        `"${alumni.isWillingToJoinKTB ? 'Ya' : 'Tidak'}"`,
        `"${allEducations}"`,
        `"${lastEdu?.level || ''}"`,
        `"${lastEdu?.major || ''}"`,
        `"${lastEdu?.graduationYear || ''}"`,
        `"${lastEdu?.institution || ''}"`,
        `"${alumni.createdAt ? new Date(alumni.createdAt).toLocaleString('id-ID', { hour12: false }) : ''}"`
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `data_alumni_sipak_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (filteredAlumni.length === 0) return;

    const doc = new jsPDF('l', 'mm', 'a4'); // Change to landscape
    const dateStr = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    // Header
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Laporan Ringkasan Data Alumni', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Persekutuan Alumni Kristen Kota Ambon, Perkantas Maluku', 14, 30);
    doc.text(`Tanggal Laporan: ${dateStr}`, 14, 37);

    // Summary Stats
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Ringkasan Statistik', 14, 50);

    const juniorCount = filteredAlumni.filter(a => {
      const firstGrad = Math.min(...a.educations.map(e => e.graduationYear));
      return getAlumniCategory(firstGrad) === 'Junior';
    }).length;
    const madyaCount = filteredAlumni.filter(a => {
      const firstGrad = Math.min(...a.educations.map(e => e.graduationYear));
      return getAlumniCategory(firstGrad) === 'Madya';
    }).length;
    const seniorCount = filteredAlumni.filter(a => {
      const firstGrad = Math.min(...a.educations.map(e => e.graduationYear));
      return getAlumniCategory(firstGrad) === 'Senior';
    }).length;

    autoTable(doc, {
      startY: 55,
      head: [['Kategori', 'Jumlah Alumni']],
      body: [
        ['Alumni Junior', juniorCount.toString()],
        ['Alumni Madya', madyaCount.toString()],
        ['Alumni Senior', seniorCount.toString()],
        ['Total Terfilter', filteredAlumni.length.toString()],
        ['Total Keseluruhan', alumniList.length.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }, // blue-600
      margin: { left: 14 },
      tableWidth: 100
    });

    // Detailed Table
    doc.setFontSize(14);
    doc.text('Daftar Alumni', 14, (doc as any).lastAutoTable.finalY + 15);

    const tableData = filteredAlumni.map((a, index) => {
      const firstGrad = Math.min(...a.educations.map(e => e.graduationYear));
      const category = getAlumniCategory(firstGrad);
      const lastEdu = [...a.educations].sort((a, b) => b.graduationYear - a.graduationYear)[0];
      const ttl = `${a.birthPlace}, ${formatLongDate(a.birthDate)}`;
      const kontak = `${a.email}\n${a.phone}`;
      
      return [
        (index + 1).toString(),
        a.fullName,
        category,
        ttl,
        `${lastEdu?.level} (${lastEdu?.graduationYear})`,
        a.mainJob,
        kontak,
        a.address
      ];
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['No.', 'Nama Lengkap', 'Kategori', 'TTL', 'Pendidikan', 'Pekerjaan', 'Kontak', 'Alamat']],
      body: tableData,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42] }, // slate-900
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
        3: { cellWidth: 40 },
        4: { cellWidth: 25 },
        5: { cellWidth: 35 },
        6: { cellWidth: 45 },
        7: { cellWidth: 65 },
      }
    });

    doc.save(`laporan_alumni_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredAlumni = alumniList.filter(alumni => {
    const matchesSearch = alumni.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const graduationYears = (alumni.educations || []).map(e => e.graduationYear).filter(y => y > 0);
    const firstGrad = graduationYears.length > 0 ? Math.min(...graduationYears) : new Date().getFullYear();
    const category = getAlumniCategory(firstGrad);
    const matchesCategory = categoryFilter === 'all' || category === categoryFilter;
    
    const matchesCity = cityFilter === 'all' || alumni.city === cityFilter;

    const birthMonth = parseDate(alumni.birthDate).getMonth().toString();
    const matchesMonth = monthFilter === 'all' || birthMonth === monthFilter;

    return matchesSearch && matchesCategory && matchesCity && matchesMonth;
  }).sort((a, b) => {
    if (sortOrder === 'name-asc') return a.fullName.localeCompare(b.fullName);
    if (sortOrder === 'name-desc') return b.fullName.localeCompare(a.fullName);
    
    if (sortOrder === 'birth-youngest' || sortOrder === 'birth-oldest') {
      const yearA = parseDate(a.birthDate).getFullYear();
      const yearB = parseDate(b.birthDate).getFullYear();
      return sortOrder === 'birth-youngest' ? yearB - yearA : yearA - yearB;
    }
    
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const uniqueCities = Array.from(new Set(alumniList.map(a => a.city))).sort();

  if (loading && alumniList.length === 0) return <div className="flex items-center justify-center h-64">Memuat Data Alumni...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Data Alumni</h1>
          <p className="text-slate-500">Daftar seluruh alumni PAK Kota Ambon yang terdaftar</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsAddingAlumni(true)}
            className="bg-biru-abu hover:bg-biru-abu/90 text-white gap-2 shadow-lg shadow-abu-muda"
          >
            <Plus className="w-4 h-4" />
            Tambah Alumni
          </Button>
          <Button 
            onClick={exportToCSV}
            variant="outline"
            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 gap-2"
          >
            <Download className="w-4 h-4" />
            Ekspor ke Excel (CSV)
          </Button>
          <Button 
            onClick={exportToPDF}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50 gap-2"
          >
            <Download className="w-4 h-4" />
            Ekspor ke PDF
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Cari Nama Alumni..." 
            className="pl-9 h-9 border-none bg-slate-50 focus-visible:ring-1 focus-visible:ring-biru-abu"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="h-6 w-px bg-slate-200 hidden md:block" />

        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 border-none bg-slate-50 w-[180px] focus:ring-1 focus:ring-biru-abu">
              <div className="flex items-center gap-2 text-slate-600">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">Kategori:</span>
                <SelectValue placeholder="Semua Kategori" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="Junior">Junior (&lt; 5 thn)</SelectItem>
              <SelectItem value="Madya">Madya (5-15 thn)</SelectItem>
              <SelectItem value="Senior">Senior (&gt; 15 thn)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="h-9 border-none bg-slate-50 w-[180px] focus:ring-1 focus:ring-biru-abu">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">Kota:</span>
                <SelectValue placeholder="Kota Domisili" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {uniqueCities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="h-9 border-none bg-slate-50 w-[180px] focus:ring-1 focus:ring-biru-abu">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">Bulan:</span>
                <SelectValue placeholder="Bulan Lahir" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map(month => (
                <SelectItem key={month.value} value={month.value}>{month.value === 'all' ? 'Semua' : month.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(v: SortOrder) => setSortOrder(v)}>
            <SelectTrigger className="h-9 border-none bg-slate-50 w-[180px] focus:ring-1 focus:ring-biru-abu">
              <div className="flex items-center gap-2 text-slate-600">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">Urut:</span>
                <SelectValue placeholder="Urutan" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Nama (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nama (Z-A)</SelectItem>
              <SelectItem value="newest">Pendaftaran Terbaru</SelectItem>
              <SelectItem value="oldest">Pendaftaran Terlama</SelectItem>
              <SelectItem value="birth-youngest">Usia Termuda</SelectItem>
              <SelectItem value="birth-oldest">Usia Tertua</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            setSearchTerm('');
            setCategoryFilter('all');
            setCityFilter('all');
          }} 
          className="text-slate-400 hover:text-biru-abu h-9 px-3"
        >
          Reset
        </Button>
      </div>

      <Card className="border-none shadow-lg overflow-hidden">
        <ScrollArea className="h-[650px]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[50px] bg-slate-50">No.</TableHead>
                  <TableHead className="w-[180px] bg-slate-50">Nama Lengkap</TableHead>
                  <TableHead className="bg-slate-50">Kategori</TableHead>
                  <TableHead className="bg-slate-50">TTL</TableHead>
                  <TableHead className="bg-slate-50">Pendidikan Terakhir</TableHead>
                  <TableHead className="bg-slate-50">Pekerjaan</TableHead>
                  <TableHead className="bg-slate-50">Kontak</TableHead>
                  <TableHead className="bg-slate-50">Domisili</TableHead>
                  <TableHead className="text-right bg-slate-50 pr-8">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlumni.length > 0 ? (
                  filteredAlumni.map((alumni, index) => {
                    const graduationYears = (alumni.educations || []).map(e => e.graduationYear).filter(y => y > 0);
                    const firstGrad = graduationYears.length > 0 ? Math.min(...graduationYears) : new Date().getFullYear();
                    const category = getAlumniCategory(firstGrad);
                    const lastEdu = [...(alumni.educations || [])].sort((a, b) => b.graduationYear - a.graduationYear)[0];
                    
                    return (
                      <TableRow key={alumni.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="text-slate-400 font-mono text-xs">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="truncate max-w-[150px]">{alumni.fullName}</span>
                            <span className="text-xs text-slate-400 font-normal">{alumni.gender}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "font-medium border-transparent",
                              category === 'Senior' ? "bg-orange-100 text-orange-700" : 
                              category === 'Madya' ? "bg-emerald-100 text-emerald-700" : 
                              "bg-abu-muda text-biru-abu"
                            )}
                          >
                            {category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span>{alumni.birthPlace}</span>
                            <span className="text-xs text-slate-500">
                              {formatDisplayDate(alumni.birthDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="font-semibold text-biru-abu">{lastEdu?.level} ({lastEdu?.graduationYear})</span>
                            <span className="text-xs text-slate-500 truncate max-w-[150px]">{lastEdu?.institution}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="font-medium text-slate-700">{alumni.mainJob}</span>
                            <span className="text-xs text-slate-500 truncate max-w-[150px]">{alumni.workPlace || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs gap-1">
                            <div className="flex items-center gap-1 text-slate-600">
                              <Mail className="w-3 h-3" /> {alumni.email}
                            </div>
                            <div className="flex items-center gap-1 text-slate-600">
                              <Phone className="w-3 h-3" /> {alumni.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{alumni.city}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2 text-biru-abu border-abu-muda hover:bg-abu-muda" 
                              onClick={() => setSelectedAlumni(alumni)}
                            >
                              <Eye className="w-4 h-4" /> Detil
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                      Tidak ada data alumni ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </Card>

      {/* Detail Dialog - Outside the loop */}
      <Dialog open={!!selectedAlumni} onOpenChange={(open) => {
        if (!open) {
          setSelectedAlumni(null);
          setShowPassword(false);
        }
      }}>
        <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 border-b bg-white sticky top-0 z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900">
                  <Eye className="w-6 h-6 text-biru-abu" />
                  Detail Alumni
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  Informasi lengkap data alumni yang tersimpan dalam sistem.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-biru-abu border-abu-muda hover:bg-abu-muda"
                  onClick={() => {
                    const alumniToEdit = selectedAlumni;
                    setSelectedAlumni(null);
                    setTimeout(() => setEditingAlumni(alumniToEdit), 100);
                  }}
                >
                  <Edit className="w-4 h-4" /> Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Delete Confirmation Overlay */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
              <div className="max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Hapus Data?</h3>
                  <p className="text-slate-500">
                    Apakah Anda yakin ingin menghapus data <strong>{selectedAlumni?.fullName}</strong>? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Batal
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    disabled={isDeleting}
                    onClick={async () => {
                      if (selectedAlumni) {
                        setIsDeleting(true);
                        try {
                          await dbService.deleteAlumni(selectedAlumni.id);
                          setShowDeleteConfirm(false);
                          setSelectedAlumni(null);
                        } catch (error) {
                          console.error("Delete failed:", error);
                        } finally {
                          setIsDeleting(false);
                        }
                      }
                    }}
                  >
                    {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6">
              {selectedAlumni && (
                <div className="space-y-8">
                  {/* Hero Section */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-br from-abu-muda to-white p-6 rounded-2xl border border-abu-muda">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-biru-abu rounded-2xl flex items-center justify-center shadow-lg shadow-abu-muda">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-bold text-slate-900">{selectedAlumni.fullName}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-white/50 border-abu-muda text-biru-abu">
                            {selectedAlumni.gender}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "px-3 border-transparent",
                              (selectedAlumni.educations && selectedAlumni.educations.length > 0) ? (
                                getAlumniCategory(Math.min(...selectedAlumni.educations.map(e => e.graduationYear))) === 'Senior' ? "bg-orange-100 text-orange-700" : 
                                getAlumniCategory(Math.min(...selectedAlumni.educations.map(e => e.graduationYear))) === 'Madya' ? "bg-emerald-100 text-emerald-700" : 
                                "bg-abu-muda text-biru-abu"
                              ) : "bg-slate-100 text-slate-700"
                            )}
                          >
                            Alumni {(selectedAlumni.educations && selectedAlumni.educations.length > 0) ? getAlumniCategory(Math.min(...selectedAlumni.educations.map(e => e.graduationYear))) : 'Baru'}
                          </Badge>
                          {selectedAlumni.password && (
                            <Badge 
                              variant="outline" 
                              className="bg-abu-muda border-abu-muda text-biru-abu gap-1 cursor-pointer hover:bg-abu-muda transition-colors"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              <Lock className="w-3 h-3" /> 
                              PW: {showPassword ? selectedAlumni.password : '••••••••'}
                              {showPassword ? <EyeOff className="w-3 h-3 ml-1" /> : <Eye className="w-3 h-3 ml-1" />}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Terdaftar Sejak</p>
                      <p className="text-sm font-bold text-slate-700">
                        {new Date(selectedAlumni.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Data Pribadi */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        Informasi Pribadi
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        <DetailItem label="Tempat, Tanggal Lahir" value={`${selectedAlumni.birthPlace}, ${formatLongDate(selectedAlumni.birthDate)}`} icon={<Calendar className="w-4 h-4" />} />
                        <DetailItem label="Status Pernikahan" value={selectedAlumni.maritalStatus} icon={<Users className="w-4 h-4" />} />
                        <DetailItem label="Pekerjaan Utama" value={selectedAlumni.mainJob} icon={<Briefcase className="w-4 h-4" />} />
                        {selectedAlumni.jobDetail && (
                          <DetailItem label="Detail Pekerjaan" value={selectedAlumni.jobDetail} icon={<Briefcase className="w-4 h-4" />} />
                        )}
                        {selectedAlumni.workPlace && (
                          <DetailItem label="Tempat Bekerja" value={selectedAlumni.workPlace} icon={<Briefcase className="w-4 h-4" />} />
                        )}
                        {selectedAlumni.updatedAt && (
                          <DetailItem 
                            label="Tanggal Data Update" 
                            value={new Date(selectedAlumni.updatedAt).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} 
                            icon={<History className="w-4 h-4" />} 
                          />
                        )}
                      </div>
                    </div>

                    {/* Kontak & Alamat */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                        <Globe className="w-5 h-5 text-blue-500" />
                        Kontak & Domisili
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        <DetailItem label="Email" value={selectedAlumni.email} icon={<Mail className="w-4 h-4" />} />
                        <DetailItem label="Nomor Handphone" value={selectedAlumni.phone} icon={<Phone className="w-4 h-4" />} />
                        <DetailItem label="Alamat Lengkap" value={selectedAlumni.address} icon={<MapPin className="w-4 h-4" />} />
                        <DetailItem label="Kota/Provinsi" value={`${selectedAlumni.city}, ${selectedAlumni.province}`} icon={<Globe className="w-4 h-4" />} />
                      </div>
                    </div>

                    {/* Minat & Potensi */}
                    <div className="space-y-4 md:col-span-2">
                      <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        Minat & Potensi
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="space-y-3">
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Bidang Keahlian</p>
                          <div className="flex flex-wrap gap-2">
                            {(selectedAlumni.skills || []).map(skill => (
                              <Badge key={skill} variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100">
                                {skill}
                              </Badge>
                            ))}
                            {selectedAlumni.otherSkill && (
                              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100">
                                {selectedAlumni.otherSkill}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Kesediaan Melayani</p>
                          <div className="flex items-center gap-2">
                            <Badge className={selectedAlumni.isWillingToServe ? "bg-emerald-600" : "bg-slate-400"}>
                              {selectedAlumni.isWillingToServe ? "Ya, Bersedia" : "Tidak Bersedia"}
                            </Badge>
                          </div>
                          {selectedAlumni.isWillingToServe && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Minat Pelayanan</p>
                              <div className="flex flex-wrap gap-2">
                                {(selectedAlumni.serviceInterests || []).map(service => (
                                  <Badge key={service} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                    {service}
                                  </Badge>
                                ))}
                                {selectedAlumni.otherServiceInterest && (
                                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                                    {selectedAlumni.otherServiceInterest}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Informasi KTB</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={selectedAlumni.isInKTB ? "bg-blue-600" : "bg-slate-400"}>
                                {selectedAlumni.isInKTB ? "Sudah ber-KTB" : "Belum ber-KTB"}
                              </Badge>
                            </div>
                            {selectedAlumni.isInKTB ? (
                              <div className="space-y-1">
                                <p className="text-xs text-slate-500"><span className="font-bold">Nama KTB:</span> {selectedAlumni.ktbName || '-'}</p>
                                <p className="text-xs text-slate-500"><span className="font-bold">Pemimpin:</span> {selectedAlumni.ktbLeader || '-'}</p>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-slate-500 font-bold">Bersedia Gabung:</p>
                                <Badge variant="outline" className={selectedAlumni.isWillingToJoinKTB ? "border-emerald-500 text-emerald-600" : "border-red-500 text-red-600"}>
                                  {selectedAlumni.isWillingToJoinKTB ? "Ya" : "Tidak"}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Riwayat Pendidikan */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
                      <GraduationCap className="w-5 h-5 text-indigo-500" />
                      Riwayat Pendidikan
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(selectedAlumni.educations || []).sort((a,b) => b.graduationYear - a.graduationYear).map((edu, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                              {edu.level}
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 font-medium">Tahun Lulus</p>
                              <p className="font-bold text-slate-900">{edu.graduationYear}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-blue-700">{edu.major}</p>
                            <p className="text-xs font-medium text-slate-500 line-clamp-2">{edu.institution}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 border-t bg-slate-50 flex justify-end">
            <Button variant="outline" onClick={() => setSelectedAlumni(null)}>Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Outside the loop */}
      <Dialog open={!!editingAlumni} onOpenChange={(open) => !open && setEditingAlumni(null)}>
        <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 border-b bg-white sticky top-0 z-10">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900">
              <Edit className="w-6 h-6 text-blue-600" />
              Edit Data Alumni
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Perbarui informasi alumni. Pastikan data yang dimasukkan sudah benar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6">
              {editingAlumni && (
                <RegistrationForm 
                  initialData={editingAlumni} 
                  onComplete={() => {
                    setEditingAlumni(null);
                  }}
                  onCancel={() => setEditingAlumni(null)}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Alumni Dialog */}
      <Dialog open={isAddingAlumni} onOpenChange={setIsAddingAlumni}>
        <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 border-b bg-white sticky top-0 z-10">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900">
              <Plus className="w-6 h-6 text-blue-600" />
              Tambah Alumni Baru
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Masukkan data alumni baru secara manual. Kode unik akan digenerate otomatis.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6">
              {isAddingAlumni && (
                <RegistrationForm 
                  mode="admin"
                  onComplete={() => {
                    setIsAddingAlumni(false);
                  }}
                  onCancel={() => setIsAddingAlumni(false)}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

