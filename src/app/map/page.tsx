"use client";

import { AuthProvider } from '@/hooks/use-auth';
import { LiveMapView } from '@/components/map/LiveMapView';

export default function MapPage() {
  return (
    <AuthProvider>
      <LiveMapView />
    </AuthProvider>
  );
}
