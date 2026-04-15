import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { MessageSquare, Trash2, Calendar, Mail, User, CheckCircle2, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import { Suggestion } from '../types';
import { Phone, MapPin } from 'lucide-react';

export default function AdminSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'suggestions'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Suggestion[];
      setSuggestions(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching suggestions:", error);
      toast.error("Gagal memuat data saran");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (suggestionId: string) => {
    try {
      await updateDoc(doc(db, 'suggestions', suggestionId), {
        isRead: true
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteSuggestion = async (suggestionId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus saran ini?')) return;
    
    try {
      await deleteDoc(doc(db, 'suggestions', suggestionId));
      toast.success('Saran berhasil dihapus');
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      toast.error('Gagal menghapus saran');
    }
  };

  const filteredSuggestions = suggestions.filter(s => {
    const date = new Date(s.createdAt);
    const monthYear = format(date, 'yyyy-MM');
    const matchesMonth = filterMonth === 'all' || monthYear === filterMonth;
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesSearch;
  });

  // Get unique months for filter
  const months = Array.from(new Set(suggestions.map(s => {
    const date = new Date(s.createdAt);
    return format(date, 'yyyy-MM');
  }))).sort().reverse();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-biru-abu border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kotak Saran</h2>
          <p className="text-slate-500">Kelola saran dan masukan dari pengunjung.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari saran..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {months.map(m => (
                  <SelectItem key={m} value={m}>
                    {format(new Date(m + '-01'), 'MMMM yyyy', { locale: id })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredSuggestions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-slate-400">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p>Tidak ada saran yang ditemukan.</p>
            </CardContent>
          </Card>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className={`transition-all hover:shadow-md ${!suggestion.isRead ? 'border-l-4 border-l-biru-abu bg-abu-muda/30' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        {suggestion.fullName}
                      </CardTitle>
                      {!suggestion.isRead && (
                        <Badge variant="default" className="bg-biru-abu">Baru</Badge>
                      )}
                      <Badge variant="outline" className={suggestion.isAlumni === 'Ya' ? 'text-green-600 border-green-200 bg-green-50' : 'text-slate-500'}>
                        {suggestion.isAlumni === 'Ya' ? 'Alumni' : 'Bukan Alumni'}
                      </Badge>
                    </div>
                    <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {suggestion.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {suggestion.phone}
                      </span>
                      {suggestion.perkantasOrigin && (
                        <span className="flex items-center gap-1 text-biru-abu font-medium">
                          <MapPin className="w-3 h-3" />
                          {suggestion.perkantasOrigin}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(suggestion.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {!suggestion.isRead && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-biru-abu hover:text-biru-abu/90 hover:bg-abu-muda"
                        onClick={() => markAsRead(suggestion.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Tandai Dibaca
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteSuggestion(suggestion.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-lg border border-slate-100 text-slate-700 whitespace-pre-wrap">
                  {suggestion.content}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
