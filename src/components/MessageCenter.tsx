import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Cake, Megaphone, Search, Filter, Calendar, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alumni } from '@/types';
import { dbService } from '@/lib/db';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

export default function MessageCenter() {
  const [alumniList, setAlumniList] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlumniIds, setSelectedAlumniIds] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<'info' | 'birthday'>('info');
  const [messageContent, setMessageContent] = useState('');

  const templates = {
    info: "Halo [Nama], kami ingin menginformasikan bahwa akan ada kegiatan alumni PAK Kota Ambon pada tanggal [Tanggal]. Mohon kehadirannya ya!",
    birthday: "Selamat Ulang Tahun, [Nama]! Semoga panjang umur, sehat selalu, dan diberkati dalam segala hal. Salam hangat dari pengurus alumni PAK Kota Ambon."
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await dbService.getAlumni();
      setAlumniList(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    setMessageContent(templates[messageType]);
  }, [messageType]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAlumniIds(filteredAlumni.map(a => a.id!).filter(id => !!id));
    } else {
      setSelectedAlumniIds([]);
    }
  };

  const toggleSelectAlumni = (id: string) => {
    setSelectedAlumniIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isBirthdayToday = (birthDateStr: string) => {
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    return today.getDate() === birthDate.getDate() && today.getMonth() === birthDate.getMonth();
  };

  const isBirthdayThisMonth = (birthDateStr: string) => {
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    return today.getMonth() === birthDate.getMonth();
  };

  const filteredAlumni = alumniList.filter(alumni => {
    const matchesSearch = alumni.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    if (messageType === 'birthday') {
      return matchesSearch && isBirthdayThisMonth(alumni.birthDate);
    }
    return matchesSearch;
  });

  const handleSendMessage = (alumni: Alumni) => {
    const personalizedMessage = messageContent.replace('[Nama]', alumni.fullName);
    // Format phone number for WhatsApp (remove non-digits, handle leading 0)
    let phone = alumni.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    } else if (!phone.startsWith('62')) {
      phone = '62' + phone;
    }
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(personalizedMessage)}`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="flex items-center justify-center h-64">Memuat Pusat Pesan...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pusat Pesan</h1>
          <p className="text-slate-500">Kirim informasi kegiatan atau ucapan ulang tahun kepada alumni</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Selection & Filters */}
        <Card className="lg:col-span-1 shadow-md border-slate-100 flex flex-col h-[700px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              Pilih Penerima
            </CardTitle>
            <div className="pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Cari nama..." 
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <Tabs value={messageType} onValueChange={(v) => setMessageType(v as any)} className="w-full mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info" className="gap-2">
                  <Megaphone className="w-4 h-4" /> Info
                </TabsTrigger>
                <TabsTrigger value="birthday" className="gap-2">
                  <Cake className="w-4 h-4" /> Ultah
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="select-all" 
                  checked={selectedAlumniIds.length === filteredAlumni.length && filteredAlumni.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-xs font-medium text-slate-500 cursor-pointer">
                  Pilih Semua ({filteredAlumni.length})
                </label>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {selectedAlumniIds.length} Terpilih
              </span>
            </div>

            <ScrollArea className="flex-1 border rounded-md p-2">
              <div className="space-y-1">
                {filteredAlumni.length > 0 ? (
                  filteredAlumni.map(alumni => (
                    <div 
                      key={alumni.id} 
                      className={`flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-slate-50 ${selectedAlumniIds.includes(alumni.id!) ? 'bg-blue-50/50' : ''}`}
                      onClick={() => toggleSelectAlumni(alumni.id!)}
                    >
                      <Checkbox 
                        checked={selectedAlumniIds.includes(alumni.id!)}
                        onCheckedChange={() => toggleSelectAlumni(alumni.id!)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{alumni.fullName}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-slate-400">{alumni.phone}</p>
                          {isBirthdayToday(alumni.birthDate) && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1 bg-pink-50 text-pink-600 border-pink-100">Ultah Hari Ini!</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Tidak ada alumni ditemukan
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Column: Message Editor & Actions */}
        <Card className="lg:col-span-2 shadow-md border-slate-100 flex flex-col h-[700px]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Editor Pesan
            </CardTitle>
            <CardDescription>
              Sesuaikan isi pesan Anda. Gunakan <code className="bg-slate-100 px-1 rounded text-blue-600">[Nama]</code> untuk menyebut nama alumni secara otomatis.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Isi Pesan</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-blue-600 h-7"
                  onClick={() => setMessageContent(templates[messageType])}
                >
                  Reset ke Template
                </Button>
              </div>
              <Textarea 
                className="min-h-[200px] text-base leading-relaxed focus-visible:ring-blue-500"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Tulis pesan Anda di sini..."
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Pratinjau Pesan (Contoh)
              </h4>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative">
                <div className="absolute -left-2 top-4 w-4 h-4 bg-white border-l border-b border-slate-200 rotate-45"></div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap italic">
                  {messageContent.replace('[Nama]', filteredAlumni[0]?.fullName || 'Nama Alumni')}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">
                    Pesan akan dikirimkan secara personal menggunakan tag <code className="text-blue-600 font-bold">[Nama]</code>.
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    Total {selectedAlumniIds.length} penerima terpilih.
                  </p>
                </div>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-12 px-8 shadow-lg shadow-emerald-100"
                  disabled={selectedAlumniIds.length === 0}
                  onClick={() => {
                    // Open the first one immediately, then user can do others from the list
                    const firstId = selectedAlumniIds[0];
                    const alumni = alumniList.find(a => a.id === firstId);
                    if (alumni) handleSendMessage(alumni);
                    
                    if (selectedAlumniIds.length > 1) {
                      alert(`Sistem akan membuka WhatsApp untuk ${alumni?.fullName}. Untuk penerima lainnya, silakan klik tombol kirim pada daftar antrean di bawah agar tidak diblokir oleh browser.`);
                    }
                  }}
                >
                  <Send className="w-5 h-5" />
                  Mulai Kirim Pesan
                </Button>
              </div>

              {selectedAlumniIds.length > 0 && (
                <div className="bg-slate-50 rounded-lg border border-dashed border-slate-300 p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Antrean Pengiriman ({selectedAlumniIds.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAlumniIds.map(id => {
                      const alumni = alumniList.find(a => a.id === id);
                      if (!alumni) return null;
                      return (
                        <Badge 
                          key={id} 
                          variant="secondary" 
                          className="pl-2 pr-1 py-1 gap-2 bg-white border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 transition-colors cursor-pointer group"
                          onClick={() => handleSendMessage(alumni)}
                        >
                          <span className="text-xs text-slate-600">{alumni.fullName}</span>
                          <div className="bg-emerald-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
