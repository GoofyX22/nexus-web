"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Smartphone, Tablet, Laptop, Gamepad2, Tv, Plus, X, Copy, Check,
} from "lucide-react";
import { useData, Device } from "@/context/DataContext";

const deviceIcons: Record<Device["type"], typeof Smartphone> = {
  phone: Smartphone, tablet: Tablet, laptop: Laptop, gaming: Gamepad2, tv: Tv,
};

const deviceTypes: { type: Device["type"]; icon: typeof Smartphone; label: string }[] = [
  { type: "phone", icon: Smartphone, label: "Phone" },
  { type: "tablet", icon: Tablet, label: "Tablet" },
  { type: "laptop", icon: Laptop, label: "Laptop" },
  { type: "gaming", icon: Gamepad2, label: "Console" },
  { type: "tv", icon: Tv, label: "Smart TV" },
];

const statusStyles: Record<Device["status"], string> = {
  active: "bg-active-green/20 text-accent-foreground",
  blocked: "bg-destructive/10 text-destructive",
  idle: "bg-secondary text-muted-foreground",
};

export default function DeviceOverviewScreen({ onBack }: { onBack: () => void }) {
  const { devices, addDevice, removeDevice } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [selectedType, setSelectedType] = useState<Device["type"]>("phone");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    if (!deviceName.trim()) return;
    setError("");
    try {
      await addDevice(deviceName.trim(), selectedType);
      setDeviceName("");
      setShowAdd(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-12 pb-24">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <h1 className="text-2xl font-heading font-bold">Connected Devices</h1>
      <p className="text-muted-foreground mt-1 mb-6">{devices.length} device{devices.length !== 1 ? "s" : ""}</p>

      <div className="space-y-3">
        {devices.map((device, i) => {
          const Icon = deviceIcons[device.type] || Smartphone;
          return (
            <motion.div
              key={device.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 * i }}
              className="p-4 rounded-xl bg-card border border-input"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{device.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      Code: <span className="font-mono font-bold">{device.pairing_code}</span>
                    </span>
                    <button
                      onClick={() => copyCode(device.pairing_code, device.id)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {copiedId === device.id ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[device.status]}`}>
                  {device.status}
                </span>
                <button
                  onClick={() => removeDevice(device.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X size={16} />
                </button>
              </div>
              {!device.paired && (
                <p className="text-xs text-muted-foreground mt-2 bg-secondary/50 rounded px-2 py-1">
                  Not paired yet. Open the child link on the device and enter code <strong>{device.pairing_code}</strong>
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {showAdd ? (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-4 p-4 rounded-xl bg-card border border-input space-y-3"
        >
          <input
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="Device name"
            className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {deviceTypes.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                  selectedType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary border border-input"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-semibold"
            >
              Add Device
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="py-3 px-4 rounded-lg bg-secondary text-secondary-foreground"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-lg bg-primary text-primary-foreground font-bold mt-6 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus size={18} />
          Add Device
        </button>
      )}
    </div>
  );
}
