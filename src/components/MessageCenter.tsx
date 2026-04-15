import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Cake, Megaphone, Search, Filter, Calendar, ExternalLink, CheckCircle2, Mail } from 'lucide-react';
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
import { cn } from '@/lib/utils';

export default function MessageCenter() {
  const [alumniList, setAlumniList] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlumniIds, setSelectedAlumniIds] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<'info' | 'birthday' | 'email'>('info');
  const [messageContent, setMessageContent] = useState('');

  const templates = {
    info: "Halo [Nama], kami ingin menginformasikan bahwa akan ada kegiatan alumni PAK Kota Ambon pada tanggal [Tanggal]. Mohon kehadirannya ya!",
    birthday: "Selamat Ulang Tahun, [Nama]! Semoga panjang umur, sehat selalu, dan diberkati dalam segala hal. Salam hangat dari pengurus alumni PAK Kota Ambon.",
    email: "Yth. [Nama],\n\nKami dari pengurus alumni PAK Kota Ambon ingin menyampaikan informasi terkait...\n\nSalam,\nPengurus PAK Kota Ambon"
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
    
    if (messageType === 'email') {
      const subject = encodeURIComponent("Informasi Alumni PAK Kota Ambon");
      const body = encodeURIComponent(personalizedMessage);
      // Using pakkotaambon@gmail.com as the sender is not possible via mailto 
      // as mailto opens the user's local client. 
      // We can only set the recipient, subject and body.
      const url = `mailto:${alumni.email}?subject=${subject}&body=${body}`;
      window.location.href = url;
    } else {
      // Format phone number for WhatsApp (remove non-digits, handle leading 0)
      let phone = alumni.phone.replace(/\D/g, '');
      if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1);
      } else if (!phone.startsWith('62')) {
        phone = '62' + phone;
      }
      
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(personalizedMessage)}`;
      window.open(url, '_blank');
    }
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
              <Filter className="w-5 h-5 text-biru-abu" />
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info" className="gap-2 text-xs px-1">
                  <Megaphone className="w-3 h-3" /> Info WA
                </TabsTrigger>
                <TabsTrigger value="birthday" className="gap-2 text-xs px-1">
                  <Cake className="w-3 h-3" /> Ultah WA
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-2 text-xs px-1">
                  <Mail className="w-3 h-3" /> Email
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
              <span className="text-xs font-bold text-biru-abu bg-abu-muda px-2 py-0.5 rounded-full">
                {selectedAlumniIds.length} Terpilih
              </span>
            </div>

            <div className="flex-1 min-h-0 border rounded-md overflow-hidden">
              <ScrollArea className="h-full p-2">
                <div className="space-y-1">
                  {filteredAlumni.length > 0 ? (
                    filteredAlumni.map(alumni => (
                      <div 
                        key={alumni.id} 
                        className={`flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-slate-50 ${selectedAlumniIds.includes(alumni.id!) ? 'bg-abu-muda/50' : ''}`}
                        onClick={() => toggleSelectAlumni(alumni.id!)}
                      >
                        <Checkbox 
                          checked={selectedAlumniIds.includes(alumni.id!)}
                          onCheckedChange={() => toggleSelectAlumni(alumni.id!)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{alumni.fullName}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-slate-400 truncate">
                              {messageType === 'email' ? alumni.email : alumni.phone}
                            </p>
                            {isBirthdayToday(alumni.birthDate) && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1 bg-pink-50 text-pink-600 border-pink-100 shrink-0">Ultah Hari Ini!</Badge>
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
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Message Editor & Actions */}
        <Card className="lg:col-span-2 shadow-md border-slate-100 flex flex-col h-[700px]">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-biru-abu" />
              Editor Pesan
            </CardTitle>
            <CardDescription>
              Sesuaikan isi pesan Anda. Gunakan <code className="bg-slate-100 px-1 rounded text-biru-abu">[Nama]</code> untuk menyebut nama alumni secara otomatis.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto custom-scrollbar">
            {/* Message Input - Fixed Height */}
            <div className="space-y-2 flex flex-col shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Isi Pesan</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-biru-abu h-7"
                  onClick={() => setMessageContent(templates[messageType])}
                >
                  Reset ke Template
                </Button>
              </div>
              <Textarea 
                className="h-[180px] resize-none text-base leading-relaxed focus-visible:ring-biru-abu"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Tulis pesan Anda di sini..."
              />
            </div>

            {/* Preview - Fixed Height with Internal Scroll */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col h-[160px] shrink-0">
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Pratinjau Pesan (Contoh)
              </h4>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative flex-1 overflow-hidden">
                <div className="absolute -left-2 top-3 w-4 h-4 bg-white border-l border-b border-slate-200 rotate-45"></div>
                <ScrollArea className="h-full">
                  <p className="text-sm text-slate-600 whitespace-pre-wrap break-words italic pr-2">
                    {messageContent.replace('[Nama]', filteredAlumni[0]?.fullName || 'Nama Alumni')}
                  </p>
                </ScrollArea>
              </div>
            </div>

            {/* Footer / Actions - Pushed to bottom */}
            <div className="mt-auto pt-4 border-t flex flex-col gap-4 shrink-0 pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 mb-1">
                    Pesan akan dikirimkan secara personal menggunakan tag <code className="text-biru-abu font-bold">[Nama]</code>. 
                    {messageType === 'email' ? ' Menggunakan aplikasi email default Anda.' : ' Menggunakan WhatsApp Web/Desktop.'}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    Total {selectedAlumniIds.length} penerima terpilih.
                  </p>
                </div>
                <Button 
                  className={cn(
                    "w-full sm:w-auto text-white gap-2 h-12 px-8 shadow-lg shrink-0",
                    messageType === 'email' ? "bg-biru-abu hover:bg-biru-abu/90 shadow-abu-muda" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                  )}
                  disabled={selectedAlumniIds.length === 0}
                  onClick={() => {
                    const firstId = selectedAlumniIds[0];
                    const alumni = alumniList.find(a => a.id === firstId);
                    if (alumni) handleSendMessage(alumni);
                    
                    if (selectedAlumniIds.length > 1) {
                      const platform = messageType === 'email' ? 'Email' : 'WhatsApp';
                      alert(`Sistem akan membuka ${platform} untuk ${alumni?.fullName}. Untuk penerima lainnya, silakan klik tombol kirim pada daftar antrean di bawah.`);
                    }
                  }}
                >
                  <Send className="w-5 h-5" />
                  Mulai Kirim {messageType === 'email' ? 'Email' : 'Pesan WA'}
                </Button>
              </div>

              {selectedAlumniIds.length > 0 && (
                <div className="bg-slate-50 rounded-lg border border-dashed border-slate-300 p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Antrean Pengiriman ({selectedAlumniIds.length})</p>
                  <ScrollArea className="h-32">
                    <div className="flex flex-wrap gap-2 pb-4">
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
                            <span className="text-xs text-slate-600 truncate max-w-[150px]">{alumni.fullName}</span>
                            <div className="bg-emerald-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          </Badge>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
