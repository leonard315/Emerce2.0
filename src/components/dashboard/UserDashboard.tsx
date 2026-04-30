
"use client";

import { useState } from 'react';
import { collection, doc, writeBatch, query, orderBy, serverTimestamp as firestoreTimestamp } from 'firebase/firestore';
import { ref, push, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import { useFirestore, useCollection, useDatabase, useMemoFirebase } from '@/firebase';
import { EmergencyAlert, EmergencyType } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Shield, Activity, AlertTriangle, Star, Zap, Info, Radio, Menu, MapPin, Clock, Loader2, Navigation } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { UserSidebar } from "./UserSidebar";
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(m => m.Circle), { ssr: false });

export function UserDashboard() {
  const { profile } = useAuth();
  const db = useFirestore();
  const rtdb = useDatabase();
  const { toast } = useToast();
  
  const [currentView, setCurrentView] = useState("home");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EmergencyType | 'all' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'acquiring' | 'acquired' | 'denied'>('idle');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapMounted, setMapMounted] = useState(false);

  // Load leaflet CSS on mount
  useState(() => {
    import('leaflet/dist/leaflet.css');
  });

  const [easeOfUse, setEaseOfUse] = useState([3]);
  const [reliability, setReliability] = useState([3]);
  const [comments, setComments] = useState("");

  const alertsQuery = useMemoFirebase(() => {
    if (!profile || !db) return null;
    return query(
      collection(db, 'users', profile.uid, 'alerts'),
      orderBy('timestamp', 'desc')
    );
  }, [db, profile?.uid]);

  const { data: alertsData, isLoading: alertsLoading } = useCollection<EmergencyAlert>(alertsQuery);
  const alerts = alertsData || [];

  const confirmAlert = async () => {
    if (!selectedType || !profile || !db) return;
    setIsSubmitting(true);
    setConfirmOpen(false);
    setGpsStatus('acquiring');

    let location = null;
    try {
      toast({ title: "📍 Acquiring GPS...", description: "Getting your location for responders." });
      const pos = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000, enableHighAccuracy: true })
      );
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      setGpsStatus('acquired');
      toast({ title: "✅ Location acquired", description: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` });
    } catch (e) {
      setGpsStatus('denied');
      toast({ 
        variant: "destructive", 
        title: "⚠️ Location unavailable", 
        description: "Alert sent without GPS. Please enable location for faster response." 
      });
    }

    const alertId = doc(collection(db, 'temp')).id;
    const alertData = {
      id: alertId,
      userId: profile.uid,
      userName: profile.name,
      type: selectedType === 'all' ? 'medical' : selectedType,
      color: selectedType === 'fire' ? 'orange' : selectedType === 'crime' ? 'blue' : 'red',
      location,
      status: 'pending' as const,
      timestamp: firestoreTimestamp(),
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'users', profile.uid, 'alerts', alertId), alertData);
    
    if (selectedType === 'all') {
      batch.set(doc(db, 'agency_alerts_fire', alertId), alertData);
      batch.set(doc(db, 'agency_alerts_police', alertId), alertData);
      batch.set(doc(db, 'agency_alerts_medical', alertId), alertData);
    } else {
      const agencyCollection = selectedType === 'fire' ? 'agency_alerts_fire' : 
                            selectedType === 'crime' ? 'agency_alerts_police' : 
                            'agency_alerts_medical';
      batch.set(doc(db, agencyCollection, alertId), alertData);
    }
    
    batch.set(doc(db, 'all_alerts', alertId), alertData);
    
    await batch.commit();

    if (rtdb) {
      push(ref(rtdb, 'live-logs'), {
        action: `Emergency Node Triggered: ${selectedType.toUpperCase()}`,
        userName: profile.name,
        timestamp: rtdbTimestamp()
      });
    }

    toast({ title: "SIGNAL TRANSMITTED", description: "Emergency units have been notified." });
    setIsSubmitting(false);
    setSelectedType(null);
  };

  const submitFeedback = async () => {
    if (!profile || !db) return;
    const feedbackId = doc(collection(db, 'temp')).id;
    const feedbackData = {
      id: feedbackId,
      userId: profile.uid,
      easeOfUse: easeOfUse[0],
      reliability: reliability[0],
      comments,
      timestamp: firestoreTimestamp(),
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'users', profile.uid, 'questionnaire_responses', feedbackId), feedbackData);
    batch.set(doc(db, 'all_questionnaire_responses', feedbackId), feedbackData);
    await batch.commit();
    toast({ title: "Feedback Received" });
    setFeedbackOpen(false);
  };

  const emergencyButtons = [
    { type: 'fire' as const, color: 'bg-[#f97316]', icon: Flame, title: 'FIRE', subtitle: 'Bureau of Fire Protection' },
    { type: 'crime' as const, color: 'bg-[#2563eb]', icon: Shield, title: 'POLICE', subtitle: 'Philippine National Police' },
    { type: 'medical' as const, color: 'bg-[#dc2626]', icon: Activity, title: 'MEDICAL', subtitle: 'Emergency Medical Services' },
    { type: 'all' as const, color: 'bg-[#1e293b]', icon: AlertTriangle, title: 'ALL AGENCIES', subtitle: 'BFP + PNP + EMS' },
  ];

  const satelliteMapImg = PlaceHolderImages.find(img => img.id === 'satellite-map')?.imageUrl;

  return (
    <SidebarProvider>
      <UserSidebar currentView={currentView} onViewChange={setCurrentView} />
      <SidebarInset className="bg-[#020617] border-l border-white/5">
        <div className="space-y-8 max-w-[1400px] mx-auto p-4 lg:p-10 pb-20 animate-in fade-in duration-700">
          
          {currentView === "home" && (
            <>
              <div className="flex items-center gap-4 bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 mb-10 shadow-2xl">
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-white/10">
                  <Menu className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Hi, {profile?.name} 👋</h1>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Tap an emergency button to report instantly</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Select Emergency Type</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {emergencyButtons.map((btn) => (
                    <Button 
                      key={btn.type} 
                      onClick={() => { setSelectedType(btn.type); setConfirmOpen(true); }} 
                      disabled={isSubmitting} 
                      className={cn(
                        "h-[280px] rounded-[3rem] flex flex-col items-center justify-center gap-6 transition-all active:scale-95 relative overflow-hidden",
                        btn.color,
                        "hover:brightness-110 shadow-2xl border-none"
                      )}
                    >
                      <div className="space-y-6 text-center">
                        <btn.icon className="h-16 w-16 mx-auto text-white" />
                        <div className="space-y-2">
                          <span className="text-3xl font-black block text-white tracking-[0.1em] italic leading-none">{btn.title}</span>
                          <span className="text-[10px] font-black block text-white/70 uppercase tracking-[0.2em]">{btn.subtitle}</span>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-16">
                <Card className="bg-slate-900/40 border-white/5 lg:col-span-2 overflow-hidden shadow-2xl rounded-[3rem]">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-8 px-10">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Transmission History</CardTitle>
                    <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white">
                          <Star className="h-4 w-4 mr-2" /> Evaluation
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-950 border-white/5 rounded-[3rem] p-10">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter italic">System Evaluation</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-10 py-8">
                          <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Ease of Use</Label>
                            <Slider value={easeOfUse} onValueChange={setEaseOfUse} max={5} min={1} step={1} className="py-4" />
                          </div>
                          <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Reliability</Label>
                            <Slider value={reliability} onValueChange={setReliability} max={5} min={1} step={1} className="py-4" />
                          </div>
                          <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Comments</Label>
                            <Textarea value={comments} onChange={(e) => setComments(e.target.value)} className="bg-slate-900 border-white/10 rounded-2xl h-32" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={submitFeedback} className="w-full h-16 bg-primary font-black uppercase tracking-[0.3em] rounded-2xl">Submit Report</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-b border-white/5">
                          <TableHead className="px-10 h-16 font-black uppercase text-[10px] text-slate-500 tracking-[0.3em]">Sector</TableHead>
                          <TableHead className="h-16 font-black uppercase text-[10px] text-slate-500 tracking-[0.3em]">Time</TableHead>
                          <TableHead className="px-10 h-16 font-black uppercase text-[10px] text-slate-500 tracking-[0.3em] text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alerts.map((alert) => (
                          <TableRow key={alert.id} className="border-b border-white/5 hover:bg-white/5">
                            <TableCell className="px-10 py-6 font-black uppercase text-sm text-white italic tracking-tight">
                              <div className="flex items-center gap-4">
                                <div className={cn("h-2.5 w-2.5 rounded-full", alert.type === 'fire' ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : alert.type === 'crime' ? 'bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]')} />
                                {alert.type}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-mono font-black text-slate-500">
                              {alert.timestamp?.seconds ? format(alert.timestamp.toDate(), 'HH:mm:ss') : 'SYNCING'}
                            </TableCell>
                            <TableCell className="px-10 text-right">
                              <Badge variant="outline" className={cn(
                                "font-black uppercase text-[10px] tracking-[0.3em] border-none px-4 py-2 rounded-xl",
                                alert.status === 'pending' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                              )}>{alert.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/40 border-white/5 rounded-[3rem] p-10 space-y-10 shadow-2xl">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Grid Telemetry</h3>
                    <p className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Secure Protocol</p>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em]">
                      <span className="text-slate-500">Latency</span><span className="text-green-500">0.4ms</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-full animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.8)]" />
                    </div>
                    <div className="p-6 bg-slate-950/80 rounded-[2rem] border border-white/5 flex gap-5 mt-10 shadow-inner">
                      <Info className="h-6 w-6 text-primary shrink-0" />
                      <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">Biometric Mesh link established. Satellite position optimized for real-time response.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}

          {currentView === "reports" && (
            <div className="space-y-10">
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic">My Incident Log</h1>
              <Card className="bg-slate-900/40 border-white/5 rounded-[3rem] overflow-hidden">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-b border-white/5">
                        <TableHead className="px-10 h-20 font-black uppercase text-[10px] tracking-[0.4em]">Signal Type</TableHead>
                        <TableHead className="h-20 font-black uppercase text-[10px] tracking-[0.4em]">Vector</TableHead>
                        <TableHead className="h-20 font-black uppercase text-[10px] tracking-[0.4em]">Response</TableHead>
                        <TableHead className="px-10 h-20 font-black uppercase text-[10px] tracking-[0.4em] text-right">Status</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {alerts.map(alert => (
                        <TableRow key={alert.id} className="border-b border-white/5 hover:bg-white/5">
                          <TableCell className="px-10 py-8 font-black uppercase text-white italic">{alert.type}</TableCell>
                          <TableCell className="text-xs font-mono text-slate-500">
                            {alert.location ? `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}` : 'UNKNOWN'}
                          </TableCell>
                          <TableCell className="text-xs font-black text-slate-300 uppercase italic">
                            {alert.responderName || 'Awaiting Node...'}
                          </TableCell>
                          <TableCell className="px-10 text-right">
                             <Badge className={cn(
                               "uppercase font-black text-[10px] tracking-widest border-none px-4 py-2 rounded-xl",
                               alert.status === 'pending' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                             )}>
                                {alert.status}
                             </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {currentView === "map" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">My Location Map</h1>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white hover:bg-white/5 gap-2"
                  onClick={() => {
                    setMapMounted(false);
                    setTimeout(() => setMapMounted(true), 100);
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(pos => {
                        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
                      });
                    }
                  }}
                >
                  <Navigation className="h-4 w-4" /> Refresh Location
                </Button>
              </div>

              {/* GPS status */}
              {gpsStatus === 'denied' && (
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-bold flex items-center gap-2">
                  ⚠️ Location access denied. Enable GPS in browser settings for accurate emergency reporting.
                </div>
              )}
              {gpsStatus === 'acquired' && userLocation && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold flex items-center gap-2">
                  ✅ GPS Active — {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}
                </div>
              )}

              <Card className="bg-[#020617] border-white/5 rounded-[2rem] overflow-hidden h-[500px]">
                {typeof window !== 'undefined' && (
                  <MapContainer
                    center={userLocation ?? [12.8797, 121.7740]}
                    zoom={userLocation ? 15 : 7}
                    style={{ height: '100%', width: '100%' }}
                    key={userLocation ? `${userLocation[0]}-${userLocation[1]}` : 'default'}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {userLocation && (
                      <>
                        <Circle
                          center={userLocation}
                          radius={100}
                          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 }}
                        />
                        <Marker position={userLocation}>
                          <Popup>
                            <div className="text-xs">
                              <p className="font-bold">📍 Your Location</p>
                              <p>{userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}</p>
                            </div>
                          </Popup>
                        </Marker>
                      </>
                    )}
                    {alerts.filter(a => a.location).map(alert => (
                      <Marker key={alert.id} position={[alert.location!.lat, alert.location!.lng]}>
                        <Popup>
                          <div className="text-xs">
                            <p className="font-bold capitalize">{alert.type} Emergency</p>
                            <p className="text-slate-500">{alert.timestamp?.seconds ? format(alert.timestamp.toDate(), 'MMM d, h:mm a') : 'Live'}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
              </Card>

              {/* My alerts on map */}
              <div className="space-y-3">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">My Alert Locations</h2>
                {alerts.filter(a => a.location).length === 0 ? (
                  <p className="text-slate-500 text-sm">No alerts with GPS data yet.</p>
                ) : (
                  alerts.filter(a => a.location).map(alert => (
                    <div key={alert.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-white/5">
                      <div className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0",
                        alert.type === 'fire' ? 'bg-orange-500' :
                        alert.type === 'crime' ? 'bg-blue-500' : 'bg-red-500'
                      )} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white capitalize">{alert.type}</p>
                        <p className="text-xs text-slate-500">{alert.location!.lat.toFixed(5)}, {alert.location!.lng.toFixed(5)}</p>
                      </div>
                      <Badge className={cn("text-[10px] font-bold border-none",
                        alert.status === 'pending' ? 'bg-red-500/10 text-red-400' :
                        alert.status === 'responding' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-green-500/10 text-green-400'
                      )}>
                        {alert.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {currentView === "profile" && (
            <div className="space-y-10">
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic">Operator Profile</h1>
              <Card className="bg-slate-900/40 border-white/5 rounded-[3rem] p-12 shadow-2xl">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="h-32 w-32 rounded-3xl overflow-hidden relative border-2 border-white/10">
                    <Image src={`https://picsum.photos/seed/${profile?.uid}/200`} fill alt="Avatar" className="object-cover" />
                  </div>
                  <div className="space-y-4 text-center md:text-left">
                    <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">{profile?.name}</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest">{profile?.email}</p>
                    <Badge className="bg-primary/20 text-primary border-primary/20 px-6 py-2 rounded-xl font-black uppercase tracking-[0.2em] text-[10px]">{profile?.role} sector</Badge>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {currentView === "feedback" && (
            <div className="space-y-8 max-w-2xl">
              <h1 className="text-3xl font-black text-white tracking-tight">Feedback & Evaluation</h1>
              <Card className="bg-slate-900/40 border-white/5 rounded-2xl p-8">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white">System Evaluation</h2>
                  <p className="text-sm text-slate-400 mt-1">Help us improve the Emergency Hotline system</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ease of Use (1–5)</Label>
                    <Slider value={easeOfUse} onValueChange={setEaseOfUse} max={5} min={1} step={1} className="py-2" />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>1 - Very Difficult</span>
                      <span className="text-white font-bold">{easeOfUse[0]}/5</span>
                      <span>5 - Very Easy</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reliability (1–5)</Label>
                    <Slider value={reliability} onValueChange={setReliability} max={5} min={1} step={1} className="py-2" />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>1 - Unreliable</span>
                      <span className="text-white font-bold">{reliability[0]}/5</span>
                      <span>5 - Very Reliable</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Comments (Optional)</Label>
                    <Textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Share your experience or suggestions..."
                      className="bg-slate-800/50 border-white/10 text-white rounded-xl h-32 resize-none"
                    />
                  </div>
                  <button
                    onClick={submitFeedback}
                    className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-[0_4px_16px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2"
                  >
                    <Star className="h-4 w-4" />
                    Submit Feedback
                  </button>
                </div>
              </Card>
            </div>
          )}

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent className="bg-slate-950 border-destructive/30 border-4 rounded-[4rem] p-16 max-w-2xl shadow-[0_0_100px_rgba(220,38,38,0.3)]">
              <AlertDialogHeader className="space-y-8">
                <AlertDialogTitle className="text-6xl font-black uppercase tracking-tighter text-destructive text-center italic leading-none">
                  Confirm Signal
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center font-bold text-slate-300 uppercase tracking-tight text-lg leading-relaxed">
                  Broadcasting <span className="text-white underline decoration-destructive decoration-4 underline-offset-8">{selectedType?.toUpperCase()}</span> signal.<br/>Responders will be dispatched to your current location immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="sm:justify-center gap-8 pt-12">
                <AlertDialogCancel className="rounded-2xl h-20 px-12 font-black uppercase tracking-[0.3em] text-xs border-white/10 bg-slate-900 text-white hover:bg-slate-800 transition-all" onClick={() => setSelectedType(null)}>Abort</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAlert} className="bg-destructive hover:bg-destructive/90 rounded-2xl h-20 px-12 font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-destructive/40 transition-all active:scale-95">Confirm Transmission</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
