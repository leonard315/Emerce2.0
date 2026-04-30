
"use client";

import * as React from "react";
import { 
  LayoutDashboard, 
  Bell, 
  Users, 
  ClipboardList, 
  Map, 
  UserCircle,
  TriangleAlert,
  LogOut,
  Settings,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from 'firebase/auth';
import { useAuth as useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";

interface AdminSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function AdminSidebar({ currentView, onViewChange }: AdminSidebarProps) {
  const auth = useFirebase();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/auth');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navItems = {
    main: [
      { title: "Dashboard", view: "overview", icon: LayoutDashboard },
      { title: "Manage Alerts", view: "alerts", icon: Bell },
      { title: "Manage Users", view: "users", icon: Users },
    ],
    reports: [
      { title: "Alert History", view: "history", icon: ClipboardList },
      { title: "Live Map", view: "map", icon: Map, href: "/map" },
      { title: "Feedback & Ratings", view: "feedback", icon: Star },
      { title: "My Profile", view: "profile", icon: UserCircle },
      { title: "Settings", view: "settings", icon: Settings },
    ],
  };

  return (
    <Sidebar className="border-r border-white/5 bg-[#020617] w-72">
    <SidebarHeader className="p-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-red-600 shadow-lg shadow-red-900/40">
            <TriangleAlert className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-bold text-white leading-tight tracking-tight truncate">Emergency Hotline</h2>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest truncate">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-6 pt-8">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => onViewChange(item.view)}
                    className={cn(
                      "h-14 px-4 rounded-xl transition-all relative overflow-hidden group mb-2 hover:bg-white/5",
                      currentView === item.view 
                        ? "text-white font-black bg-white/5" 
                        : "text-slate-500 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <item.icon className={cn(
                        "h-6 w-6 transition-colors",
                        currentView === item.view ? "text-red-600" : "text-white"
                      )} />
                      <span className="text-md tracking-tight font-bold">{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup className="mt-10">
          <SidebarGroupLabel className="text-[11px] font-black uppercase tracking-[0.4em] text-[#334155] mb-6 px-4">REPORTS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.reports.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.href ? (
                    <Link href={item.href}>
                      <SidebarMenuButton
                        className="h-14 px-4 rounded-xl transition-all relative overflow-hidden group mb-2 hover:bg-white/5 text-slate-500 hover:text-white w-full"
                      >
                        <div className="flex items-center gap-4 w-full">
                          <item.icon className="h-6 w-6 transition-colors text-white" />
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
                          ? "text-white font-black bg-white/5" 
                          : "text-slate-500 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-4 w-full">
                        <item.icon className={cn(
                          "h-6 w-6 transition-colors",
                          currentView === item.view ? "text-red-600" : "text-white"
                        )} />
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
            className="w-full h-12 justify-start px-4 rounded-xl text-red-500 hover:text-red-400 hover:bg-red-500/5 font-bold transition-all gap-3"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm">Logout</span>
          </Button>

          <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 space-y-2">
             <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Protocol</span>
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
             </div>
             <p className="text-[10px] font-bold text-white leading-none">SECURE LINK 4.8.2</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
