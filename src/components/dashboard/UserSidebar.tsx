"use client";

import * as React from "react";
import { 
  Home, 
  ClipboardList, 
  Map, 
  UserCircle,
  TriangleAlert,
  LogOut,
  Settings,
  Bell,
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";

interface UserSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function UserSidebar({ currentView, onViewChange }: UserSidebarProps) {
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

  const navItems = [
    { title: "Home", view: "home", icon: Home },
    { title: "My Reports", view: "reports", icon: ClipboardList },
    { title: "Live Map", view: "map", icon: Map, href: "/map" },
    { title: "Feedback", view: "feedback", icon: Star },
    { title: "My Profile", view: "profile", icon: UserCircle },
  ];

  return (
    <Sidebar className="border-r border-white/5 bg-[#020617] w-72">
    <SidebarHeader className="p-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-red-600 shadow-lg shadow-red-900/40">
            <TriangleAlert className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-bold text-white leading-tight tracking-tight truncate">Emergency Hotline</h2>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest truncate">Alarm System</p>
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
                      <SidebarMenuButton className="h-14 px-4 rounded-xl transition-all mb-2 hover:bg-white/5 text-slate-500 hover:text-white w-full">
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
                          ? "text-white font-black bg-red-950/20 border border-red-500/10" 
                          : "text-slate-500 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-4 w-full">
                        <item.icon className={cn(
                          "h-6 w-6 transition-colors",
                          currentView === item.view ? "text-red-500" : "text-slate-500"
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
            className="w-full h-14 justify-start px-4 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 font-bold transition-all gap-4"
          >
            <LogOut className="h-6 w-6" />
            <span className="text-md tracking-tight">Logout Terminal</span>
          </Button>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-3">
             <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Signal Status</span>
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
             </div>
             <p className="text-[10px] font-black text-white leading-none uppercase tracking-tighter">Encrypted Node 4.8.2</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
