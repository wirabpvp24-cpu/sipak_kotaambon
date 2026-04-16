/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, UserPlus, GraduationCap, Users, LogOut, MessageSquare, Lock, Settings, Calendar, History, Inbox, BookOpen, ChevronDown } from 'lucide-react';
import RegistrationForm from './components/RegistrationForm';
import Dashboard from './components/Dashboard';
import AlumniList from './components/AlumniList';
import MessageCenter from './components/MessageCenter';
import EventSchedule from './components/EventSchedule';
import LoginPage from './components/LoginPage';
import AdminSettings from './components/AdminSettings';
import AdminSuggestions from './components/AdminSuggestions';
import SuggestionBox from './components/SuggestionBox';
import NotificationBell from './components/NotificationBell';
import WelcomeModal from './components/WelcomeModal';
import ContactModal from './components/ContactModal';
import Profile from './components/Profile';
import Home from './components/Home';
import { Button } from './components/ui/button';
import { auth, onAuthStateChanged, signOut, signInAnonymously, db } from './lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Phone } from 'lucide-react';
import { Toaster } from 'sonner';
import { ProfileSection } from './types';
import { dbService } from './lib/db';
import { cn } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState('register');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [showSuggestionBox, setShowSuggestionBox] = useState(false);
  const [unreadSuggestions, setUnreadSuggestions] = useState(0);
  const [profileSections, setProfileSections] = useState<ProfileSection[]>([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    const unsubscribe = dbService.subscribeProfileSections((data) => {
      setProfileSections(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, 'suggestions'), where('isRead', '==', false));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUnreadSuggestions(snapshot.size);
      });
      return () => unsubscribe();
    }
  }, [isAdmin]);

  useEffect(() => {
    // Check local session
    const session = localStorage.getItem('sipak_admin_session');
    if (session === 'active') {
      setIsAdmin(true);
      // Ensure we are signed in to Firebase for Firestore access
      if (!auth.currentUser) {
        signInAnonymously(auth).catch(err => console.error("Auto-login failed:", err));
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        try {
          await signInAnonymously(auth);
          // The listener will fire again once signed in
          return;
        } catch (err) {
          console.error("Anonymous sign-in failed:", err);
          setIsAuthReady(true); // Set ready anyway so we don't hang, but with error
        }
      } else {
        setIsAuthReady(true);
      }
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
      <div className="min-h-screen flex items-center justify-center bg-abu-muda">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-biru-abu border-t-transparent rounded-full animate-spin"></div>
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
          &larr; Kembali
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
    <div className="min-h-screen bg-background font-sans text-slate-900">
      {showWelcome && !isAdmin && (
        <WelcomeModal 
          onSelectRegister={() => {
            setActiveTab('register');
            setShowWelcome(false);
          }}
          onSelectInfo={() => {
            setActiveTab('schedule');
            setShowWelcome(false);
          }}
          onSelectProfile={() => {
            setActiveTab('profile');
            setShowWelcome(false);
          }}
          onSelectContact={() => {
            setShowContact(true);
            setShowWelcome(false);
          }}
        />
      )}

      <ContactModal 
        isOpen={showContact} 
        onClose={() => setShowContact(false)} 
      />

      <SuggestionBox 
        isOpen={showSuggestionBox} 
        onClose={() => setShowSuggestionBox(false)}
        onSuccess={() => {
          setShowSuggestionBox(false);
          setActiveTab('register');
        }}
      />

      {/* Header Marquee */}
      <div className="py-3 bg-biru-abu overflow-hidden shrink-0">
        <div className="animate-marquee">
          <span className="text-white font-black tracking-[0.2em] text-sm uppercase px-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            Selamat Datang di Persekutuan Alumni Kristen Kota Ambon, Perkantas Maluku
          </span>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-abu-muda">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-biru-abu rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">SI GANDONG</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Public Tabs */}
            <div className="relative group">
              <Button 
                variant={activeTab === 'profile' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setActiveTab('profile')}
                onMouseEnter={() => setShowProfileDropdown(true)}
                className="gap-2"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Profil</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showProfileDropdown ? "rotate-180" : "")} />
              </Button>

              {/* Dropdown Submenu */}
              <div 
                className={cn(
                  "absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-abu-muda py-2 transition-all duration-200 z-[60]",
                  showProfileDropdown ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-2 invisible"
                )}
                onMouseLeave={() => setShowProfileDropdown(false)}
              >
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setShowProfileDropdown(false);
                    // We need a way to tell Profile.tsx to show 'about'
                    window.dispatchEvent(new CustomEvent('change-profile-section', { detail: 'about' }));
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-abu-muda hover:text-biru-abu transition-colors text-left"
                >
                  <History className="w-4 h-4" />
                  Tentang Kami
                </button>
                {profileSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveTab('profile');
                      setShowProfileDropdown(false);
                      window.dispatchEvent(new CustomEvent('change-profile-section', { detail: section.id }));
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-abu-muda hover:text-biru-abu transition-colors text-left"
                  >
                    <BookOpen className="w-4 h-4" />
                    {section.title}
                  </button>
                ))}
              </div>
            </div>

            <Button 
              variant={activeTab === 'schedule' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveTab('schedule')}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Info Kegiatan</span>
            </Button>

            <Button 
              variant={activeTab === 'register' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveTab('register')}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Pendaftaran</span>
            </Button>

            {!isAdmin && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowContact(true)}
                  className="gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Kontak</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSuggestionBox(true)}
                  className="w-9 p-0 text-biru-abu hover:text-biru-cerah hover:bg-abu-muda"
                  title="Kotak Saran & Pokok Doa"
                >
                  <Inbox className="w-4 h-4" />
                </Button>
              </>
            )}

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
                  variant={activeTab === 'suggestions' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setActiveTab('suggestions')}
                  className="w-9 p-0 relative"
                  title="Kotak Saran & Pokok Doa"
                >
                  <Inbox className="w-4 h-4" />
                  {unreadSuggestions > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadSuggestions > 9 ? '9+' : unreadSuggestions}
                    </span>
                  )}
                </Button>

                <Button 
                  variant={activeTab === 'settings' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setActiveTab('settings')}
                  className="w-9 p-0"
                  title="Pengaturan"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                
                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
                
                <NotificationBell />

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
                className="w-9 p-0 border-slate-200 text-slate-600"
                title="Admin Login"
              >
                <Lock className="w-4 h-4" />
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

        {activeTab === 'profile' && (
          <Profile isAdmin={isAdmin} />
        )}

        {activeTab === 'schedule' && (
          <EventSchedule isAdmin={isAdmin} />
        )}
        
        {/* Protected Admin Content */}
        {isAdmin && (
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
            {activeTab === 'suggestions' && (
              <AdminSuggestions />
            )}
            {activeTab === 'settings' && (
              <AdminSettings />
            )}
          </>
        )}

        {!isAdmin && activeTab !== 'register' && activeTab !== 'schedule' && activeTab !== 'profile' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Lock className="w-12 h-12 text-slate-300" />
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">Akses Terbatas</h3>
              <p className="text-slate-500">Silakan login sebagai admin untuk mengakses halaman ini.</p>
            </div>
            <Button onClick={() => setShowLogin(true)}>Admin Login</Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} SI GANDONG. Sistem Informasi Pengelolaan Data dan Pelayanan Alumni Terintegrasi Persekutuan Alumni Kristen Kota Ambon, Perkantas Maluku.</p>
      </footer>
      <Toaster position="top-center" richColors />
    </div>
  );
}

