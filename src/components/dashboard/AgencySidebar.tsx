"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Map,
  UserCircle,
  LogOut,
  Flame,
  ShieldCheck,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { useAuth as useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";

interface AgencySidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const agencyConfig = {
  fire: {
    label: "Fire Agency",
    subtitle: "BFP Command Node",
    icon: Flame,
    color: "text-orange-500",
    activeBg: "bg-orange-950/20 border border-orange-500/10",
    activeIcon: "text-orange-500",
    headerBg: "bg-orange-600/10",
  },
  police: {
    label: "Police Agency",
    subtitle: "PNP Command Node",
    icon: ShieldCheck,
    color: "text-blue-500",
    activeBg: "bg-blue-950/20 border border-blue-500/10",
    activeIcon: "text-blue-500",
    headerBg: "bg-blue-600/10",
  },
  medical: {
    label: "Medical Agency",
    subtitle: "EMS Command Node",
    icon: HeartPulse,
    color: "text-red-500",
    activeBg: "bg-red-950/20 border border-red-500/10",
    activeIcon: "text-red-500",
    headerBg: "bg-red-600/10",
  },
} as const;

export function AgencySidebar({ currentView, onViewChange }: AgencySidebarProps) {
  const auth = useFirebase();
  const router = useRouter();
  const { profile } = useAuth();

  const role = (profile?.role ?? "fire") as keyof typeof agencyConfig;
  const config = agencyConfig[role] ?? agencyConfig.fire;
  const AgencyIcon = config.icon;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navItems = [
    { title: "Dashboard", view: "dashboard", icon: LayoutDashboard },
    { title: "Live Map", view: "map", icon: Map, href: "/map" },
    { title: "My Profile", view: "profile", icon: UserCircle },
  ];

  return (
    <Sidebar className="border-r border-white/5 bg-[#020617] w-72">
      <SidebarHeader className="p-8 pb-4">
        <div className="flex items-center gap-4">
          <div className={cn("p-2.5 rounded-2xl shadow-lg", config.headerBg)}>
            <AgencyIcon className={cn("h-6 w-6", config.color)} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-white leading-none tracking-tighter">
              {config.label}
            </h2>
            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
              {config.subtitle}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-6 pt-10">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.href ? (
                    <Link href={item.href}>
                      <SidebarMenuButton className={cn("h-14 px-4 rounded-xl transition-all mb-2 hover:bg-white/5 text-slate-500 hover:text-white w-full")}>
                        <div className="flex items-center gap-4 w-full">
                          <item.icon className="h-6 w-6 text-slate-500" />
                          <span className="text-md tracking-tight font-bold">{item.title}</span>
                        </div>
                      </SidebarMenuButton>
                    </Link>
                  ) : (
                    <SidebarMenuButton
                      onClick={() => onViewChange(item.view)}
                      className={cn(
                        "h-14 px-4 rounded-xl transition-all relative overflow-hidden group mb-2 hover:bg-white/5",
                        currentView === item.view
                          ? cn("text-white font-black", config.activeBg)
                          : "text-slate-500 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-4 w-full">
                        <item.icon
                          className={cn(
                            "h-6 w-6 transition-colors",
                            currentView === item.view ? config.activeIcon : "text-slate-500"
                          )}
                        />
                        <span className="text-md tracking-tight font-bold">{item.title}</span>
                      </div>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-8 border-t border-white/5 bg-[#020617] mt-auto">
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full h-14 justify-start px-4 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 font-bold transition-all gap-4"
          >
            <LogOut className="h-6 w-6" />
            <span className="text-md tracking-tight">Logout</span>
          </Button>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                Signal Status
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
            <p className="text-[10px] font-black text-white leading-none uppercase tracking-tighter">
              Encrypted Node 4.8.2
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
