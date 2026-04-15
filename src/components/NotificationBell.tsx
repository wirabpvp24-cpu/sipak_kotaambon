import React, { useState, useEffect, useRef } from 'react';
import { Bell, Cake, Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Alumni, Event } from '@/types';
import { dbService } from '@/lib/db';
import { cn } from '@/lib/utils';

export default function NotificationBell() {
  const [alumniList, setAlumniList] = useState<Alumni[]>([]);
  const [eventList, setEventList] = useState<Event[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeAlumni = dbService.subscribeAlumni((data) => {
      setAlumniList(data);
    });

    const unsubscribeEvents = dbService.subscribeEvents((data) => {
      setEventList(data);
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      unsubscribeAlumni();
      unsubscribeEvents();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getGroupedBirthdayReminders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reminders = alumniList.filter(alumni => {
      const birthDate = new Date(alumni.birthDate);
      const bDayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      
      const diffTime = bDayThisYear.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Hari ini (0), Besok (1), Lusa (2)
      return diffDays >= 0 && diffDays <= 2;
    });

    const groups: Record<string, { diffDays: number, date: Date, alumni: { name: string, age: number }[] }> = {};
    
    reminders.forEach(alumni => {
      const birthDate = new Date(alumni.birthDate);
      const bDayThisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      const key = `${bDayThisYear.getMonth()}-${bDayThisYear.getDate()}`;
      
      const diffTime = bDayThisYear.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const age = today.getFullYear() - birthDate.getFullYear();

      if (!groups[key]) {
        groups[key] = {
          diffDays,
          date: bDayThisYear,
          alumni: []
        };
      }
      groups[key].alumni.push({ name: alumni.fullName, age });
    });

    return Object.values(groups).sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const getEventReminders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return eventList.filter(ev => {
      const eventDate = new Date(ev.date);
      eventDate.setHours(0, 0, 0, 0);
      
      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Only H-1 and H-2 (Besok and Lusa)
      return diffDays >= 1 && diffDays <= 2;
    }).map(ev => {
      const eventDate = new Date(ev.date);
      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...ev, diffDays };
    }).sort((a, b) => a.diffDays - b.diffDays);
  };

  const groupedReminders = getGroupedBirthdayReminders();
  const eventReminders = getEventReminders();
  const totalNotifications = groupedReminders.length + eventReminders.length;

  return (
    <div className="relative" ref={bellRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn(
          "relative rounded-full hover:bg-slate-100 transition-colors",
          isOpen && "bg-slate-100"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className={cn("w-5 h-5", totalNotifications > 0 ? "text-orange-500 animate-pulse" : "text-slate-500")} />
        {totalNotifications > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {totalNotifications}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-[100] animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" />
              Notifikasi
            </h3>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600">
              {totalNotifications} Baru
            </Badge>
          </div>

          <ScrollArea className="h-[450px]">
            <div className="p-2 space-y-1">
              {totalNotifications > 0 ? (
                <>
                  {/* Event Reminders */}
                  {eventReminders.map((event) => (
                    <div key={event.id} className="p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          event.diffDays === 1 ? "bg-abu-muda text-biru-abu" : "bg-indigo-100 text-indigo-600"
                        )}>
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900">
                            {event.diffDays === 1 ? 'Besok!' : 'Lusa!'}
                          </p>
                          <p className="text-xs text-slate-500 mb-1">
                            Kegiatan: <span className="font-semibold text-slate-700">{event.title}</span>
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Birthday Reminders */}
                  {groupedReminders.map((group, idx) => (
                    <div key={idx} className="p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          group.diffDays === 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                        )}>
                          <Cake className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900">
                            {group.diffDays === 0 ? 'Hari Ini!' : 
                             group.diffDays === 1 ? 'Besok!' : 
                             `Tanggal ${group.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}`}
                          </p>
                          <p className="text-xs text-slate-500 mb-2">
                            {group.diffDays === 0 ? 'Sedang berulang tahun:' : 
                             group.diffDays === 1 ? 'Besok akan berulang tahun:' : 
                             'Akan berulang tahun:'}
                          </p>
                          <div className="space-y-1">
                            {group.alumni.map((a, i) => (
                              <div key={i} className="flex items-center justify-between bg-white p-2 rounded border border-slate-100 shadow-sm">
                                <span className="text-xs font-medium text-slate-700 truncate pr-2">{a.name}</span>
                                <Badge variant="outline" className="text-[9px] h-4 px-1 bg-abu-muda text-biru-abu border-abu-muda shrink-0">
                                  Ke-{a.age}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">Tidak ada notifikasi</p>
                  <p className="text-xs text-slate-400">Semua pengingat ulang tahun sudah diperiksa.</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <p className="text-[10px] text-center text-slate-400">
              Kegiatan: H-1 s/d H-2 | Ultah: H-0 s/d H-2
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
