"use client";

import { motion } from "framer-motion";
import {
  BookOpen, Moon, Utensils, SmartphoneCharging, ChevronRight, Plus, Monitor,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData, Schedule } from "@/context/DataContext";

const iconMap: Record<string, typeof BookOpen> = {
  BookOpen, Moon, Utensils, SmartphoneCharging,
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen({
  onNavigate,
  onEditSchedule,
  onActiveFocus,
}: {
  onNavigate: (screen: string) => void;
  onEditSchedule: (id: string) => void;
  onActiveFocus: (id: string) => void;
}) {
  const { profile } = useAuth();
  const { schedules, devices, householdName, loading } = useData();

  const activeCount = schedules.filter((s) => s.status === "active").length;
  const blockedDevices = devices.filter((d) => d.status === "blocked").length;

  const handleScheduleClick = (schedule: Schedule) => {
    onActiveFocus(schedule.id);
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-12 pb-24">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p className="text-sm text-muted-foreground">{getGreeting()}, {profile?.full_name?.split(" ")[0] || "there"}</p>
        <h1 className="text-2xl font-heading font-bold mt-1">
          {householdName || "Your Family"}
        </h1>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-xl bg-primary/10"
            >
              <p className="text-2xl font-bold text-primary">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="p-4 rounded-xl bg-active-green/10"
            >
              <p className="text-2xl font-bold text-accent-foreground">{schedules.length}</p>
              <p className="text-xs text-muted-foreground">Routines</p>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-xl bg-destructive/10"
            >
              <p className="text-2xl font-bold text-destructive">{blockedDevices}</p>
              <p className="text-xs text-muted-foreground">Blocked</p>
            </motion.div>
          </div>

          {/* Routines */}
          <h2 className="text-lg font-heading font-semibold mt-8 mb-3">Routines</h2>
          {schedules.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No routines yet. Create one to start managing devices.
            </p>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule, i) => {
                const Icon = iconMap[schedule.icon] || BookOpen;
                return (
                  <motion.button
                    key={schedule.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => handleScheduleClick(schedule)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-input text-left hover:shadow-sm transition-shadow active:scale-[0.98]"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        schedule.status === "active" ? "bg-active-green/20" : "bg-primary/10"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={schedule.status === "active" ? "text-accent" : "text-primary"}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{schedule.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {schedule.time_start} – {schedule.time_end}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        schedule.status === "active"
                          ? "bg-active-green/20 text-accent-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {schedule.status}
                    </span>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => onNavigate("create-schedule")}
              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Plus size={18} />
              New Routine
            </button>
            <button
              onClick={() => onNavigate("devices")}
              className="flex items-center justify-center gap-2 p-4 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Monitor size={18} />
              Devices
            </button>
          </div>
        </>
      )}
    </div>
  );
}
