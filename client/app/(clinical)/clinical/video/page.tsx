'use client';

import { useEffect, useState } from 'react';
import { consultationApi } from '@/lib/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Video, VideoOff, Phone, PhoneOff, Calendar, Clock, User,
  Plus, Loader2, Monitor, MessageSquare,
} from 'lucide-react';

interface VideoSession {
  id: string;
  patientId: string;
  patientName?: string;
  status: string;
  roomName: string;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  notes?: string;
}

export default function VideoConsultationPage() {
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<{ token: string; roomName: string; identity: string } | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [ending, setEnding] = useState<string | null>(null);
  const [endNotes, setEndNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'SCHEDULED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'>('all');

  useEffect(() => {
    loadSessions();
  }, [filter]);

  async function loadSessions() {
    try {
      const params: any = {};
      if (filter !== 'all') params.status = filter;
      const res = await consultationApi.listVideoSessions(params);
      setSessions(res.data.data || []);
    } catch {
      toast.error('Failed to load video sessions');
    } finally {
      setLoading(false);
    }
  }

  async function joinSession(sessionId: string) {
    setJoining(sessionId);
    try {
      const res = await consultationApi.joinVideo(sessionId);
      const data = res.data.data;
      setActiveSession({ token: data.token, roomName: data.roomName, identity: data.identity });
      toast.success('Connected to video room');
    } catch {
      toast.error('Failed to join video session');
    } finally {
      setJoining(null);
    }
  }

  async function endSession(sessionId: string) {
    setEnding(sessionId);
    try {
      await consultationApi.endVideo(sessionId, endNotes);
      setActiveSession(null);
      setEndNotes('');
      toast.success('Consultation ended');
      loadSessions();
    } catch {
      toast.error('Failed to end session');
    } finally {
      setEnding(null);
    }
  }

  const upcoming = sessions.filter(s => ['SCHEDULED', 'WAITING'].includes(s.status));
  const active = sessions.filter(s => s.status === 'IN_PROGRESS');
  const completed = sessions.filter(s => s.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Consultations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and conduct video consultations with patients</p>
        </div>
      </div>

      {/* Active Video Call */}
      {activeSession && (
        <Card>
          <CardBody>
            <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center mb-4 relative">
              <div className="text-center text-white">
                <Monitor className="w-16 h-16 mx-auto mb-3 text-gray-500" />
                <p className="text-sm text-gray-400">Video stream active</p>
                <p className="text-xs text-gray-500 mt-1">Room: {activeSession.roomName}</p>
                <p className="text-xs text-teal-400 mt-1">Connected as: {activeSession.identity}</p>
              </div>
              {/* Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <button className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white" aria-label="Toggle video">
                  <Video className="w-5 h-5" />
                </button>
                <button className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white" aria-label="Toggle audio">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white" aria-label="Chat">
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const session = active[0] || upcoming[0];
                    if (session) endSession(session.id);
                  }}
                  className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white"
                  aria-label="End call"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <textarea
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={2}
                placeholder="Clinical notes for this consultation..."
                value={endNotes}
                onChange={e => setEndNotes(e.target.value)}
                aria-label="Clinical notes"
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'SCHEDULED', 'WAITING', 'IN_PROGRESS', 'COMPLETED'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === f ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">No Video Sessions</h3>
              <p className="text-sm text-gray-500">No video consultations found for the selected filter.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Upcoming / Active */}
          {(upcoming.length > 0 || active.length > 0) && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                {active.length > 0 ? 'Active & Upcoming' : 'Upcoming'}
              </h2>
              <div className="space-y-3">
                {[...active, ...upcoming].map(session => (
                  <Card key={session.id}>
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            session.status === 'IN_PROGRESS' ? 'bg-green-100' : 'bg-teal-100'
                          }`}>
                            <Video className={`w-5 h-5 ${
                              session.status === 'IN_PROGRESS' ? 'text-green-600' : 'text-teal-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{session.patientName || 'Patient'}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDateTime(session.scheduledAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge status={session.status} label={session.status.replace('_', ' ')} dot />
                          {session.status === 'IN_PROGRESS' && activeSession ? (
                            <Button variant="danger" size="sm" onClick={() => endSession(session.id)} disabled={!!ending}>
                              {ending === session.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PhoneOff className="w-3.5 h-3.5" />}
                              End
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => joinSession(session.id)} disabled={!!joining}>
                              {joining === session.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                              Join
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Completed</h2>
              <div className="space-y-2">
                {completed.map(session => (
                  <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <VideoOff className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{session.patientName || 'Patient'}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(session.scheduledAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {session.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.duration} min
                        </span>
                      )}
                      <Badge status="COMPLETED" label="Completed" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
