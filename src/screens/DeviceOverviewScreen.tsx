"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Smartphone, Tablet, Laptop, Gamepad2, Tv, Plus } from "lucide-react";
import { useApp, Device } from "@/context/AppContext";

const deviceIcons: Record<Device["type"], typeof Smartphone> = {
  phone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  gaming: Gamepad2,
  tv: Tv,
};

const statusStyles: Record<Device["status"], string> = {
  active: "bg-active-green/20 text-accent-foreground",
  paused: "bg-primary/10 text-primary",
  idle: "bg-secondary text-muted-foreground",
};

export default function DeviceOverviewScreen() {
  const { setScreen, devices } = useApp();

  return (
    <div className="min-h-screen bg-background px-6 pt-12 pb-24">
      <button
        onClick={() => setScreen("dashboard")}
        className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <h1 className="text-2xl font-heading font-bold">Connected Devices</h1>
      <p className="text-muted-foreground mt-1 mb-6">{devices.length} devices linked</p>

      <div className="space-y-3">
        {devices.map((device, i) => {
          const Icon = deviceIcons[device.type] || Smartphone;
          return (
            <motion.div
              key={device.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 * i }}
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-input"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{device.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {device.routines.map((r) => (
                    <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[device.status]}`}>
                {device.status}
              </span>
            </motion.div>
          );
        })}
      </div>

      <button
        onClick={() => setScreen("family-setup")}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-lg bg-primary text-primary-foreground font-bold mt-6 hover:opacity-90 active:scale-[0.98] transition-all"
      >
        <Plus size={18} />
        Add Device
      </button>
    </div>
  );
}
