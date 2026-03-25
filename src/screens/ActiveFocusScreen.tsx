"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Pause, Shield } from "lucide-react";
import { useData } from "@/context/DataContext";

export default function ActiveFocusScreen({
  scheduleId,
  onBack,
}: {
  scheduleId: string | null;
  onBack: () => void;
}) {
  const { schedules, devices, activateSchedule, deactivateSchedule } = useData();
  const schedule = scheduleId ? schedules.find((s) => s.id === scheduleId) : null;
  const [loading, setLoading] = useState(false);

  // Calculate remaining time
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!schedule) return;
    const [eh, em] = schedule.time_end.split(":").map(Number);
    const now = new Date();
    const end = new Date();
    end.setHours(eh, em, 0, 0);
    if (end <= now) end.setDate(end.getDate() + 1);
    setSeconds(Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000)));
  }, [schedule]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  const hh = Math.floor(seconds / 3600);

  const blockedDevices = devices.filter(
    (d) => schedule?.device_ids?.includes(d.id)
  );

  const isActive = schedule?.status === "active";

  const handleToggle = async () => {
    if (!schedule) return;
    setLoading(true);
    try {
      if (isActive) {
        await deactivateSchedule(schedule.id);
      } else {
        await activateSchedule(schedule.id);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Schedule not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring" }}
        className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
          isActive ? "bg-active-green/20" : "bg-primary/10"
        }`}
      >
        {isActive ? (
          <Shield size={40} className="text-accent" />
        ) : (
          <BookOpen size={40} className="text-primary" />
        )}
      </motion.div>

      <h1 className="text-2xl font-heading font-bold text-center">{schedule.name}</h1>

      <p className="text-muted-foreground text-center mt-2">
        {isActive
          ? `Blocking ${blockedDevices.length} device${blockedDevices.length !== 1 ? "s" : ""}`
          : "Ready to activate"}
      </p>

      {/* Timer */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative w-44 h-44 rounded-full border-4 border-primary/20 flex items-center justify-center my-10"
      >
        {isActive && (
          <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse-soft" />
        )}
        <div className="text-center">
          {hh > 0 && <span className="text-lg text-muted-foreground">{hh}h </span>}
          <span className="text-4xl font-heading font-bold text-foreground">
            {mm}:{ss}
          </span>
        </div>
      </motion.div>

      {/* Blocked Devices */}
      <div className="w-full space-y-2 mb-8">
        {blockedDevices.map((device, i) => (
          <motion.div
            key={device.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 + 0.05 * i }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-input"
          >
            <Pause size={16} className={isActive ? "text-destructive" : "text-muted-foreground"} />
            <span className="font-medium">{device.name}</span>
            <span
              className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                isActive
                  ? "bg-destructive/10 text-destructive"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {isActive ? "blocked" : "ready"}
            </span>
          </motion.div>
        ))}
      </div>

      <button
        onClick={handleToggle}
        disabled={loading}
        className={`w-full py-4 rounded-lg font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 ${
          isActive
            ? "bg-destructive/10 text-destructive"
            : "bg-active-green text-accent-foreground"
        }`}
      >
        {loading
          ? "Processing..."
          : isActive
          ? "End Focus Mode"
          : "Activate Now — Block Devices"}
      </button>

      <button
        onClick={onBack}
        className="mt-3 text-muted-foreground text-sm hover:text-foreground"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
