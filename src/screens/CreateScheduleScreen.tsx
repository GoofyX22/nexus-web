"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function CreateScheduleScreen() {
  const { setScreen, devices, editingSchedule, addSchedule, updateSchedule } = useApp();

  const [name, setName] = useState("");
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("10:00");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [pauseNotifications, setPauseNotifications] = useState(false);
  const [lockEntertainment, setLockEntertainment] = useState(false);

  useEffect(() => {
    if (editingSchedule) {
      setName(editingSchedule.name);
      setTimeStart(editingSchedule.timeStart);
      setTimeEnd(editingSchedule.timeEnd);
      setSelectedDevices(editingSchedule.devices);
      setPauseNotifications(editingSchedule.pauseNotifications);
      setLockEntertainment(editingSchedule.lockEntertainment);
    }
  }, [editingSchedule]);

  const toggleDevice = (id: string) => {
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    const data = {
      name,
      timeStart,
      timeEnd,
      devices: selectedDevices,
      pauseNotifications,
      lockEntertainment,
      status: "scheduled" as const,
      icon: "BookOpen",
    };
    if (editingSchedule) {
      updateSchedule({ ...data, id: editingSchedule.id });
    } else {
      addSchedule(data);
    }
    setScreen("dashboard");
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="min-h-screen bg-background px-6 py-12"
    >
      <button
        onClick={() => setScreen("dashboard")}
        className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <h1 className="text-2xl font-heading font-bold mb-6">
        {editingSchedule ? "Edit Routine" : "Create Routine"}
      </h1>

      <div className="space-y-5">
        {/* Schedule Name */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Schedule Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Homework Time"
            className="w-full px-4 py-3 rounded-lg bg-card border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Start Time
            </label>
            <input
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-card border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              End Time
            </label>
            <input
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-card border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Devices */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Devices
          </label>
          <div className="space-y-2">
            {devices.map((device) => {
              const selected = selectedDevices.includes(device.id);
              return (
                <button
                  key={device.id}
                  onClick={() => toggleDevice(device.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-input bg-card"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selected ? "border-primary" : "border-muted-foreground"
                    }`}
                  >
                    {selected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="font-medium">{device.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Pause Notifications</span>
            <button
              onClick={() => setPauseNotifications(!pauseNotifications)}
              className={`w-12 h-7 rounded-full transition-colors ${
                pauseNotifications ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  pauseNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Lock Entertainment Apps</span>
            <button
              onClick={() => setLockEntertainment(!lockEntertainment)}
              className={`w-12 h-7 rounded-full transition-colors ${
                lockEntertainment ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  lockEntertainment ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Save size={20} />
          Save Routine
        </button>
      </div>
    </motion.div>
  );
}
