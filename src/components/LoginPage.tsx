import React, { useState, useEffect } from 'react';
import { GraduationCap, AlertCircle, Loader2, User, Lock, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion } from 'motion/react';
import { db, doc, getDoc, setDoc, auth, signInAnonymously } from '@/lib/firebase';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Initialize default credentials if not exists
  useEffect(() => {
    const initAuth = async () => {
      try {
        const adminRef = doc(db, 'admin_settings', 'auth');
        const adminSnap = await getDoc(adminRef);
        
        if (!adminSnap.exists()) {
          await setDoc(adminRef, {
            username: 'admin',
            password: 'admin',
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Error initializing admin auth:", err);
      }
    };
    initAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Sign in anonymously to Firebase to get access to Firestore
      // This is required for security rules to allow reading settings
      try {
        await signInAnonymously(auth);
      } catch (authErr) {
        console.warn("Anonymous sign-in failed, attempting direct read:", authErr);
      }

      // 2. Check credentials in Firestore
      const adminRef = doc(db, 'admin_settings', 'auth');
      let adminSnap = await getDoc(adminRef);
      
      // If for some reason it doesn't exist, create it now
      if (!adminSnap.exists()) {
        await setDoc(adminRef, {
          username: 'admin',
          password: 'admin',
          updatedAt: new Date().toISOString()
        });
        adminSnap = await getDoc(adminRef);
      }

      if (adminSnap.exists()) {
        const data = adminSnap.data();
        if (data.username === username && data.password === password) {
          // Success
          localStorage.setItem('sipak_admin_session', 'active');
          localStorage.setItem('sipak_admin_username', username);
          onLogin();
        } else {
          setError('Username atau Password salah.');
        }
      } else {
        setError('Gagal memverifikasi akun admin. Silakan coba lagi.');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError('Terjadi kesalahan koneksi: ' + (err.message || 'Cek koneksi internet Anda.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">SIPAK KOTA AMBON</h1>
          <p className="text-slate-500">Sistem Informasi Database Alumni PAK</p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden">
          <CardHeader className="space-y-1 text-center pb-2">
            <CardTitle className="text-xl">Login Admin</CardTitle>
            <CardDescription>
              Masukkan username dan password admin
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="admin" 
                    className="pl-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg shadow-blue-100"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 text-center border-t pt-4 bg-slate-50/50 rounded-b-xl">
            <p className="text-xs text-slate-400 px-4">
              Gunakan username 'admin' dan password 'admin' untuk akses pertama kali.
            </p>
          </CardFooter>
        </Card>
        
        <p className="mt-8 text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} SIPAK KOTA AMBON
        </p>
      </motion.div>
    </div>
  );
}
