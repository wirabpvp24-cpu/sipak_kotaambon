import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, Trash2, Edit2, Save, X, Loader2, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { dbService } from '@/lib/db';
import { Event } from '@/types';
import { cn } from '@/lib/utils';

export default function EventSchedule({ isAdmin = false }: { isAdmin?: boolean }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [formData, setFormData] = useState<Omit<Event, 'id' | 'createdAt'>>({
    title: '',
    theme: '',
    speaker: '',
    description: '',
    date: '',
    time: '',
    timezone: 'WIT',
    location: '',
    imageUrl: ''
  });

  useEffect(() => {
    const unsubscribe = dbService.subscribeEvents((data) => {
      setEvents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await dbService.updateEvent({ ...formData, id: editingId, createdAt: events.find(ev => ev.id === editingId)?.createdAt || new Date().toISOString() });
        setEditingId(null);
      } else {
        await dbService.addEvent({ ...formData, createdAt: new Date().toISOString() });
        setIsAdding(false);
      }
      setFormData({ 
        title: '', 
        theme: '', 
        speaker: '', 
        description: '', 
        date: '', 
        time: '', 
        timezone: 'WIT',
        location: '', 
        imageUrl: '' 
      });
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingId(event.id!);
    setFormData({
      title: event.title,
      theme: event.theme || '',
      speaker: event.speaker || '',
      description: event.description || '',
      date: event.date,
      time: event.time,
      timezone: event.timezone || 'WIT',
      location: event.location,
      imageUrl: event.imageUrl || ''
    });
    setIsAdding(false);
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      await dbService.deleteEvent(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const years = Array.from(new Set(events.map(e => new Date(e.date).getFullYear()))).sort((a: number, b: number) => b - a);
  if (years.length === 0 || !years.includes(new Date().getFullYear())) {
    years.push(new Date().getFullYear());
    years.sort((a: number, b: number) => b - a);
  }

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const groupedEvents = months.reduce((acc, month, index) => {
    acc[month] = events.filter(event => {
      const d = new Date(event.date);
      return d.getFullYear() === selectedYear && d.getMonth() === index;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return acc;
  }, {} as Record<string, Event[]>);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Jadwal Kegiatan</h1>
            <p className="text-slate-500">Kelola agenda dan kegiatan alumni PAK Kota Ambon</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1 shadow-sm">
            <span className="text-sm font-medium text-slate-500">Tahun:</span>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent border-none text-sm font-bold text-slate-900 focus:ring-0 cursor-pointer"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          {!isAdding && !editingId && isAdmin && (
            <Button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700 gap-2 shadow-lg shadow-blue-100">
              <Plus className="w-4 h-4" /> Tambah Jadwal
            </Button>
          )}
        </div>
      </div>

      {(isAdding || editingId) && (
        <Card className="border-blue-100 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}</CardTitle>
            <CardDescription>Lengkapi detail kegiatan di bawah ini</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Kegiatan</Label>
                  <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required placeholder="Contoh: Ibadah Bulanan Alumni" disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema Kegiatan (Opsional)</Label>
                  <Input id="theme" name="theme" value={formData.theme} onChange={handleInputChange} placeholder="Tema kegiatan..." disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speaker">Nama Pembicara (Opsional)</Label>
                  <Input id="speaker" name="speaker" value={formData.speaker} onChange={handleInputChange} placeholder="Nama pembicara..." disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Lokasi</Label>
                  <Input id="location" name="location" value={formData.location} onChange={handleInputChange} required placeholder="Contoh: Gedung Serbaguna" disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal</Label>
                  <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} required disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Jam (Format 24 Jam, misal: 14:30)</Label>
                  <Input 
                    id="time" 
                    name="time" 
                    type="text" 
                    value={formData.time} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="HH:mm (Contoh: 14:30)" 
                    pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
                    title="Format waktu harus HH:mm (00:00 - 23:59)"
                    disabled={isSaving} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Wilayah Waktu</Label>
                  <select 
                    id="timezone" 
                    name="timezone" 
                    value={formData.timezone} 
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value as any }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSaving}
                  >
                    <option value="WIB">WIB (Waktu Indonesia Barat)</option>
                    <option value="WITA">WITA (Waktu Indonesia Tengah)</option>
                    <option value="WIT">WIT (Waktu Indonesia Timur)</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="imageUrl">URL Gambar Flyer (Opsional)</Label>
                  <Input id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="https://example.com/flyer.jpg" disabled={isSaving} />
                  <p className="text-[10px] text-slate-400 italic">Masukkan link gambar flyer kegiatan Anda.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Keterangan (Opsional)</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Tambahkan detail tambahan..." className="resize-none h-24" disabled={isSaving} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }} disabled={isSaving}>Batal</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 gap-2 min-w-[140px]" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Menyimpan...' : 'Simpan Jadwal'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-slate-500 font-medium">Memuat daftar jadwal...</p>
          </div>
        ) : (
          months.map((month, monthIdx) => {
            const monthEvents = groupedEvents[month];
            if (monthEvents.length === 0) return null;

            return (
              <div key={month} className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-slate-800 min-w-[120px]">{month}</h2>
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                    {monthEvents.length} Kegiatan
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {monthEvents.map((event) => {
                    const eventDate = new Date(event.date);
                    const isToday = new Date().toDateString() === eventDate.toDateString();
                    
                    return (
                      <Card key={event.id} className={cn(
                        "group transition-all hover:shadow-md border-slate-100",
                        isToday && "border-blue-200 bg-blue-50/30"
                      )}>
                        <CardContent className="p-5">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center justify-center w-16 h-16 bg-white border border-slate-200 rounded-xl shrink-0 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  {eventDate.toLocaleDateString('id-ID', { month: 'short' })}
                                </span>
                                <span className="text-xl font-black text-slate-900 leading-none">
                                  {eventDate.getDate()}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-slate-900 text-lg">{event.title}</h3>
                                  {isToday && <Badge className="bg-blue-600">Hari Ini</Badge>}
                                </div>
                                {event.theme && (
                                  <p className="text-sm font-semibold text-blue-600">Tema: {event.theme}</p>
                                )}
                                {event.speaker && (
                                  <p className="text-sm text-slate-700">Pembicara: {event.speaker}</p>
                                )}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> {event.time} {event.timezone || 'WIT'}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" /> {event.location}
                                  </div>
                                </div>
                                {event.description && (
                                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{event.description}</p>
                                )}
                                {event.imageUrl && (
                                  <div className="mt-4 rounded-xl overflow-hidden border border-slate-100 shadow-sm max-w-sm">
                                    <img 
                                      src={event.imageUrl} 
                                      alt={event.title} 
                                      className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            {isAdmin && (
                              <div className="flex md:flex-col justify-end gap-2 shrink-0">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(event)} className="h-8 w-8 p-0">
                                  <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                                </Button>
                                {deleteConfirmId === event.id ? (
                                  <div className="flex gap-1">
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(event.id!)} className="h-8 px-2 text-[10px]">
                                      Ya
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)} className="h-8 px-2 text-[10px]">
                                      Tidak
                                    </Button>
                                  </div>
                                ) : (
                                  <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(event.id!)} className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {!loading && Object.values(groupedEvents).every(arr => arr.length === 0) && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Belum ada jadwal di tahun {selectedYear}</h3>
            <p className="text-slate-500">{isAdmin ? 'Klik tombol "Tambah Jadwal" untuk membuat agenda baru.' : 'Silakan pilih tahun lain atau kembali lagi nanti.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
