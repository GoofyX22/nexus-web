"use client";

import { LayoutDashboard, CalendarDays, Monitor, Settings } from "lucide-react";
import { useApp } from "@/context/AppContext";

const tabs = [
  { screen: "dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
  { screen: "weekly" as const, icon: CalendarDays, label: "Schedules" },
  { screen: "devices" as const, icon: Monitor, label: "Devices" },
  { screen: "settings" as const, icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const { currentScreen, setScreen } = useApp();
  const showOn = ["dashboard", "devices", "weekly", "settings"];
  if (!showOn.includes(currentScreen)) return null;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-lg border-t border-border z-50">
      <div className="flex justify-around items-center py-2">
        {tabs.map(({ screen, icon: Icon, label }) => {
          const active = currentScreen === screen;
          return (
            <button
              key={screen}
              onClick={() => setScreen(screen)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
