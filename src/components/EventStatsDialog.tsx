import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  Users2, 
  UserCheck2, 
  MessageSquare, 
  TrendingUp, 
  PieChart,
  Loader2,
  Calendar,
  ChevronRight,
  Phone
} from 'lucide-react';
import { dbService } from '@/lib/db';
import { Event, EventResponse } from '@/types';

interface EventStatsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
}

export default function EventStatsDialog({ isOpen, onClose, event }: EventStatsDialogProps) {
  const [responses, setResponses] = useState<EventResponse[]>([]);
  const [allResponses, setAllResponses] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && event.id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [eventRes, allRes] = await Promise.all([
            dbService.getEventResponses(event.id!),
            dbService.getAllEventResponses()
          ]);
          setResponses(eventRes);
          setAllResponses(allRes);
        } catch (err) {
          console.error("Error fetching stats:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, event.id]);

  // Current Event Stats
  const attendees = responses.filter(r => r.status === 'Hadir');
  const totalAttendees = event.manualAttendanceEnabled 
    ? (event.manualMaleCount || 0) + (event.manualFemaleCount || 0)
    : attendees.length;
  const maleAttendees = event.manualAttendanceEnabled
    ? (event.manualMaleCount || 0)
    : attendees.filter(r => r.alumniGender === 'Laki-laki').length;
  const femaleAttendees = event.manualAttendanceEnabled
    ? (event.manualFemaleCount || 0)
    : attendees.filter(r => r.alumniGender === 'Perempuan').length;
  const feedbacks = responses.filter(r => r.feedback && r.feedback.trim() !== '');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            Statistik & Masukan Kegiatan
          </DialogTitle>
          <DialogDescription>
            {event.title} - {new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-sm text-slate-500">Memuat data statistik...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Event Specific Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-blue-50/50 border-blue-100">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <Users2 className="w-5 h-5 text-blue-600 mb-2" />
                    <span className="text-2xl font-black text-blue-900">{totalAttendees}</span>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total Hadir</span>
                  </CardContent>
                </Card>
                <Card className="bg-indigo-50/50 border-indigo-100">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <UserCheck2 className="w-5 h-5 text-indigo-600 mb-2" />
                    <span className="text-2xl font-black text-indigo-900">{maleAttendees}</span>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Laki-laki</span>
                  </CardContent>
                </Card>
                <Card className="bg-pink-50/50 border-pink-100">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <UserCheck2 className="w-5 h-5 text-pink-600 mb-2" />
                    <span className="text-2xl font-black text-pink-900">{femaleAttendees}</span>
                    <span className="text-[10px] font-bold text-pink-600 uppercase tracking-wider">Perempuan</span>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Feedback Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    Saran & Masukan Alumni
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {feedbacks.length} Masukan
                  </Badge>
                </div>

                <div className="space-y-3">
                  {feedbacks.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-400">Belum ada saran atau masukan untuk kegiatan ini.</p>
                    </div>
                  ) : (
                    feedbacks.map((res) => (
                      <div key={res.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                res.alumniGender === 'Laki-laki' ? "bg-blue-400" : "bg-pink-400"
                              )}></div>
                              <span className="text-xs font-bold text-slate-700">{res.alumniName}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Phone className="w-2.5 h-2.5" />
                              {res.phone}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(res.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 italic leading-relaxed">
                          "{res.feedback}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
