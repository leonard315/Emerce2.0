'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Flame,
  ShieldCheck,
  HeartPulse,
  TriangleAlert,
  Home as HomeIcon,
  Map,
  ClipboardList,
  User,
} from 'lucide-react';
import { SignInRequiredModal } from '@/components/SignInRequiredModal';
import { OnboardingScreen, useOnboarding } from '@/components/OnboardingScreen';

// ─── Emergency button data ────────────────────────────────────────────────────

const emergencyTypes = [
  {
    id: 'fire' as const,
    label: 'FIRE',
    subtitle: 'BFP',
    icon: Flame,
    bg: 'bg-gradient-to-br from-orange-500 to-orange-700',
    shadow: 'shadow-[0_8px_40px_rgba(249,115,22,0.5)]',
    hover: 'hover:brightness-110 hover:scale-[1.03]',
  },
  {
    id: 'police' as const,
    label: 'POLICE',
    subtitle: 'PNP',
    icon: ShieldCheck,
    bg: 'bg-gradient-to-br from-blue-500 to-blue-700',
    shadow: 'shadow-[0_8px_40px_rgba(59,130,246,0.5)]',
    hover: 'hover:brightness-110 hover:scale-[1.03]',
  },
  {
    id: 'medical' as const,
    label: 'RESCUE & MEDICAL',
    subtitle: 'EMS',
    icon: HeartPulse,
    bg: 'bg-gradient-to-br from-rose-500 to-red-700',
    shadow: 'shadow-[0_8px_40px_rgba(244,63,94,0.5)]',
    hover: 'hover:brightness-110 hover:scale-[1.03]',
  },
  {
    id: 'all' as const,
    label: 'ALL AGENCIES',
    subtitle: 'BFP + PNP + EMS',
    icon: TriangleAlert,
    bg: 'bg-gradient-to-br from-slate-600 to-slate-800',
    shadow: 'shadow-[0_8px_40px_rgba(100,116,139,0.35)]',
    hover: 'hover:brightness-125 hover:scale-[1.03]',
  },
] as const;

// ─── Bottom nav items ─────────────────────────────────────────────────────────

const bottomNavItems = [
  { id: 'home', label: 'Home', icon: HomeIcon, href: '/', active: true },
  { id: 'map', label: 'Map', icon: Map, href: '#' },
  { id: 'history', label: 'History', icon: ClipboardList, href: '#' },
  { id: 'profile', label: 'Profile', icon: User, href: '#' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'fire' | 'crime' | 'medical' | 'all' | null>(null);
  const { show: showOnboarding, done: onboardingDone } = useOnboarding();

  const handleEmergencyTap = (type: 'fire' | 'police' | 'medical' | 'all') => {
    // Map 'police' to 'crime' for the modal config
    const mappedType = type === 'police' ? 'crime' : type;
    setSelectedType(mappedType);
    setModalOpen(true);
  };

  const handleSosPress = () => {
    setSelectedType('all');
    setModalOpen(true);
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#020617] text-foreground overflow-hidden">
      {/* Onboarding */}
      {showOnboarding && <OnboardingScreen onDone={onboardingDone} />}
      {/* Background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(220,38,38,0.18) 0%, rgba(120,10,10,0.07) 55%, transparent 80%)',
        }}
      />

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="relative z-20 sticky top-0 flex items-center justify-between px-4 sm:px-6 lg:px-10 h-16 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden shadow-lg shadow-red-900/40">
            <img src="/icons/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight tracking-tight truncate">
              Emergency Hotline
            </p>
            {/* Subtitle only on very wide desktop (xl+) */}
            <p className="hidden xl:block text-[10px] text-muted-foreground leading-tight tracking-wide truncate">
              Smart Multi-Emergency Alarm System
            </p>
          </div>
        </div>

        {/* Auth actions */}
        <nav className="flex items-center gap-2 flex-shrink-0">
          <Link href="/auth">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-5 text-sm font-semibold border-white/30 hover:border-white/50 hover:bg-white/5"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/auth?tab=register">
            <Button
              size="sm"
              className="h-9 px-5 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white border-0 shadow-lg shadow-red-900/30"
            >
              Register
            </Button>
          </Link>
        </nav>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 pt-8 pb-28 xl:pb-12">
        {/* Pill badge */}
        <div className="flex items-center gap-2 mb-8 px-5 py-2 rounded-full border border-red-800/60 bg-red-950/40">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-sm text-white/80 font-medium whitespace-nowrap">
            Tap any button to report an emergency
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-center mb-3 leading-tight">
          Report Emergency
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-muted-foreground text-center max-w-xs sm:max-w-sm mb-10 leading-relaxed">
          Select the type of emergency — you&apos;ll be asked to sign in first.
        </p>

        {/* Emergency grid — fills width, square-ish buttons */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-[420px] sm:max-w-md lg:max-w-xl">
          {emergencyTypes.map(({ id, label, subtitle, icon: Icon, bg, shadow, hover }) => (
            <button
              key={id}
              onClick={() => handleEmergencyTap(id)}
              aria-label={`Report ${label} emergency`}
              className={`
                group relative flex flex-col items-center justify-center gap-3
                rounded-2xl cursor-pointer select-none aspect-square
                transition-all duration-200 ease-out active:scale-95
                ${bg} ${shadow} ${hover}
              `}
            >
              <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-white drop-shadow-md" strokeWidth={1.5} />
              <div className="flex flex-col items-center gap-1">
                <span className="text-base sm:text-xl font-black text-white tracking-widest uppercase leading-none">
                  {label}
                </span>
                <span className="text-xs sm:text-sm text-white/60 font-medium tracking-wide">{subtitle}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Inline auth links */}
        <p className="mt-8 text-xs text-muted-foreground text-center">
          Already have an account?{' '}
          <Link href="/auth" className="text-red-400 hover:text-red-300 font-semibold">
            Sign in
          </Link>
          {' · '}
          New here?{' '}
          <Link href="/auth?tab=register" className="text-red-400 hover:text-red-300 font-semibold">
            Register
          </Link>
        </p>
      </main>

      {/* ── Desktop footer (hidden on mobile/tablet, shown on xl+) ──────────── */}
      <footer className="relative z-10 hidden xl:flex items-center justify-between px-6 lg:px-10 py-4 border-t border-white/5 bg-[#020617]/60 backdrop-blur-sm text-[11px] text-muted-foreground">
        <span>Emergency Hotline — Smart Multi-Emergency Alarm System</span>
        <span>© 2026 · Mindoro State University</span>
      </footer>

      {/* ── Mobile/Tablet bottom navigation (hidden on xl+) ────────────────── */}
      <nav
        aria-label="Mobile navigation"
        className="xl:hidden fixed bottom-0 inset-x-0 z-30 bg-[hsl(222,47%,6%)] border-t border-white/10"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
      >
        {/* SOS floats above — needs extra space at top */}
        <div className="relative flex items-end justify-around h-[60px] px-4">

          {/* Home */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-white/60 hover:text-white transition-colors"
            aria-current="page"
          >
            <HomeIcon className="h-[22px] w-[22px]" strokeWidth={1.5} />
            <span className="text-[10px] font-medium tracking-wide">Home</span>
          </Link>

          {/* Map */}
          <Link
            href="/map"
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-white/40 hover:text-white/60 transition-colors"
          >
            <Map className="h-[22px] w-[22px]" strokeWidth={1.5} />
            <span className="text-[10px] font-medium tracking-wide">Map</span>
          </Link>

          {/* SOS — elevated center button */}
          <div className="flex flex-col items-center justify-end flex-1 pb-2 relative">
            {/* The button sits above the nav bar */}
            <div className="absolute bottom-[calc(100%-12px)] flex flex-col items-center">
              <button
                onClick={handleSosPress}
                aria-label="SOS — report emergency"
                className="flex items-center justify-center w-[58px] h-[58px] rounded-full bg-red-600 shadow-[0_0_24px_6px_rgba(220,38,38,0.5)] hover:bg-red-500 active:scale-95 transition-all duration-150"
              >
                <TriangleAlert className="h-7 w-7 text-white" strokeWidth={2} />
              </button>
            </div>
            <span className="text-[10px] font-medium text-white/40 tracking-wide">SOS</span>
          </div>

          {/* History */}
          <Link
            href="#"
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-white/40 hover:text-white/60 transition-colors"
          >
            <ClipboardList className="h-[22px] w-[22px]" strokeWidth={1.5} />
            <span className="text-[10px] font-medium tracking-wide">History</span>
          </Link>

          {/* Profile */}
          <Link
            href="#"
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-white/40 hover:text-white/60 transition-colors"
          >
            <User className="h-[22px] w-[22px]" strokeWidth={1.5} />
            <span className="text-[10px] font-medium tracking-wide">Profile</span>
          </Link>

        </div>
      </nav>

      {/* Sign In Required Modal */}
      <SignInRequiredModal
        open={modalOpen}
        emergencyType={selectedType}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
