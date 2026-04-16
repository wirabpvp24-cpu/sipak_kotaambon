import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Heart } from 'lucide-react';
import { INDONESIA_REGIONS } from '../constants/regions';
import { SuggestionType } from '../types';

interface SuggestionBoxProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SuggestionBox({ isOpen, onClose, onSuccess }: SuggestionBoxProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Saran' as SuggestionType,
    fullName: '',
    email: '',
    phone: '',
    isAlumni: '',
    perkantasOrigin: '',
    content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isMissingFields = !formData.fullName || !formData.email || !formData.phone || !formData.isAlumni || !formData.content || (formData.isAlumni === 'Ya' && !formData.perkantasOrigin);
    
    if (isMissingFields) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'suggestions'), {
        ...formData,
        isRead: false,
        createdAt: new Date().toISOString()
      });
      
      toast.success(formData.type === 'Saran' ? 'Terima kasih atas saran dan masukan Anda.' : 'Terima kasih, pokok doa Anda telah kami terima.');
      onSuccess();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast.error('Gagal mengirim. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Kotak Saran & Pokok Doa</DialogTitle>
          <DialogDescription>
            Berikan saran, masukan, atau bagikan pokok doa Anda bersama kami.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Jenis Pesan</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as SuggestionType })}
              className="flex gap-4"
              required
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Saran" id="type-saran" />
                <Label htmlFor="type-saran" className="font-normal flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Saran
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Pokok Doa" id="type-doa" />
                <Label htmlFor="type-doa" className="font-normal flex items-center gap-1">
                  <Heart className="w-3 h-3" /> Pokok Doa
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input
              id="fullName"
              placeholder="Masukkan nama lengkap"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Handphone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Apakah Anda alumni Perkantas?</Label>
            <RadioGroup
              value={formData.isAlumni}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                isAlumni: value,
                perkantasOrigin: value === 'Tidak' ? '' : formData.perkantasOrigin
              })}
              className="flex gap-4"
              required
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Ya" id="ya" />
                <Label htmlFor="ya" className="font-normal">Ya</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Tidak" id="tidak" />
                <Label htmlFor="tidak" className="font-normal">Tidak</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.isAlumni === 'Ya' && (
            <div className="space-y-2">
              <Label htmlFor="perkantasOrigin">Asal Perkantas (Provinsi)</Label>
              <Select 
                value={formData.perkantasOrigin} 
                onValueChange={(value) => setFormData({ ...formData, perkantasOrigin: value })}
              >
                <SelectTrigger id="perkantasOrigin">
                  <SelectValue placeholder="Pilih Provinsi" />
                </SelectTrigger>
                <SelectContent>
                  {INDONESIA_REGIONS.provinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">
              {formData.type === 'Saran' ? 'Saran dan Masukan' : 'Isi Pokok Doa'}
            </Label>
            <Textarea
              id="content"
              placeholder={formData.type === 'Saran' ? "Tuliskan saran atau masukan Anda di sini..." : "Tuliskan pokok doa Anda di sini..."}
              className="min-h-[120px]"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="bg-biru-abu hover:bg-biru-abu/90">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                'Kirim'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
