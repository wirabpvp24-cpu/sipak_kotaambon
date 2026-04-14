import React, { useState, useEffect } from 'react';
import { GraduationCap, AlertCircle, Loader2, User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion } from 'motion/react';
import { db, doc, getDoc, setDoc, auth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from '@/lib/firebase';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user is the default admin email or has admin role in Firestore
      if (user.email === 'wirabpvp24@gmail.com' && user.emailVerified) {
        localStorage.setItem('sipak_admin_session', 'active');
        localStorage.setItem('sipak_admin_username', user.displayName || user.email);
        onLogin();
      } else {
        // Check Firestore for admin role
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().role === 'admin') {
          localStorage.setItem('sipak_admin_session', 'active');
          localStorage.setItem('sipak_admin_username', user.displayName || user.email);
          onLogin();
        } else {
          setError('Email Anda tidak terdaftar sebagai admin.');
          await signOut(auth);
          await signInAnonymously(auth);
        }
      }
    } catch (err: any) {
      console.error("Google Login error:", err);
      setError('Gagal login dengan Google: ' + (err.message || 'Coba lagi.'));
    } finally {
      setIsLoading(false);
    }
  };

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
      try {
        await signInAnonymously(auth);
      } catch (authErr) {
        console.warn("Anonymous sign-in failed:", authErr);
      }

      // 2. Check credentials in Firestore
      const adminRef = doc(db, 'admin_settings', 'auth');
      let adminSnap;
      
      try {
        adminSnap = await getDoc(adminRef);
      } catch (docErr: any) {
        if (docErr.message?.includes('offline')) {
          throw new Error('Koneksi ke database gagal. Pastikan Firestore sudah diaktifkan di Firebase Console dan Project ID sudah benar.');
        }
        throw docErr;
      }
      
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
          <h1 className="text-2xl font-bold text-slate-900">SI GANDONG</h1>
          <p className="text-slate-500 text-center px-4">Sistem Informasi Pengelolaan Data dan Pelayanan Alumni Terintegrasi Persekutuan Alumni Kristen Kota Ambon, Perkantas Maluku</p>
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
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
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
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">Atau</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline"
              className="w-full h-11 border-slate-200 hover:bg-slate-50 transition-all"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Login dengan Google</span>
              </div>
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 text-center border-t pt-4 bg-slate-50/50 rounded-b-xl">
            <p className="text-xs text-slate-400 px-4">
              Hanya admin yang dapat mengakses.
            </p>
          </CardFooter>
        </Card>
        
        <p className="mt-8 text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} PAK KOTA AMBON PERKANTAS MALUKU       
        </p>
      </motion.div>
    </div>
  );
}
