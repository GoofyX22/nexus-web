"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useData } from "@/context/DataContext";

export default function CreateScheduleScreen({
  editingId,
  onBack,
}: {
  editingId: string | null;
  onBack: () => void;
}) {
  const { devices, schedules, createSchedule, updateSchedule, deleteSchedule } = useData();

  const editing = editingId ? schedules.find((s) => s.id === editingId) : null;

  const [name, setName] = useState("");
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("10:00");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [pauseNotifications, setPauseNotifications] = useState(false);
  const [lockEntertainment, setLockEntertainment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setTimeStart(editing.time_start);
      setTimeEnd(editing.time_end);
      setSelectedDevices(editing.device_ids || []);
      setPauseNotifications(editing.pause_notifications);
      setLockEntertainment(editing.lock_entertainment);
    }
  }, [editing]);

  const toggleDevice = (id: string) => {
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = {
        name: name.trim(),
        time_start: timeStart,
        time_end: timeEnd,
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        pause_notifications: pauseNotifications,
        lock_entertainment: lockEntertainment,
        status: "scheduled" as const,
        icon: "BookOpen",
      };

      if (editing) {
        await updateSchedule(editing.id, data, selectedDevices);
      } else {
        await createSchedule(data, selectedDevices);
      }
      onBack();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    setLoading(true);
    try {
      await deleteSchedule(editing.id);
      onBack();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="min-h-screen bg-background px-6 py-12"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <h1 className="text-2xl font-heading font-bold mb-6">
        {editing ? "Edit Routine" : "Create Routine"}
      </h1>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            Routine Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Homework Time"
            className="w-full px-4 py-3 rounded-lg bg-card border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Start</label>
            <input
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-card border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">End</label>
            <input
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-card border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Devices to block ({selectedDevices.length} selected)
          </label>
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No devices yet. Add devices from the Devices tab first.
            </p>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => {
                const selected = selectedDevices.includes(device.id);
                return (
                  <button
                    key={device.id}
                    onClick={() => toggleDevice(device.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selected ? "border-primary bg-primary/5" : "border-input bg-card"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selected ? "border-primary" : "border-muted-foreground"
                      }`}
                    >
                      {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <span className="font-medium">{device.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

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

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={loading || !name.trim()}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <Save size={20} />
          {loading ? "Saving..." : "Save Routine"}
        </button>

        {editing && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-destructive/10 text-destructive font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Trash2 size={18} />
            Delete Routine
          </button>
        )}
      </div>
    </motion.div>
  );
}
