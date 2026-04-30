"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { EmergencyAlert } from '@/lib/types';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Navigation, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(m => m.Circle), { ssr: false });

interface AgencyProfileViewProps {
  agencyColor: string; // tailwind color class e.g. 'text-orange-400'
  badgeClass: string;  // e.g. 'bg-orange-500/10 text-orange-400 border-orange-500/20'
}

export function AgencyProfileView({ agencyColor, badgeClass }: AgencyProfileViewProps) {
  const { profile } = useAuth();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    import('leaflet/dist/leaflet.css');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">My Profile</h1>

      {/* Profile card */}
      <Card className="bg-slate-900/40 border-white/5 rounded-2xl p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className={cn(
            "h-20 w-20 rounded-2xl border flex items-center justify-center font-black text-3xl",
            badgeClass
          )}>
            {profile?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">{profile?.name}</h2>
            <p className="text-sm text-slate-400">{profile?.email}</p>
            <Badge className={cn("text-xs font-bold mt-2 capitalize", badgeClass)}>
              {profile?.role} Agency
            </Badge>
          </div>
        </div>
        <Separator className="bg-white/5 mb-6" />
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</Label>
            <Input
              defaultValue={profile?.name || ''}
              className="mt-2 bg-slate-800/50 border-white/10 text-white"
              readOnly
            />
          </div>
          <div>
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</Label>
            <Input
              defaultValue={profile?.email || ''}
              className="mt-2 bg-slate-800/50 border-white/10 text-white"
              readOnly
            />
          </div>
          <div>
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Role</Label>
            <Input
              defaultValue={profile?.role?.toUpperCase() || ''}
              className="mt-2 bg-slate-800/50 border-white/10 text-white"
              readOnly
            />
          </div>
        </div>
      </Card>

      {/* Current location */}
      <Card className="bg-slate-900/40 border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" /> Current Location
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-400 hover:text-white gap-1.5 h-7"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  pos => setUserLocation([pos.coords.latitude, pos.coords.longitude])
                );
              }
            }}
          >
            <Navigation className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
        {userLocation ? (
          <>
            <div className="px-6 py-3 border-b border-white/5">
              <p className="text-xs text-slate-400">
                GPS: <span className="text-white font-mono">{userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}</span>
              </p>
            </div>
            <div className="h-64">
              <MapContainer
                center={userLocation}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Circle
                  center={userLocation}
                  radius={80}
                  pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 }}
                />
                <Marker position={userLocation}>
                  <Popup>
                    <div className="text-xs font-bold">📍 Your Location</div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </>
        ) : (
          <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Enable location access to see your position</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
