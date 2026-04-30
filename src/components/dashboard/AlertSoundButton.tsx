"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, VolumeX, Siren } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertSoundButtonProps {
  soundEnabled: boolean;
  sirenActive: boolean;
  onToggleSound: () => void;
  onPlaySiren: () => void;
  onStopSiren: () => void;
  pendingCount?: number;
  accentColor?: string; // e.g. 'orange' | 'blue' | 'red'
}

export function AlertSoundButton({
  soundEnabled,
  sirenActive,
  onToggleSound,
  onPlaySiren,
  onStopSiren,
  pendingCount = 0,
  accentColor = 'red',
}: AlertSoundButtonProps) {
  const colorMap: Record<string, { siren: string; badge: string }> = {
    orange: {
      siren: 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/40',
      badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    },
    blue: {
      siren: 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    red: {
      siren: 'bg-red-600 hover:bg-red-500 shadow-red-900/40',
      badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
  };

  const colors = colorMap[accentColor] ?? colorMap.red;

  return (
    <div className="flex items-center gap-2">
      {/* Pending count badge */}
      {pendingCount > 0 && (
        <Badge className={cn("text-xs font-bold border animate-pulse", colors.badge)}>
          {pendingCount} pending
        </Badge>
      )}

      {/* Mute/unmute toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleSound}
        className={cn(
          "h-9 gap-1.5 border-white/10 font-semibold text-xs",
          soundEnabled
            ? "text-white hover:bg-white/5"
            : "text-slate-500 hover:bg-white/5"
        )}
        title={soundEnabled ? 'Mute alerts' : 'Unmute alerts'}
      >
        {soundEnabled ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
      </Button>

      {/* Siren toggle */}
      <Button
        size="sm"
        onClick={sirenActive ? onStopSiren : onPlaySiren}
        disabled={!soundEnabled}
        className={cn(
          "h-9 gap-1.5 font-semibold text-xs text-white shadow-lg transition-all",
          sirenActive
            ? "bg-slate-700 hover:bg-slate-600 animate-pulse"
            : colors.siren
        )}
        title={sirenActive ? 'Stop siren' : 'Activate siren'}
      >
        <Siren className={cn("h-4 w-4", sirenActive && "animate-spin")} />
        <span className="hidden sm:inline">{sirenActive ? 'Stop Siren' : 
          accentColor === 'orange' ? '🔥 Fire Alarm' :
          accentColor === 'blue' ? '🚔 Patrol Siren' :
          accentColor === 'red' ? '🚑 Ambulance' :
          'Siren'
        }</span>
      </Button>
    </div>
  );
}
