import React, { useState, useEffect } from 'react';
import { dbService } from '../lib/db';
import { HomeSettings } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Loader2, Save, Edit2, Home as HomeIcon, Sparkles, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  isAdmin: boolean;
}

export default function Home({ isAdmin }: HomeProps) {
  const [settings, setSettings] = useState<HomeSettings | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<HomeSettings>({
    heroTitle: 'SI GANDONG',
    heroSubtitle: 'Sistem Informasi Pengelolaan Data dan Pelayanan Alumni Terintegrasi',
    welcomeText: 'Selamat datang di platform resmi alumni Kristen Kota Ambon.'
  });

  useEffect(() => {
    const unsubscribe = dbService.subscribeHomeSettings((data) => {
      setSettings(data);
      if (data) {
        setFormData(data);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dbService.updateHomeSettings(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving home settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-biru-abu" />
      </div>
    );
  }

  if (isAdmin && isEditing) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Edit Konten Beranda</h2>
            <p className="text-slate-500">Sesuaikan teks penyambutan di halaman utama</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Konten Utama</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heroTitle">Judul Utama (Hero)</Label>
              <Input 
                id="heroTitle" 
                value={formData.heroTitle} 
                onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroSubtitle">Sub-judul (Hero)</Label>
              <Input 
                id="heroSubtitle" 
                value={formData.heroSubtitle} 
                onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="welcomeText">Teks Selamat Datang</Label>
              <Textarea 
                id="welcomeText" 
                value={formData.welcomeText} 
                onChange={(e) => setFormData({ ...formData, welcomeText: e.target.value })}
                className="min-h-[150px]"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const displaySettings = settings || formData;

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden rounded-[2.5rem] bg-biru-abu text-white shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-biru-cerah rounded-full blur-[120px]" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl"
          >
            <GraduationCap className="w-10 h-10 text-white" />
          </motion.div>

          <div className="space-y-4 max-w-3xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]"
            >
              {displaySettings.heroTitle}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl text-abu-muda/80 font-medium"
            >
              {displaySettings.heroSubtitle}
            </motion.p>
          </div>

          {isAdmin && (
            <Button 
              variant="secondary" 
              onClick={() => setIsEditing(true)}
              className="gap-2 bg-white text-biru-abu hover:bg-abu-muda"
            >
              <Edit2 className="w-4 h-4" />
              Edit Konten Beranda
            </Button>
          )}
        </div>
      </section>

      {/* Welcome Message */}
      <section className="px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-abu-muda text-biru-abu font-bold text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Selamat Datang
          </div>
          <p className="text-2xl md:text-3xl text-slate-700 leading-relaxed font-medium italic">
            "{displaySettings.welcomeText}"
          </p>
        </div>
      </section>

      {/* Quick Stats or Info could go here */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {[
          { title: 'Terhubung', desc: 'Menjalin kembali tali silaturahmi antar alumni Kristen.', icon: HomeIcon },
          { title: 'Melayani', desc: 'Bersama-sama mengambil bagian dalam pelayanan di Kota Ambon.', icon: Sparkles },
          { title: 'Bertumbuh', desc: 'Saling mendukung dalam iman dan pekerjaan yang baik.', icon: GraduationCap },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-12 h-12 bg-abu-muda rounded-2xl flex items-center justify-center mx-auto text-biru-abu">
                <item.icon className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">{item.title}</h4>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
