"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Smartphone, Tablet, Laptop, Gamepad2, Tv } from "lucide-react";
import { useData, Device } from "@/context/DataContext";

const deviceTypes: { type: Device["type"]; icon: typeof Smartphone; label: string }[] = [
  { type: "phone", icon: Smartphone, label: "Phone" },
  { type: "tablet", icon: Tablet, label: "Tablet" },
  { type: "laptop", icon: Laptop, label: "Laptop" },
  { type: "gaming", icon: Gamepad2, label: "Console" },
  { type: "tv", icon: Tv, label: "Smart TV" },
];

export default function OnboardingScreen() {
  const { createHousehold, addChild, removeChild, addDevice, removeDevice, children, devices } =
    useData();
  const [step, setStep] = useState<"household" | "family" | "devices">("household");
  const [householdName, setHouseholdName] = useState("");
  const [childName, setChildName] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [selectedType, setSelectedType] = useState<Device["type"]>("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) return;
    setLoading(true);
    setError("");
    try {
      await createHousehold(householdName.trim());
      setStep("family");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create household");
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!childName.trim()) return;
    try {
      await addChild(childName.trim());
      setChildName("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add child");
    }
  };

  const handleAddDevice = async () => {
    if (!deviceName.trim()) return;
    try {
      await addDevice(deviceName.trim(), selectedType);
      setDeviceName("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add device");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background px-6 py-12"
    >
      {step === "household" && (
        <>
          <h1 className="text-2xl font-heading font-bold">Create Your Household</h1>
          <p className="text-muted-foreground mt-1 mb-8">
            Give your family a name to get started
          </p>
          <input
            type="text"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateHousehold()}
            placeholder="e.g., The Smith Family"
            className="w-full px-4 py-3 rounded-lg bg-card border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-4"
          />
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg mb-4">
              {error}
            </p>
          )}
          <button
            onClick={handleCreateHousehold}
            disabled={loading || !householdName.trim()}
            className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Household"}
          </button>
        </>
      )}

      {step === "family" && (
        <>
          <h1 className="text-2xl font-heading font-bold">Add Your Children</h1>
          <p className="text-muted-foreground mt-1 mb-6">Who&apos;s in the family?</p>

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
              className="px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {children.map((child) => (
              <span
                key={child.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                {child.name}
                <button onClick={() => removeChild(child.id)}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg mb-4">
              {error}
            </p>
          )}

          <button
            onClick={() => setStep("devices")}
            className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {children.length > 0 ? "Next: Add Devices" : "Skip for now"}
          </button>
        </>
      )}

      {step === "devices" && (
        <>
          <h1 className="text-2xl font-heading font-bold">Add Devices</h1>
          <p className="text-muted-foreground mt-1 mb-6">
            Add the devices you want to manage
          </p>

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
                    : "bg-card border border-input"
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={handleAddDevice}
            className="w-full py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:opacity-90 mb-4"
          >
            Add Device
          </button>

          <div className="space-y-2 mb-6">
            {devices.map((device) => {
              const DevIcon =
                deviceTypes.find((d) => d.type === device.type)?.icon || Smartphone;
              return (
                <div
                  key={device.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-input"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <DevIcon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{device.name}</span>
                    <p className="text-xs text-muted-foreground">
                      Pairing code: <span className="font-mono font-bold">{device.pairing_code}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => removeDevice(device.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg mb-4">
              {error}
            </p>
          )}

          {/* This button works because once household exists, the parent will be routed to dashboard */}
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Go to Dashboard
          </button>
        </>
      )}
    </motion.div>
  );
}
