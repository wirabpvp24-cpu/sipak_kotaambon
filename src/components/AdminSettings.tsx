import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Save, User, Lock, CheckCircle2, RefreshCw, Database, AlertCircle } from 'lucide-react';
import { db, doc, getDoc, updateDoc } from '@/lib/firebase';
import { dbService } from '@/lib/db';

export default function AdminSettings() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [syncMessage, setSyncMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const adminRef = doc(db, 'admin_settings', 'auth');
        const adminSnap = await getDoc(adminRef);
        if (adminSnap.exists()) {
          const data = adminSnap.data();
          setUsername(data.username);
          setPassword(data.password);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const adminRef = doc(db, 'admin_settings', 'auth');
      await updateDoc(adminRef, {
        username,
        password,
        updatedAt: new Date().toISOString()
      });
      setMessage({ type: 'success', text: 'Username dan Password berhasil diperbarui!' });
      localStorage.setItem('sipak_admin_username', username);
    } catch (err) {
      console.error("Error updating settings:", err);
      setMessage({ type: 'error', text: 'Gagal menyimpan perubahan.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage({ type: '', text: '' });
    try {
      const result = await dbService.syncDatabase();
      setSyncMessage({
        type: 'success',
        text: `Sinkronisasi berhasil! ${result.updated} data diperbarui dari total ${result.total} data.`
      });
    } catch (err) {
      console.error("Sync error:", err);
      setSyncMessage({ type: 'error', text: 'Gagal melakukan sinkronisasi database.' });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Lock className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pengaturan Admin</h2>
          <p className="text-slate-500">Ubah kredensial akses sistem</p>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Kredensial Login</CardTitle>
          <CardDescription>
            Username dan password ini digunakan untuk masuk ke halaman admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {message.text && (
              <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}>
                {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username Baru</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type="text" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Tips: Gunakan kombinasi huruf dan angka yang sulit ditebak.
                </p>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan Perubahan
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg border-t-4 border-t-amber-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-lg">Sinkronisasi Database</CardTitle>
          </div>
          <CardDescription>
            Gunakan fitur ini untuk memastikan semua data alumni lama memiliki Kode Unik yang sesuai dengan format terbaru.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncMessage.text && (
            <Alert className={syncMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}>
              {syncMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{syncMessage.text}</AlertDescription>
            </Alert>
          )}
          
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <p className="text-sm text-amber-800 leading-relaxed">
              Fitur ini akan memindai seluruh database alumni dan menggenerate Kode Unik bagi data yang belum memilikinya. 
              Proses ini aman dan tidak akan mengubah data pribadi alumni.
            </p>
          </div>

          <Button 
            onClick={handleSync}
            disabled={isSyncing}
            variant="outline"
            className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isSyncing ? 'Sedang Sinkronisasi...' : 'Mulai Sinkronisasi Database'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
