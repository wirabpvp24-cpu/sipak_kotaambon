/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, UserPlus, GraduationCap, Users, LogOut, MessageSquare, Lock, Settings } from 'lucide-react';
import RegistrationForm from './components/RegistrationForm';
import Dashboard from './components/Dashboard';
import AlumniList from './components/AlumniList';
import MessageCenter from './components/MessageCenter';
import LoginPage from './components/LoginPage';
import AdminSettings from './components/AdminSettings';
import { Button } from './components/ui/button';
import { auth, onAuthStateChanged, signOut } from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState('register');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Check local session
    const session = localStorage.getItem('sipak_admin_session');
    if (session === 'active') {
      setIsAdmin(true);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // We keep Firebase auth for Firestore access, but isAdmin is our custom logic
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('sipak_admin_session');
      localStorage.removeItem('sipak_admin_username');
      setIsAdmin(false);
      setActiveTab('register');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Menyiapkan Sistem...</p>
        </div>
      </div>
    );
  }

  // If admin wants to login but not yet authenticated
  if (showLogin && !isAdmin) {
    return (
      <div className="relative">
        <Button 
          variant="ghost" 
          className="absolute top-4 left-4 z-50"
          onClick={() => setShowLogin(false)}
        >
          &larr; Kembali ke Pendaftaran
        </Button>
        <LoginPage onLogin={() => {
          setIsAdmin(true);
          setShowLogin(false);
          setActiveTab('list');
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">SIPAK KOTA AMBON</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Public Tab */}
            <Button 
              variant={activeTab === 'register' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveTab('register')}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Pendaftaran</span>
            </Button>

            {/* Admin Only Tabs */}
            {isAdmin ? (
              <>
                <Button 
                  variant={activeTab === 'list' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setActiveTab('list')}
                  className="gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Data Alumni</span>
                </Button>
                <Button 
                  variant={activeTab === 'dashboard' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setActiveTab('dashboard')}
                  className="gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
                <Button 
                  variant={activeTab === 'messages' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setActiveTab('messages')}
                  className="gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Pesan</span>
                </Button>
                <Button 
                  variant={activeTab === 'settings' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setActiveTab('settings')}
                  className="gap-2"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Pengaturan</span>
                </Button>
                
                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowLogin(true)}
                className="gap-2 border-slate-200 text-slate-600"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Login</span>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8 px-4">
        {activeTab === 'register' && (
          <div className="max-w-4xl mx-auto">
            <RegistrationForm onComplete={() => {
              if (isAdmin) setActiveTab('list');
            }} />
          </div>
        )}
        
        {/* Protected Admin Content */}
        {isAdmin ? (
          <>
            {activeTab === 'list' && (
              <AlumniList />
            )}
            {activeTab === 'dashboard' && (
              <Dashboard />
            )}
            {activeTab === 'messages' && (
              <MessageCenter />
            )}
            {activeTab === 'settings' && (
              <AdminSettings />
            )}
          </>
        ) : (
          activeTab !== 'register' && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Lock className="w-12 h-12 text-slate-300" />
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-900">Akses Terbatas</h3>
                <p className="text-slate-500">Silakan login sebagai admin untuk mengakses halaman ini.</p>
              </div>
              <Button onClick={() => setShowLogin(true)}>Admin Login</Button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} SIPAK KOTA AMBON. Sistem Informasi Database Alumni PAK.</p>
      </footer>
    </div>
  );
}

