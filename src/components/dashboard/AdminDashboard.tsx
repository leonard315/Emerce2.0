"use client";

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, doc, setDoc } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { EmergencyAlert, UserProfile } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import dynamic from 'next/dynamic';
import {
  Users,
  BarChart3,
  Siren,
  CheckCircle2,
  Flame,
  Shield,
  Heart,
  MapPin,
  ChevronRight,
  Activity,
  FileDown,
  Clock,
  Navigation,
  Star,
  Settings,
  Bell,
  Lock,
  Palette,
  UserCircle,
  TriangleAlert,
  Camera,
  Pencil,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminSettings } from "./AdminSettings";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';

// Dynamic map imports (no SSR)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

// ─── Admin Profile View ───────────────────────────────────────────────────────
function AdminProfileView({ profile, db }: { profile: any; db: any }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile || !db || !nameValue.trim()) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', profile.uid), { name: nameValue.trim() }, { merge: true });
      toast({ title: 'Profile updated' });
      setEditing(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!profile || !db) return;
    try {
      const { resizeImageToBase64 } = await import('@/lib/resize-image');
      const dataUrl = await resizeImageToBase64(file, 200, 0.7);
      await setDoc(doc(db, 'users', profile.uid), { photoURL: dataUrl }, { merge: true });
      toast({ title: 'Profile photo updated' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: e.message });
    }
  };

  return (
    <div className="space-y-4 w-full max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">My Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your admin account</p>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" className="h-9 px-4 border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2 rounded-xl"
            onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit Profile
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-9 px-3 text-slate-400 hover:text-white rounded-xl"
              onClick={() => { setEditing(false); setNameValue(profile?.name || ''); }} disabled={saving}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" className="h-9 px-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl gap-2"
              onClick={handleSave} disabled={saving || !nameValue.trim()}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-slate-900/60 border-white/5 rounded-2xl overflow-hidden">
        {/* Cover */}
        <div className="h-20 bg-gradient-to-r from-purple-900/40 to-slate-900" />
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-10 mb-4 w-fit">
            <div className="h-20 w-20 rounded-2xl bg-purple-500/10 border-4 border-slate-900 overflow-hidden flex items-center justify-center text-purple-400 font-black text-3xl relative">
              {profile?.photoURL ? (
                <Image src={profile.photoURL} alt="Avatar" fill className="object-cover" />
              ) : (
                profile?.name?.charAt(0)?.toUpperCase() || 'A'
              )}
            </div>
            <label htmlFor="admin-avatar-upload"
              className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-lg bg-slate-700 hover:bg-slate-600 border border-white/10 flex items-center justify-center cursor-pointer transition-colors"
              title="Change photo">
              <Camera className="h-3.5 w-3.5 text-white" />
            </label>
            <input id="admin-avatar-upload" type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-black text-white">{profile?.name || 'Admin'}</h2>
            <p className="text-sm text-slate-400">{profile?.email}</p>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs font-bold mt-2">Admin</Badge>
          </div>

          <Separator className="bg-white/5 mb-5" />

          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</Label>
              <Input value={nameValue} onChange={e => setNameValue(e.target.value)}
                className={cn("mt-2 border-white/10 text-white transition-colors",
                  editing ? "bg-slate-800 border-white/20" : "bg-slate-800/50 cursor-default")}
                readOnly={!editing}
                onKeyDown={e => { if (e.key === 'Enter' && editing) handleSave(); }} />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</Label>
              <Input value={profile?.email || ''} className="mt-2 bg-slate-800/50 border-white/10 text-slate-400 cursor-default" readOnly />
              <p className="text-[10px] text-slate-600 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Role</Label>
              <Input value="ADMIN" className="mt-2 bg-slate-800/50 border-white/10 text-slate-400 cursor-default" readOnly />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function AdminDashboard() {
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [currentView, setCurrentView] = useState("overview");

  useEffect(() => {
    setMounted(true);
    import('leaflet/dist/leaflet.css');
  }, []);

  const alertsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'all_alerts'), orderBy('timestamp', 'desc'), limit(100));
  }, [db]);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20));
  }, [db]);

  const feedbackQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'all_questionnaire_responses'), orderBy('timestamp', 'desc'), limit(50));
  }, [db]);

  const { data: alertsData } = useCollection<EmergencyAlert>(alertsQuery);
  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: feedbackData } = useCollection<any>(feedbackQuery);

  const alerts = alertsData || [];
  const users = usersData || [];
  const feedbacks = feedbackData || [];
  const { profile } = useAuth();

  const chartData = useMemoFirebase(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const count = alerts.filter(a => {
        if (!a.timestamp) return false;
        return isSameDay(a.timestamp.toDate(), date);
      }).length;
      return { name: format(date, 'MMM d'), count: count || 0 };
    });
  }, [alerts]);

  const activeAlerts = alerts.filter(a => a.location && a.status !== 'resolved');

  if (!mounted) return null;

  return (
    <SidebarProvider style={{ '--sidebar-width': '18rem' } as React.CSSProperties}>
      <AdminSidebar currentView={currentView} onViewChange={setCurrentView} />
      <SidebarInset className="bg-[#0a0f1e] border-l border-white/5 overflow-y-auto h-screen min-w-0 flex-1 w-0">
        <div className="w-full p-4 lg:p-6 space-y-4 animate-in fade-in duration-500">

          {/* ── Overview ─────────────────────────────────────────────────── */}
          {currentView === "overview" && (
            <>
              {/* Page header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="xl:hidden h-9 w-9 rounded-xl border border-white/10 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0" />
                  <div>
                    <h1 className="text-xl font-black text-white tracking-tight">Admin Dashboard</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Welcome back, Admin</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs border-white/10 text-slate-300 hover:bg-white/5 gap-1.5">
                    <Users className="h-3.5 w-3.5" /> View as User
                  </Button>
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs font-bold gap-1.5 px-3 py-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> System Online
                  </Badge>
                </div>
              </div>

              {/* Sub-header bar */}
              <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-slate-900/50 border border-white/5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Avg response: <span className="text-white font-bold">2 min</span></span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-green-400 hover:text-green-300 gap-1.5">
                  <FileDown className="h-3.5 w-3.5" /> Export CSV
                </Button>
              </div>

              {/* Stats row 1 — main counts */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Registered Users', value: users.length, icon: Users, sub: 'Total', color: 'text-slate-400', iconBg: 'bg-slate-800' },
                  { label: 'Total Alerts', value: alerts.length, icon: BarChart3, sub: 'All time', color: 'text-slate-400', iconBg: 'bg-slate-800' },
                  { label: 'Active Alerts', value: alerts.filter(a => a.status === 'pending').length, icon: Siren, sub: 'Live', color: 'text-red-400', iconBg: 'bg-red-500/10', live: true },
                  { label: 'Resolved Alerts', value: alerts.filter(a => a.status === 'resolved').length, icon: CheckCircle2, sub: 'Done', color: 'text-green-400', iconBg: 'bg-green-500/10' },
                ].map((stat, i) => (
                  <Card key={i} className="bg-slate-900/60 border-white/5 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn("p-2 rounded-xl", stat.iconBg)}>
                        <stat.icon className={cn("h-4 w-4", stat.color)} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">{stat.sub}</span>
                        {stat.live && <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />}
                      </div>
                    </div>
                    <div className="text-3xl font-black text-white">{stat.value}</div>
                    <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                  </Card>
                ))}
              </div>

              {/* Stats row 2 — agency breakdown */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Fire', sub: 'Bureau of Fire Protection', value: alerts.filter(a => a.type === 'fire').length, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                  { label: 'Crime', sub: 'Philippine National Police', value: alerts.filter(a => a.type === 'crime').length, icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                  { label: 'Medical', sub: 'Emergency Medical Care', value: alerts.filter(a => a.type === 'medical').length, icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                  { label: 'Responding', sub: 'On their way', value: alerts.filter(a => a.status === 'responding').length, icon: Navigation, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
                ].map((item, i) => (
                  <Card key={i} className={cn("rounded-2xl p-4 border", item.bg, item.border)}>
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("h-5 w-5", item.color)} />
                      <div>
                        <div className="text-2xl font-black text-white">{item.value}</div>
                        <div className="text-xs font-bold text-white/80">{item.label}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{item.sub}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Main content grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Left — chart + map */}
                <div className="lg:col-span-2 space-y-4">

                  {/* Bar chart */}
                  <Card className="bg-slate-900/60 border-white/5 rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-white/5">
                      <CardTitle className="text-sm font-bold text-white">
                        Alerts · Last 7 Days
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs text-slate-400 h-7">Go to History</Button>
                    </CardHeader>
                    <CardContent className="p-4 h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barCategoryGap="30%">
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} dy={8} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} width={24} />
                          <Tooltip
                            cursor={{ fill: '#ffffff05' }}
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: 12 }}
                            itemStyle={{ color: '#f87171' }}
                          />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {chartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill="#7f1d1d" stroke="#ef4444" strokeWidth={1} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Live Emergency Map */}
                  <Card className="bg-slate-900/60 border-white/5 rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between py-3 px-5 border-b border-white/5">
                      <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        Live Emergency Map
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] font-bold ml-1">
                          {activeAlerts.length} active
                        </Badge>
                      </CardTitle>
                      <Link href="/map" className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                        Full map <ChevronRight className="h-3 w-3" />
                      </Link>
                    </CardHeader>
                    <CardContent className="p-0 h-[280px]">
                      <MapContainer
                        center={[12.8797, 121.7740]}
                        zoom={7}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        scrollWheelZoom={false}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {activeAlerts.map(alert => (
                          alert.location && (
                            <Marker key={alert.id} position={[alert.location.lat, alert.location.lng]}>
                              <Popup>
                                <div className="text-xs">
                                  <p className="font-bold">{alert.type.toUpperCase()}</p>
                                  <p>{alert.userName}</p>
                                </div>
                              </Popup>
                            </Marker>
                          )
                        ))}
                      </MapContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Right — recent alerts + users */}
                <div className="space-y-4">

                  {/* Recent Alerts */}
                  <Card className="bg-slate-900/60 border-white/5 rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between py-3 px-5 border-b border-white/5">
                      <CardTitle className="text-sm font-bold text-white">Recent Alerts</CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs text-blue-400 h-7 px-2">All →</Button>
                    </CardHeader>
                    <CardContent className="p-0 max-h-[280px] overflow-y-auto">
                      {alerts.slice(0, 8).map((alert) => (
                        <div key={alert.id} className="flex items-start gap-3 px-5 py-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                          <div className={cn(
                            "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                            alert.type === 'fire' ? 'bg-orange-500/15 text-orange-400' :
                            alert.type === 'crime' ? 'bg-blue-500/15 text-blue-400' :
                            'bg-red-500/15 text-red-400'
                          )}>
                            {alert.type === 'fire' ? <Flame className="h-4 w-4" /> :
                             alert.type === 'crime' ? <Shield className="h-4 w-4" /> :
                             <Heart className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white capitalize">{alert.type} Emergency</p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {alert.location
                                ? `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}`
                                : 'Location unknown'}
                            </p>
                            <p className="text-[10px] text-slate-600">{alert.userName}</p>
                          </div>
                          <Badge className={cn(
                            "text-[9px] font-bold border-none rounded-lg px-2 py-0.5 flex-shrink-0",
                            alert.status === 'resolved' ? 'bg-green-500/10 text-green-400' :
                            alert.status === 'responding' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-red-500/10 text-red-400'
                          )}>
                            {alert.status}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Registered Users */}
                  <Card className="bg-slate-900/60 border-white/5 rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between py-3 px-5 border-b border-white/5">
                      <CardTitle className="text-sm font-bold text-white">Registered Users</CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs text-blue-400 h-7 px-2">Manage →</Button>
                    </CardHeader>
                    <CardContent className="p-0 max-h-[220px] overflow-y-auto">
                      {users.slice(0, 6).map((user) => (
                        <div key={user.uid} className="flex items-center gap-3 px-5 py-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                          <div className="h-8 w-8 rounded-xl bg-slate-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-[10px] text-slate-400 h-6 px-2 hover:text-white">
                            View
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}

          {/* ── Alerts view ──────────────────────────────────────────────── */}
          {currentView === "alerts" && (
            <div className="space-y-4 w-full">
              <h1 className="text-2xl font-black text-white">Manage Alerts</h1>
              <Card className="bg-slate-900/60 border-white/5 rounded-2xl overflow-hidden w-full">
                {/* Mobile card list */}
                <div className="lg:hidden divide-y divide-white/5">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0",
                        alert.type === 'fire' ? 'bg-orange-500/15' : alert.type === 'crime' ? 'bg-blue-500/15' : 'bg-red-500/15'
                      )}>
                        {alert.type === 'fire' ? <Flame className="h-4 w-4 text-orange-400" /> :
                         alert.type === 'crime' ? <Shield className="h-4 w-4 text-blue-400" /> :
                         <Heart className="h-4 w-4 text-red-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white capitalize">{alert.type} Emergency</p>
                        <p className="text-xs text-slate-500 truncate">{alert.userName}</p>
                        <p className="text-[10px] text-slate-600">
                          {alert.timestamp?.seconds ? format(alert.timestamp.toDate(), 'MMM d, HH:mm') : 'Live'}
                        </p>
                      </div>
                      <Badge className={cn(
                        "text-[9px] font-bold border-none rounded-lg px-2 py-0.5 flex-shrink-0",
                        alert.status === 'resolved' ? 'bg-green-500/10 text-green-400' :
                        alert.status === 'responding' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-red-500/10 text-red-400'
                      )}>
                        {alert.status}
                      </Badge>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="py-12 text-center text-slate-500 text-sm">No alerts found</div>
                  )}
                </div>
                {/* Desktop table */}
                <Table className="w-full hidden lg:table">
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest px-6 w-32">Type</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest">User</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest w-40">Time</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest text-right px-6 w-32">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id} className="border-white/5 hover:bg-white/5">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", alert.type === 'fire' ? 'bg-orange-500' : alert.type === 'crime' ? 'bg-blue-500' : 'bg-red-500')} />
                            <span className="text-sm font-bold text-white capitalize">{alert.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm font-medium">{alert.userName}</TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {alert.timestamp?.seconds ? format(alert.timestamp.toDate(), 'MMM d, HH:mm') : 'Live'}
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <Badge className={cn(
                            "text-xs font-bold border-none rounded-lg px-3 py-1",
                            alert.status === 'pending' ? 'bg-red-500/15 text-red-400' :
                            alert.status === 'responding' ? 'bg-blue-500/15 text-blue-400' :
                            'bg-green-500/15 text-green-400'
                          )}>
                            {alert.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {alerts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-500 py-12 text-sm">
                          No alerts found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* ── Users view ───────────────────────────────────────────────── */}
          {currentView === "users" && (
            <div className="space-y-4 w-full">
              <h1 className="text-2xl font-black text-white">Manage Users</h1>
              <Card className="bg-slate-900/60 border-white/5 rounded-2xl overflow-hidden w-full">
                {/* Mobile card list (hidden on lg+) */}
                <div className="lg:hidden divide-y divide-white/5">
                  {users.map((user) => (
                    <div key={user.uid} className="flex items-center gap-3 px-4 py-3">
                      <div className="h-9 w-9 rounded-xl bg-slate-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        <Badge className={cn(
                          "text-[10px] font-bold border-none rounded-lg capitalize mt-1",
                          user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                          user.role === 'fire' ? 'bg-orange-500/10 text-orange-400' :
                          user.role === 'police' ? 'bg-blue-500/10 text-blue-400' :
                          user.role === 'medical' ? 'bg-red-500/10 text-red-400' :
                          'bg-slate-500/10 text-slate-400'
                        )}>
                          {user.role}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white h-7 flex-shrink-0">View</Button>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="py-12 text-center text-slate-500 text-sm">No users found</div>
                  )}
                </div>
                {/* Desktop table (hidden on mobile) */}
                <Table className="w-full hidden lg:table">
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest px-6">Name</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest">Role</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest text-right px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.uid} className="border-white/5 hover:bg-white/5">
                        <TableCell className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-white">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">{user.email}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "text-[10px] font-bold border-none rounded-lg capitalize",
                            user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                            user.role === 'fire' ? 'bg-orange-500/10 text-orange-400' :
                            user.role === 'police' ? 'bg-blue-500/10 text-blue-400' :
                            user.role === 'medical' ? 'bg-red-500/10 text-red-400' :
                            'bg-slate-500/10 text-slate-400'
                          )}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white h-7">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* ── History view ─────────────────────────────────────────────── */}
          {currentView === "history" && (
            <div className="space-y-4 w-full">
              <h1 className="text-2xl font-black text-white">Alert History</h1>
              <Card className="bg-slate-900/60 border-white/5 rounded-2xl overflow-hidden w-full">
                <Table className="w-full">
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest px-6">Type</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest">User</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest">Location</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest text-right px-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id} className="border-white/5 hover:bg-white/5">
                        <TableCell className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", alert.type === 'fire' ? 'bg-orange-500' : alert.type === 'crime' ? 'bg-blue-500' : 'bg-red-500')} />
                            <span className="text-sm font-bold text-white capitalize">{alert.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">{alert.userName}</TableCell>
                        <TableCell className="text-slate-500 font-mono text-xs">
                          {alert.location ? `${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}` : '—'}
                        </TableCell>
                        <TableCell className="text-slate-500 font-mono text-xs">
                          {alert.timestamp?.seconds ? format(alert.timestamp.toDate(), 'MMM d, HH:mm') : 'Live'}
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <Badge className={cn(
                            "text-[10px] font-bold border-none rounded-lg",
                            alert.status === 'pending' ? 'bg-red-500/10 text-red-400' :
                            alert.status === 'responding' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-green-500/10 text-green-400'
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

          {/* ── Profile view ─────────────────────────────────────────────── */}
          {currentView === "profile" && (
            <AdminProfileView profile={profile} db={db} />
          )}

          {/* ── Settings view ────────────────────────────────────────────── */}
          {currentView === "settings" && <AdminSettings />}

          {/* ── Feedback view ────────────────────────────────────────────── */}
          {currentView === "feedback" && (
            <div className="space-y-4 w-full">
              <h1 className="text-2xl font-black text-white">Feedback & Ratings</h1>
              <Card className="bg-slate-900/60 border-white/5 rounded-2xl overflow-hidden w-full">
                <Table className="w-full">
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest px-6">User</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ease of Use</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reliability</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest">Comments</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-widest text-right px-6">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbacks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-500 py-12 text-sm">
                          No feedback submissions yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      feedbacks.map((fb: any) => (
                        <TableRow key={fb.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="px-6 py-4 text-sm font-bold text-white">
                            {fb.userId?.slice(0, 8) || '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn("h-3.5 w-3.5", i < fb.easeOfUse ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600')}
                                />
                              ))}
                              <span className="text-xs text-slate-400 ml-1">{fb.easeOfUse}/5</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn("h-3.5 w-3.5", i < fb.reliability ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600')}
                                />
                              ))}
                              <span className="text-xs text-slate-400 ml-1">{fb.reliability}/5</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm max-w-xs truncate">
                            {fb.comments || '—'}
                          </TableCell>
                          <TableCell className="text-right px-6 text-slate-500 text-xs">
                            {fb.timestamp?.seconds ? format(fb.timestamp.toDate(), 'MMM d, HH:mm') : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
