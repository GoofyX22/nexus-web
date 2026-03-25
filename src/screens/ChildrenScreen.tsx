"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, UserRound, Smartphone, Link2, Unlink, ChevronDown,
} from "lucide-react";
import { useData, Device } from "@/context/DataContext";

const deviceTypeIcon: Record<string, string> = {
  phone: "📱",
  tablet: "📲",
  laptop: "💻",
  gaming: "🎮",
  tv: "📺",
};

export default function ChildrenScreen({ onBack }: { onBack: () => void }) {
  const { children, devices, addChild, removeChild, assignDeviceToChild } = useData();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [linkingChildId, setLinkingChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await addChild(newName.trim());
      setNewName("");
      setShowForm(false);
    } catch {
      // handle error silently
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    // Unassign all devices first
    const assignedDevices = devices.filter((d) => d.assigned_to === id);
    for (const d of assignedDevices) {
      await assignDeviceToChild(d.id, null);
    }
    await removeChild(id);
  };

  const handleAssign = async (deviceId: string, childId: string) => {
    setLoading(true);
    try {
      await assignDeviceToChild(deviceId, childId);
    } finally {
      setLoading(false);
      setLinkingChildId(null);
    }
  };

  const handleUnassign = async (deviceId: string) => {
    setLoading(true);
    try {
      await assignDeviceToChild(deviceId, null);
    } finally {
      setLoading(false);
    }
  };

  const getChildDevices = (childId: string): Device[] =>
    devices.filter((d) => d.assigned_to === childId);

  const unassignedDevices = devices.filter((d) => !d.assigned_to);

  return (
    <div className="min-h-screen bg-background px-6 pt-12 pb-24">
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-1 text-primary mb-4">
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>
      <h1 className="text-2xl font-heading font-bold">Children</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {children.length} child{children.length !== 1 ? "ren" : ""}
      </p>

      {/* Children List */}
      <div className="mt-6 space-y-4">
        <AnimatePresence>
          {children.map((child) => {
            const childDevices = getChildDevices(child.id);
            const isLinking = linkingChildId === child.id;

            return (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="rounded-xl bg-card border border-input overflow-hidden"
              >
                {/* Child header */}
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserRound size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{child.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {childDevices.length} device{childDevices.length !== 1 ? "s" : ""} linked
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(child.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Linked devices */}
                {childDevices.length > 0 && (
                  <div className="px-4 pb-2 space-y-2">
                    {childDevices.map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/50"
                      >
                        <span className="text-sm">{deviceTypeIcon[device.type] || "📱"}</span>
                        <span className="text-sm font-medium flex-1">{device.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {device.pairing_code}
                        </span>
                        <button
                          onClick={() => handleUnassign(device.id)}
                          disabled={loading}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Unlink device"
                        >
                          <Unlink size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Link device button / dropdown */}
                <div className="px-4 pb-3 pt-1">
                  {isLinking ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Select a device to link:
                      </p>
                      {unassignedDevices.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-2">
                          No unassigned devices. Add a device first.
                        </p>
                      ) : (
                        unassignedDevices.map((device) => (
                          <button
                            key={device.id}
                            onClick={() => handleAssign(device.id, child.id)}
                            disabled={loading}
                            className="w-full flex items-center gap-2 p-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-left"
                          >
                            <span>{deviceTypeIcon[device.type] || "📱"}</span>
                            <span className="text-sm font-medium">{device.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto font-mono">
                              {device.pairing_code}
                            </span>
                          </button>
                        ))
                      )}
                      <button
                        onClick={() => setLinkingChildId(null)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setLinkingChildId(child.id)}
                      className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80"
                    >
                      <Link2 size={14} />
                      Link a device
                      <ChevronDown size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {children.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UserRound size={28} className="text-primary" />
          </div>
          <p className="text-muted-foreground">No children added yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your children and link their devices.
          </p>
        </div>
      )}

      {/* Add child form */}
      {showForm ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-xl bg-card border border-input"
        >
          <label className="text-sm font-medium text-foreground">Child&apos;s Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Emma"
            className="w-full mt-2 px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add Child"}
            </button>
            <button
              onClick={() => { setShowForm(false); setNewName(""); }}
              className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus size={18} />
          Add Child
        </button>
      )}
    </div>
  );
}
