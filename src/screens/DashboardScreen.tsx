"use client";

import { motion } from "framer-motion";
import {
  BookOpen, Moon, Utensils, SmartphoneCharging, ChevronRight, Plus, Monitor,
} from "lucide-react";
import { useApp, Schedule } from "@/context/AppContext";

const iconMap: Record<string, typeof BookOpen> = {
  BookOpen, Moon, Utensils, SmartphoneCharging,
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const { schedules, setScreen, setActiveSchedule, setEditingSchedule } = useApp();

  const activeCount = schedules.filter((s) => s.status === "active").length;

  const handleScheduleClick = (schedule: Schedule) => {
    if (schedule.status === "active") {
      setActiveSchedule(schedule);
      setScreen("active-focus");
    } else {
      setEditingSchedule(schedule);
      setScreen("create-schedule");
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-12 pb-24">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <p className="text-sm text-muted-foreground">{getGreeting()}</p>
        <h1 className="text-2xl font-heading font-bold mt-1">Your Family&apos;s Schedule</h1>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-primary/10"
        >
          <p className="text-2xl font-bold text-primary">{activeCount}</p>
          <p className="text-sm text-muted-foreground">Active Now</p>
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl bg-active-green/10"
        >
          <p className="text-2xl font-bold text-accent-foreground">{schedules.length}</p>
          <p className="text-sm text-muted-foreground">Total Routines</p>
        </motion.div>
      </div>

      {/* Today's Routines */}
      <h2 className="text-lg font-heading font-semibold mt-8 mb-3">Today&apos;s Routines</h2>
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
                  {schedule.timeStart} – {schedule.timeEnd}
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

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          onClick={() => {
            setEditingSchedule(null);
            setScreen("create-schedule");
          }}
          className="flex items-center justify-center gap-2 p-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus size={18} />
          New Schedule
        </button>
        <button
          onClick={() => setScreen("devices")}
          className="flex items-center justify-center gap-2 p-4 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Monitor size={18} />
          View Devices
        </button>
      </div>
    </div>
  );
}
