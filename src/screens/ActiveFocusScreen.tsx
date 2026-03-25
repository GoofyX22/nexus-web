"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Pause } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function ActiveFocusScreen() {
  const { setScreen, activeSchedule, devices } = useApp();
  const [seconds, setSeconds] = useState(45 * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");

  const pausedDevices = devices.filter(
    (d) => activeSchedule?.devices.includes(d.id)
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      {/* Focus Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring" }}
        className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6"
      >
        <BookOpen size={40} className="text-primary" />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-heading font-bold text-center"
      >
        {activeSchedule?.name || "Focus Mode"}
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center mt-2"
      >
        Devices are paused during this routine
      </motion.p>

      {/* Timer */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
        className="relative w-44 h-44 rounded-full border-4 border-primary/20 flex items-center justify-center my-10"
      >
        <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse-soft" />
        <span className="text-4xl font-heading font-bold text-foreground">
          {mm}:{ss}
        </span>
      </motion.div>

      {/* Paused Devices */}
      <div className="w-full space-y-2 mb-8">
        {pausedDevices.map((device, i) => (
          <motion.div
            key={device.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 + 0.05 * i }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-input"
          >
            <Pause size={16} className="text-muted-foreground" />
            <span className="font-medium">{device.name}</span>
          </motion.div>
        ))}
      </div>

      <button
        onClick={() => setScreen("dashboard")}
        className="w-full py-4 rounded-lg bg-secondary text-muted-foreground font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
      >
        End Focus Mode Early
      </button>
    </div>
  );
}
