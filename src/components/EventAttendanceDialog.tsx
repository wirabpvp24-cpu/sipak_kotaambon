import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle2, AlertCircle, UserCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { dbService } from '@/lib/db';
import { Event, Alumni } from '@/types';

interface EventAttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
}

export default function EventAttendanceDialog({ isOpen, onClose, event }: EventAttendanceDialogProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [phone, setPhone] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !feedback.trim()) {
      setError('Mohon lengkapi semua field yang wajib diisi.');
      return;
    }

    // Time window validation
    const now = new Date();
    const eventDateTime = new Date(`${event.date}T${event.time}:00`);
    const eightHoursLater = new Date(eventDateTime.getTime() + 8 * 60 * 60 * 1000);
    
    if (now < eventDateTime) {
      setError('Konfirmasi kehadiran belum dibuka. Silakan kembali saat acara dimulai.');
      return;
    }
    
    if (now > eightHoursLater) {
      setError('Konfirmasi kehadiran sudah ditutup (maksimal 8 jam setelah acara dimulai).');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await dbService.addEventResponse({
        eventId: event.id!,
        alumniId: 'guest', // No longer verifying alumni ID
        alumniName: fullName,
        alumniGender: gender,
        phone: phone,
        status: 'Hadir',
        feedback,
        createdAt: new Date().toISOString()
      });
      setStep('success');
    } catch (err) {
      console.error("Submit error:", err);
      setError('Gagal mengirim konfirmasi.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('form');
    setFullName('');
    setGender('Laki-laki');
    setPhone('');
    setError('');
    setFeedback('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={reset}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Konfirmasi Kehadiran & Saran</DialogTitle>
          <DialogDescription>
            {event.title} - {new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input 
                id="fullName"
                placeholder="Masukkan nama lengkap Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Handphone</Label>
              <Input 
                id="phone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Jenis Kelamin</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="gender" 
                    value="Laki-laki" 
                    checked={gender === 'Laki-laki'} 
                    onChange={() => setGender('Laki-laki')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Laki-laki</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="gender" 
                    value="Perempuan" 
                    checked={gender === 'Perempuan'} 
                    onChange={() => setGender('Perempuan')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Perempuan</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Saran & Masukan</Label>
              <Textarea 
                id="feedback"
                placeholder="Berikan saran atau masukan Anda untuk kegiatan ini..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="resize-none h-24"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Kirim Saran'}
            </Button>
          </form>
        )}

        {step === 'success' && (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Terima Kasih!</h3>
              <p className="text-slate-500">Konfirmasi kehadiran dan masukan Anda telah kami terima.</p>
            </div>
            <Button onClick={reset} className="w-full">Tutup</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
