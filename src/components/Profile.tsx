import React, { useState, useEffect } from 'react';
import { dbService } from '../lib/db';
import { OrgProfile } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Loader2, Save, Edit2, History, Target, Rocket } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileProps {
  isAdmin: boolean;
}

export default function Profile({ isAdmin }: ProfileProps) {
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<OrgProfile>({
    content: '',
    vision: '',
    mission: ''
  });

  useEffect(() => {
    const unsubscribe = dbService.subscribeProfile((data) => {
      setProfile(data);
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
      await dbService.updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
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

  if (isAdmin && (isEditing || !profile)) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Edit Profil Organisasi</h2>
            <p className="text-slate-500">Kelola informasi Tentang Kami</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Perubahan
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="content">Tentang Kami</Label>
              <Textarea 
                id="content" 
                value={formData.content} 
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Tuliskan informasi tentang organisasi..."
                className="min-h-[300px]"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 space-y-4">
        <History className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900">Belum Ada Profil</h3>
        <p className="text-slate-500">Informasi profil organisasi belum tersedia.</p>
        {isAdmin && <Button onClick={() => setIsEditing(true)}>Buat Profil</Button>}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-biru-abu rounded-2xl flex items-center justify-center shadow-lg shadow-abu-muda">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Profil Organisasi</h2>
            <p className="text-slate-500">Mengenal lebih dekat dengan PAK Kota Ambon</p>
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit Profil
          </Button>
        )}
      </div>

      <div className="max-w-3xl mx-auto">
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-biru-abu">
            <History className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Tentang Kami</h3>
          </div>
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-8">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">
                  {profile.content}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </motion.div>
  );
}
