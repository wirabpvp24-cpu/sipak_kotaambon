import React from 'react';
import { MapPin, Instagram, Facebook, Phone, Mail, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden relative"
          >
            <div className="bg-biru-abu p-6 text-white text-center relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold">Hubungi Kami</h2>
              <p className="text-abu-muda text-sm">Sekretariat PAK Kota Ambon</p>
            </div>

            <div className="p-8 space-y-6">
              {/* Address */}
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-abu-muda rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-biru-abu" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900">Alamat</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Jl. PHB Halong Atas, Halong, Kec. Baguala, Kota Ambon, Maluku 
                    <span className="block text-xs text-slate-400 mt-1 italic">
                      (Belakang Gereja Protestan Maluku Jemaat Khalas, Halong)
                    </span>
                  </p>
                  <a 
                    href="https://maps.app.goo.gl/hXPZUucZ7RE6Rm5v8" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-biru-abu hover:underline mt-2"
                  >
                    Buka di Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Social Media */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  Media Sosial
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a 
                    href="https://www.instagram.com/pakkotaambon/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-pink-50 hover:border-pink-100 transition-all group"
                  >
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-600 transition-colors">
                      <Instagram className="w-4 h-4 text-pink-600 group-hover:text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Instagram</span>
                  </a>
                  <a 
                    href="https://web.facebook.com/groups/863948436970665" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-abu-muda hover:border-abu-muda transition-all group"
                  >
                    <div className="w-8 h-8 bg-abu-muda rounded-lg flex items-center justify-center group-hover:bg-biru-abu transition-colors">
                      <Facebook className="w-4 h-4 text-biru-abu group-hover:text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Facebook</span>
                  </a>
                </div>
              </div>

              {/* Other Contacts */}
              <div className="grid grid-cols-1 gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a 
                    href="mailto:pakkotaambon@gmail.com" 
                    className="text-sm text-slate-600 hover:text-biru-abu hover:underline transition-colors"
                  >
                    pakkotaambon@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
