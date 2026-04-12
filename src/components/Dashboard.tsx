import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, GraduationCap, Award, UserCheck, UserPlus, PieChart as PieChartIcon, BarChart as BarChartIcon, Briefcase, Bell, Cake, MapPin, Sparkles, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alumni, getAlumniCategory } from '@/types';
import { dbService } from '@/lib/db';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'];

export default function Dashboard() {
  const [alumniList, setAlumniList] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [majorLevelFilter, setMajorLevelFilter] = useState<string>('S1');

  useEffect(() => {
    const fetchData = async () => {
      const data = await dbService.getAlumni();
      setAlumniList(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64">Loading Dashboard...</div>;

  // Stats calculation
  const totalAlumni = alumniList.length;

  if (totalAlumni === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
          <Users className="w-10 h-10 text-slate-400" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-900">Belum Ada Data</h3>
          <p className="text-slate-500">Silakan tambahkan data alumni terlebih dahulu.</p>
        </div>
      </div>
    );
  }
  
  const categoryStats = alumniList.reduce((acc, alumni) => {
    const graduationYears = alumni.educations.map(e => e.graduationYear).filter(y => y > 0);
    const firstGrad = graduationYears.length > 0 ? Math.min(...graduationYears) : new Date().getFullYear();
    const cat = getAlumniCategory(firstGrad);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const genderStats = alumniList.reduce((acc, alumni) => {
    acc[alumni.gender] = (acc[alumni.gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const educationStats = alumniList.reduce((acc, alumni) => {
    // Last education based on graduation year
    const lastEdu = [...alumni.educations].sort((a, b) => b.graduationYear - a.graduationYear)[0];
    if (lastEdu) {
      acc[lastEdu.level] = (acc[lastEdu.level] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const jobStats = alumniList.reduce((acc, alumni) => {
    acc[alumni.mainJob] = (acc[alumni.mainJob] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const majorStats: Record<string, number> = {};

  alumniList.forEach(alumni => {
    alumni.educations.forEach(edu => {
      if (edu.level === majorLevelFilter && edu.major) {
        majorStats[edu.major] = (majorStats[edu.major] || 0) + 1;
      }
    });
  });

  const cityStats = alumniList.reduce((acc, alumni) => {
    const key = alumni.city;
    if (!acc[key]) {
      acc[key] = { count: 0, province: alumni.province };
    }
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { count: number, province: string }>);

  const categoryData = Object.entries(categoryStats).map(([name, value]) => ({ name, value: value as number }));
  const genderData = Object.entries(genderStats).map(([name, value]) => ({ name, value: value as number }));
  const educationData = Object.entries(educationStats)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => {
      const order: Record<string, number> = { 'DIII': 1, 'DIV': 2, 'S1': 3, 'S2': 4, 'S3': 5 };
      return (order[a.name] || 0) - (order[b.name] || 0);
    });
  const jobData = Object.entries(jobStats)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value);

  const skillStats = alumniList.reduce((acc, alumni) => {
    (alumni.skills || []).forEach(skill => {
      acc[skill] = (acc[skill] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const skillData = Object.entries(skillStats)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const serviceStats = alumniList.reduce((acc, alumni) => {
    if (alumni.isWillingToServe) {
      (alumni.serviceInterests || []).forEach(service => {
        acc[service] = (acc[service] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const serviceData = Object.entries(serviceStats)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value);

  const willingToServeCount = alumniList.filter(a => a.isWillingToServe).length;
  const willingToServeData = [
    { name: 'Bersedia', value: willingToServeCount },
    { name: 'Tidak Bersedia', value: totalAlumni - willingToServeCount }
  ];

  const inKTBCount = alumniList.filter(a => a.isInKTB).length;
  const inKTBData = [
    { name: 'Sudah ber-KTB', value: inKTBCount },
    { name: 'Belum ber-KTB', value: totalAlumni - inKTBCount }
  ];

  const willingToJoinKTBCount = alumniList.filter(a => !a.isInKTB && a.isWillingToJoinKTB).length;
  const notInKTBCount = totalAlumni - inKTBCount;
  const willingToJoinKTBData = [
    { name: 'Bersedia Gabung', value: willingToJoinKTBCount },
    { name: 'Tidak Bersedia', value: notInKTBCount - willingToJoinKTBCount }
  ];

  const majorData = Object.entries(majorStats)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const cityData = (Object.entries(cityStats) as [string, { count: number, province: string }][])
    .map(([name, data]) => ({ name, value: data.count, province: data.province }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 cities

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) * 0.5;
    const x = (cx as number) + radius * Math.cos(-(midAngle as number) * RADIAN);
    const y = (cy as number) + radius * Math.sin(-(midAngle as number) * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > (cx as number) ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-bold">
        {percent ? `${value} (${(percent * 100).toFixed(0)}%)` : '0'}
      </text>
    );
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    // Header
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text('Laporan Statistik Alumni', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text('Persekutuan Alumni Kristen Kota Ambon, Perkantas Maluku', 14, 30);
    doc.text(`Tanggal Laporan: ${dateStr}`, 14, 37);

    // 1. Summary Section
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Ringkasan Umum', 14, 50);

    autoTable(doc, {
      startY: 55,
      head: [['Kategori Statistik', 'Jumlah']],
      body: [
        ['Total Alumni Terdaftar', totalAlumni.toString()],
        ['Alumni Junior (< 5 thn)', (categoryStats['Junior'] || 0).toString()],
        ['Alumni Madya (5-15 thn)', (categoryStats['Madya'] || 0).toString()],
        ['Alumni Senior (> 15 thn)', (categoryStats['Senior'] || 0).toString()],
        ['Bersedia Melayani', willingToServeCount.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // 2. Demographics
    doc.setFontSize(16);
    doc.text('2. Demografi & Pendidikan', 14, (doc as any).lastAutoTable.finalY + 15);

    const genderRows = genderData.map(d => [d.name, d.value.toString(), `${((d.value / totalAlumni) * 100).toFixed(1)}%`]);
    const eduRows = educationData.map(d => [d.name, d.value.toString(), `${((d.value / totalAlumni) * 100).toFixed(1)}%`]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Jenis Kelamin', 'Jumlah', 'Persentase']],
      body: genderRows,
      theme: 'plain',
      headStyles: { fillColor: [15, 23, 42] },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Jenjang Pendidikan', 'Jumlah', 'Persentase']],
      body: eduRows,
      theme: 'plain',
      headStyles: { fillColor: [15, 23, 42] },
    });

    // 3. Majors & Skills (New Page if needed)
    doc.addPage();
    doc.setFontSize(16);
    doc.text('3. Program Studi & Keahlian', 14, 22);

    doc.setFontSize(12);
    doc.text(`Top 10 Program Studi (Jenjang ${majorLevelFilter})`, 14, 32);
    autoTable(doc, {
      startY: 35,
      head: [['Program Studi', 'Jumlah Alumni']],
      body: majorData.map(d => [d.name, d.value.toString()]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.setFontSize(12);
    doc.text('Top 10 Bidang Keahlian', 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Bidang Keahlian', 'Jumlah Alumni']],
      body: skillData.map(d => [d.name, d.value.toString()]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] }, // amber-500
    });

    // 4. Service Interests
    doc.setFontSize(16);
    doc.text('4. Minat Pelayanan', 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Bidang Pelayanan', 'Jumlah Peminat']],
      body: serviceData.map(d => [d.name, d.value.toString()]),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }, // emerald-500
    });

    // 5. KTB Information
    doc.addPage();
    doc.setFontSize(16);
    doc.text('5. Informasi KTB (Kelompok Tumbuh Bersama)', 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [['Status KTB', 'Jumlah']],
      body: [
        ['Sudah ber-KTB', inKTBCount.toString()],
        ['Belum ber-KTB', (totalAlumni - inKTBCount).toString()],
        ['Bersedia Bergabung KTB (Bagi yang belum)', willingToJoinKTBCount.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`laporan_statistik_alumni_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-8 p-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Alumni</h1>
          <p className="text-slate-500">Ringkasan informasi alumni PAK Kota Ambon</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={exportToPDF}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50 gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download Laporan PDF
          </Button>
          <div className="bg-blue-50 px-4 py-2 rounded-full flex items-center gap-2 border border-blue-100">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-blue-700">{totalAlumni} Total Alumni</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Alumni Junior</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{categoryStats['Junior'] || 0}</div>
            <p className="text-xs opacity-70 mt-1">Lulus &lt; 5 tahun yang lalu</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Alumni Madya</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{categoryStats['Madya'] || 0}</div>
            <p className="text-xs opacity-70 mt-1">Lulus 5 - 15 tahun yang lalu</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Alumni Senior</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{categoryStats['Senior'] || 0}</div>
            <p className="text-xs opacity-70 mt-1">Lulus &gt;= 15 tahun yang lalu</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gender Distribution */}
        <Card className="shadow-md border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Distribusi Jenis Kelamin</CardTitle>
              <CardDescription>Perbandingan Laki-laki & Perempuan (%)</CardDescription>
            </div>
            <PieChartIcon className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Education Distribution */}
        <Card className="shadow-md border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Jenjang Pendidikan Terakhir</CardTitle>
              <CardDescription>Persentase berdasarkan pendidikan tertinggi</CardDescription>
            </div>
            <PieChartIcon className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={educationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {educationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => {
                    const percentage = totalAlumni > 0 ? ((value / totalAlumni) * 100).toFixed(1) : '0';
                    return [`${value} (${percentage}%)`, 'Jumlah'];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Major Distribution with Filter */}
        <Card className="shadow-md border-slate-100">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Distribusi Program Studi</CardTitle>
              <CardDescription>Top 10 Program Studi berdasarkan jenjang pendidikan</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Jenjang:</span>
              <Select value={majorLevelFilter} onValueChange={setMajorLevelFilter}>
                <SelectTrigger className="w-[100px] h-8 text-xs">
                  <SelectValue placeholder="Jenjang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIII">DIII</SelectItem>
                  <SelectItem value="DIV">DIV</SelectItem>
                  <SelectItem value="S1">S1</SelectItem>
                  <SelectItem value="S2">S2</SelectItem>
                  <SelectItem value="S3">S3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="h-[400px]">
            {majorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={majorData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={150} 
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2 border border-slate-100 shadow-lg rounded-md">
                            <p className="text-xs font-bold">{payload[0].payload.name}</p>
                            <p className="text-xs text-blue-600">{payload[0].value} Alumni</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Tidak ada data untuk jenjang {majorLevelFilter}
              </div>
            )}
          </CardContent>
        </Card>

        {/* City Distribution */}
        <Card className="shadow-md border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Domisili Kabupaten/Kota</CardTitle>
              <CardDescription>Top 10 sebaran wilayah tempat tinggal</CardDescription>
            </div>
            <MapPin className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {cityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percentage = totalAlumni > 0 ? ((data.value / totalAlumni) * 100).toFixed(1) : '0';
                      return (
                        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg space-y-1">
                          <p className="font-bold text-slate-900">{data.name}</p>
                          <p className="text-xs text-blue-600 font-medium">Provinsi: {data.province}</p>
                          <p className="text-sm text-slate-600">Jumlah: <span className="font-bold">{data.value}</span> ({percentage}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Job Distribution */}
        <Card className="shadow-md border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Distribusi Pekerjaan Utama</CardTitle>
              <CardDescription>Persentase alumni berdasarkan bidang pekerjaan</CardDescription>
            </div>
            <Briefcase className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={jobData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {jobData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => {
                    const percentage = totalAlumni > 0 ? ((value / totalAlumni) * 100).toFixed(1) : '0';
                    return [`${value} (${percentage}%)`, 'Jumlah'];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skills Distribution */}
        <Card className="shadow-md border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Top 10 Bidang Keahlian</CardTitle>
              <CardDescription>Distribusi keahlian yang ditekuni alumni</CardDescription>
            </div>
            <Sparkles className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={skillData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border border-slate-100 shadow-lg rounded-md">
                          <p className="text-xs font-bold">{payload[0].payload.name}</p>
                          <p className="text-xs text-blue-600">{payload[0].value} Alumni</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Willingness */}
        <Card className="shadow-md border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Kesediaan Melayani</CardTitle>
              <CardDescription>Komitmen alumni untuk terlibat pelayanan</CardDescription>
            </div>
            <Heart className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={willingToServeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Interests */}
        <Card className="shadow-md border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Minat Bidang Pelayanan</CardTitle>
              <CardDescription>Distribusi minat pelayanan bagi yang bersedia</CardDescription>
            </div>
            <UserCheck className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={serviceData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border border-slate-100 shadow-lg rounded-md">
                          <p className="text-xs font-bold">{payload[0].payload.name}</p>
                          <p className="text-xs text-blue-600">{payload[0].value} Alumni</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* KTB Status */}
        <Card className="shadow-md border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Status KTB</CardTitle>
              <CardDescription>Alumni yang sudah & belum ber-KTB</CardDescription>
            </div>
            <Users className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inKTBData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#94a3b8" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Willingness to Join KTB */}
        <Card className="shadow-md border-slate-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Kesediaan Bergabung KTB</CardTitle>
              <CardDescription>Bagi alumni yang belum ber-KTB</CardDescription>
            </div>
            <UserPlus className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={willingToJoinKTBData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
