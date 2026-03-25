"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Smartphone, Tablet, Laptop, Gamepad2, Tv } from "lucide-react";
import { useApp, Device } from "@/context/AppContext";

const deviceTypes: { type: Device["type"]; icon: typeof Smartphone; label: string }[] = [
  { type: "phone", icon: Smartphone, label: "Phone" },
  { type: "tablet", icon: Tablet, label: "Tablet" },
  { type: "laptop", icon: Laptop, label: "Laptop" },
  { type: "gaming", icon: Gamepad2, label: "Console" },
  { type: "tv", icon: Tv, label: "Smart TV" },
];

export default function FamilySetupScreen() {
  const { setScreen, children, addChild, removeChild, devices, addDevice, removeDevice } = useApp();
  const [childName, setChildName] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [selectedType, setSelectedType] = useState<Device["type"]>("phone");

  const handleAddChild = () => {
    if (childName.trim()) {
      addChild(childName.trim());
      setChildName("");
    }
  };

  const handleAddDevice = () => {
    if (deviceName.trim()) {
      addDevice(deviceName.trim(), selectedType);
      setDeviceName("");
    }
  };

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="min-h-screen bg-background px-6 py-12"
    >
      <h1 className="text-2xl font-heading font-bold text-foreground">Set Up Your Family</h1>
      <p className="text-muted-foreground mt-1 mb-8">Add your family members and their devices</p>

      {/* Family Members */}
      <section className="mb-8">
        <h2 className="text-lg font-heading font-semibold mb-3">Family Members</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddChild()}
            placeholder="Child's name"
            className="flex-1 px-4 py-3 rounded-lg bg-card border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleAddChild}
            className="px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {children.map((child) => (
            <span
              key={child.id}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
            >
              {child.name}
              <button onClick={() => removeChild(child.id)} className="hover:opacity-70">
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Devices */}
      <section className="mb-8">
        <h2 className="text-lg font-heading font-semibold mb-3">Devices</h2>
        <input
          type="text"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          placeholder="Device name"
          className="w-full px-4 py-3 rounded-lg bg-card border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-3"
        />
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {deviceTypes.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedType === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-input text-foreground"
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={handleAddDevice}
          className="w-full py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:opacity-90 active:scale-[0.98] transition-all mb-3"
        >
          Add Device
        </button>
        <div className="space-y-2">
          {devices.map((device) => {
            const DevIcon = deviceTypes.find((d) => d.type === device.type)?.icon || Smartphone;
            return (
              <div key={device.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-input">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DevIcon size={18} className="text-primary" />
                </div>
                <span className="flex-1 font-medium">{device.name}</span>
                <button onClick={() => removeDevice(device.id)} className="text-muted-foreground hover:text-destructive">
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <button
        onClick={() => setScreen("dashboard")}
        className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
      >
        Continue
      </button>
    </motion.div>
  );
}
