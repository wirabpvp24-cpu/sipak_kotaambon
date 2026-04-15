import React, { useState, useEffect } from 'react';
import { GraduationCap, UserPlus, Info, Instagram, X, Calendar, ArrowRight, ExternalLink, MapPin, Facebook, Phone, History, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { dbService } from '@/lib/db';
import { Event } from '@/types';

interface WelcomeModalProps {
  onSelectRegister: () => void;
  onSelectInfo: () => void;
  onSelectProfile: () => void;
  onSelectContact: () => void;
}

export default function WelcomeModal({ onSelectRegister, onSelectInfo, onSelectProfile, onSelectContact }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);

  useEffect(() => {
    // Show modal after a short delay
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 800);

    // Fetch next event for preview
    const fetchEvent = async () => {
      const events = await dbService.getEvents();
      const futureEvents = events.filter(ev => new Date(ev.date) >= new Date());
      if (futureEvents.length > 0) {
        setNextEvent(futureEvents[0]);
      }
    };
    fetchEvent();

    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
        >
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-20 bg-white/50 backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>

          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-full">
            {/* Left Side: Branding */}
            <div className="bg-blue-600 p-8 text-white flex flex-col justify-center items-center text-center space-y-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2">SI GANDONG</h2>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Sistem Informasi Pengelolaan Data dan Pelayanan Alumni Terintegrasi Persekutuan Alumni Kristen Kota Ambon, Perkantas Maluku
                </p>
              </div>
              <div className="pt-4">
                <Badge className="bg-blue-500/50 hover:bg-blue-500/50 border-none text-blue-50">
                  Selamat Datang, Basudara!
                </Badge>
              </div>
            </div>

            {/* Right Side: Options */}
            <div className="p-8 flex flex-col justify-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Apa yang ingin Anda lakukan?</h3>
                <p className="text-slate-500 text-sm">Pilih layanan yang Anda butuhkan hari ini</p>
              </div>

              <div className="space-y-4">
                {/* Option 1: Profile */}
                <button 
                  onClick={() => {
                    onSelectProfile();
                    setIsOpen(false);
                  }}
                  className="w-full group flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50/50 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <History className="w-6 h-6 text-blue-600 group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-700">Profil Organisasi</h4>
                    <p className="text-xs text-slate-500">Mengenal sejarah, visi, dan misi kami</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Option 2: Info & Schedule */}
                <button 
                  onClick={() => {
                    onSelectInfo();
                    setIsOpen(false);
                  }}
                  className="w-full group flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                    <Calendar className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 group-hover:text-emerald-700">Info & Jadwal</h4>
                    <p className="text-xs text-slate-500">Lihat agenda kegiatan alumni terbaru</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Option 3: Registration */}
                <button 
                  onClick={() => {
                    onSelectRegister();
                    setIsOpen(false);
                  }}
                  className="w-full group flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50/50 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <UserPlus className="w-6 h-6 text-blue-600 group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-700">Pendaftaran Alumni</h4>
                    <p className="text-xs text-slate-500">Daftarkan diri Anda dalam database alumni</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Option 4: Contact */}
                <button 
                  onClick={() => {
                    onSelectContact();
                    setIsOpen(false);
                  }}
                  className="w-full group flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50/50 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Phone className="w-6 h-6 text-blue-600 group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-700">Hubungi Kontak</h4>
                    <p className="text-xs text-slate-500">Lihat alamat dan media sosial kami</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
