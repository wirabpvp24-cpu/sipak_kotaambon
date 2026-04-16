import React, { useState, useEffect } from 'react';
import { dbService } from '../lib/db';
import { OrgProfile, ProfileSection } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Loader2, Save, Edit2, History, Target, Rocket, ChevronRight, Layout, Info, Network, Trash2, X, Plus, MoveUp, MoveDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import RichTextEditor from './RichTextEditor';
import { toast } from 'sonner';

interface ProfileProps {
  isAdmin: boolean;
}

export default function Profile({ isAdmin }: ProfileProps) {
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>('about');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [sectionFormData, setSectionFormData] = useState<ProfileSection | null>(null);
  const [formData, setFormData] = useState<OrgProfile>({
    content: '',
    imageUrl: '',
    vision: '',
    mission: ''
  });

  useEffect(() => {
    const unsubscribeProfile = dbService.subscribeProfile((data) => {
      setProfile(data);
      if (data) {
        setFormData(data);
      }
    });

    const unsubscribeSections = dbService.subscribeProfileSections((data) => {
      setSections(data);
      setIsLoading(false);
    });

    const handleSectionChange = (e: any) => {
      if (e.detail) {
        setActiveSectionId(e.detail);
      }
    };

    window.addEventListener('change-profile-section', handleSectionChange);

    return () => {
      unsubscribeProfile();
      unsubscribeSections();
      window.removeEventListener('change-profile-section', handleSectionChange);
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dbService.updateProfile(formData);
      setIsEditing(false);
      toast.success('Profil utama berhasil diperbarui');
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error('Gagal menyimpan profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSection = async () => {
    if (!sectionFormData) return;
    setIsSaving(true);
    try {
      if (isAddingSection) {
        await dbService.addProfileSection({
          ...sectionFormData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Bagian profil berhasil ditambahkan');
      } else {
        await dbService.updateProfileSection(sectionFormData);
        toast.success('Bagian profil berhasil diperbarui');
      }
      setIsEditingSection(false);
      setIsAddingSection(false);
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error('Gagal menyimpan bagian profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const temp = newSections[index].order;
    newSections[index].order = newSections[targetIndex].order;
    newSections[targetIndex].order = temp;

    try {
      await Promise.all([
        dbService.updateProfileSection(newSections[index]),
        dbService.updateProfileSection(newSections[targetIndex])
      ]);
      toast.success('Urutan diperbarui');
    } catch (error) {
      console.error("Error moving order:", error);
      toast.error('Gagal mengubah urutan');
    }
  };

  const handleDeleteSection = async () => {
    if (activeSectionId === 'about') return;
    setIsSaving(true);
    try {
      await dbService.deleteProfileSection(activeSectionId);
      setActiveSectionId('about');
      setDeleteConfirm(false);
      toast.success('Bagian profil berhasil dihapus');
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error('Gagal menghapus bagian profil');
    } finally {
      setIsSaving(false);
    }
  };

  const getIconForTitle = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('struktur')) return <Network className="w-4 h-4" />;
    if (t.includes('karakteristik')) return <Info className="w-4 h-4" />;
    if (t.includes('pola')) return <Layout className="w-4 h-4" />;
    return <ChevronRight className="w-4 h-4" />;
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
            <h2 className="text-2xl font-bold text-slate-900">Edit Profil Utama</h2>
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
              <Label htmlFor="imageUrl">URL Gambar Utama (Opsional)</Label>
              <Input 
                id="imageUrl" 
                value={formData.imageUrl || ''} 
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Tentang Kami</Label>
              <RichTextEditor 
                value={formData.content} 
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Tuliskan informasi tentang organisasi..."
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const activeSection = activeSectionId === 'about' 
    ? { 
        title: 'Tentang Kami', 
        content: profile?.content || '', 
        imageUrl: profile?.imageUrl,
        icon: <History className="w-5 h-5" /> 
      }
    : activeSectionId === 'new'
      ? {
          title: sectionFormData?.title || 'Bagian Baru',
          content: sectionFormData?.content || '',
          imageUrl: sectionFormData?.imageUrl || '',
          icon: <Plus className="w-5 h-5" />
        }
      : sections.find(s => s.id === activeSectionId) 
      ? { 
          title: sections.find(s => s.id === activeSectionId)!.title, 
          content: sections.find(s => s.id === activeSectionId)!.content,
          imageUrl: sections.find(s => s.id === activeSectionId)!.imageUrl,
          icon: getIconForTitle(sections.find(s => s.id === activeSectionId)!.title)
        }
      : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-biru-abu rounded-2xl flex items-center justify-center shadow-xl shadow-abu-muda shrink-0">
            <History className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Profil Organisasi</h2>
            <p className="text-slate-500">Mengenal lebih dekat dengan PAK Kota Ambon</p>
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2 self-start md:self-center">
            <Edit2 className="w-4 h-4" />
            Edit Profil Utama
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveSectionId('about')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-bold",
              activeSectionId === 'about' 
                ? "bg-biru-abu text-white shadow-lg shadow-abu-muda" 
                : "text-slate-600 hover:bg-white hover:shadow-sm"
            )}
          >
            <History className="w-4 h-4" />
            Tentang Kami
          </button>

          {sections.map((section, index) => (
            <div key={section.id} className="group relative">
              <button
                onClick={() => {
                  setActiveSectionId(section.id!);
                  setIsEditingSection(false);
                  setIsAddingSection(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-bold",
                  activeSectionId === section.id 
                    ? "bg-biru-abu text-white shadow-lg shadow-abu-muda" 
                    : "text-slate-600 hover:bg-white hover:shadow-sm"
                )}
              >
                {getIconForTitle(section.title)}
                <span className="truncate pr-8">{section.title}</span>
              </button>
              
              {isAdmin && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    disabled={index === 0}
                    onClick={(e) => { e.stopPropagation(); handleMoveOrder(index, 'up'); }}
                    className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30"
                  >
                    <MoveUp className="w-3 h-3" />
                  </button>
                  <button 
                    disabled={index === sections.length - 1}
                    onClick={(e) => { e.stopPropagation(); handleMoveOrder(index, 'down'); }}
                    className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30"
                  >
                    <MoveDown className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {isAdmin && (
            <Button 
              variant="outline" 
              className="w-full border-dashed border-2 hover:border-biru-abu hover:bg-biru-abu/5 text-biru-abu font-bold py-6 rounded-xl gap-2"
              onClick={() => {
                setSectionFormData({
                  title: '',
                  content: '',
                  imageUrl: '',
                  order: sections.length > 0 ? Math.max(...sections.map(s => s.order)) + 1 : 0,
                  updatedAt: new Date().toISOString()
                });
                setIsAddingSection(true);
                setIsEditingSection(true);
                setActiveSectionId('new');
              }}
            >
              <Plus className="w-4 h-4" />
              Tambah Bagian
            </Button>
          )}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeSection ? (
              <motion.div
                key={activeSectionId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3 text-biru-abu">
                    <div className="p-2 bg-abu-muda rounded-lg">
                      {activeSection.icon}
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-wider">{activeSection.title}</h3>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      {activeSectionId !== 'about' && activeSectionId !== 'new' && (
                        <>
                          {deleteConfirm ? (
                            <div className="flex items-center gap-2 bg-red-50 p-1 rounded-lg border border-red-100">
                              <span className="text-xs font-bold text-red-600 px-2">Hapus?</span>
                              <Button variant="destructive" size="xs" onClick={handleDeleteSection} disabled={isSaving}>Ya</Button>
                              <Button variant="outline" size="xs" onClick={() => setDeleteConfirm(false)} disabled={isSaving}>Tidak</Button>
                            </div>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteConfirm(true)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const section = sections.find(s => s.id === activeSectionId);
                              if (section) {
                                setSectionFormData(section);
                                setIsEditingSection(true);
                              }
                            }}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Bagian
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Card className="border-none shadow-xl bg-white overflow-hidden">
                  {activeSection.imageUrl && (
                    <div className="w-full h-[300px] md:h-[400px] overflow-hidden">
                      <img 
                        src={activeSection.imageUrl} 
                        alt={activeSection.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <CardContent className="p-8 md:p-12">
                    {isAdmin && isEditingSection && sectionFormData ? (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label>Judul Bagian</Label>
                          <Input 
                            value={sectionFormData.title}
                            onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>URL Gambar</Label>
                          <Input 
                            value={sectionFormData.imageUrl || ''}
                            onChange={(e) => setSectionFormData({ ...sectionFormData, imageUrl: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Konten</Label>
                          <RichTextEditor 
                            value={sectionFormData.content}
                            onChange={(content) => setSectionFormData({ ...sectionFormData, content })}
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsEditingSection(false);
                              setIsAddingSection(false);
                              if (activeSectionId === 'new') setActiveSectionId('about');
                            }} 
                            disabled={isSaving}
                          >
                            Batal
                          </Button>
                          <Button onClick={handleSaveSection} disabled={isSaving} className="gap-2">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isAddingSection ? 'Tambah Bagian' : 'Simpan Bagian'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-lg ql-editor !p-0"
                        dangerouslySetInnerHTML={{ __html: activeSection.content }}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Info className="w-12 h-12 mb-4 opacity-20" />
                <p>Pilih bagian untuk melihat detail.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
