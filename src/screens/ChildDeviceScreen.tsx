"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Wifi } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface EnforcementState {
  is_blocked: boolean;
  active_schedule_id: string | null;
  schedule_name?: string;
}

export default function ChildDeviceScreen() {
  const [pairingCode, setPairingCode] = useState("");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [enforcement, setEnforcement] = useState<EnforcementState | null>(null);
  const [paired, setPaired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if already paired (stored in localStorage)
  useEffect(() => {
    const storedDeviceId = localStorage.getItem("nexus_device_id");
    const storedDeviceName = localStorage.getItem("nexus_device_name");
    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
      setDeviceName(storedDeviceName || "This Device");
      setPaired(true);
    }
  }, []);

  // Subscribe to enforcement status when paired
  useEffect(() => {
    if (!deviceId) return;

    // Initial fetch
    const fetchEnforcement = async () => {
      const { data } = await supabase
        .from("enforcement_status")
        .select("*")
        .eq("device_id", deviceId)
        .single();

      if (data) {
        // Fetch schedule name if blocked
        let scheduleName = "";
        if (data.active_schedule_id) {
          const { data: schedule } = await supabase
            .from("schedules")
            .select("name")
            .eq("id", data.active_schedule_id)
            .single();
          scheduleName = schedule?.name || "";
        }
        setEnforcement({
          is_blocked: data.is_blocked,
          active_schedule_id: data.active_schedule_id,
          schedule_name: scheduleName,
        });
      }
    };

    fetchEnforcement();

    // Realtime subscription
    const channel = supabase
      .channel(`enforcement-${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "enforcement_status",
          filter: `device_id=eq.${deviceId}`,
        },
        async (payload) => {
          const newData = payload.new as { is_blocked: boolean; active_schedule_id: string | null };
          let scheduleName = "";
          if (newData.active_schedule_id) {
            const { data: schedule } = await supabase
              .from("schedules")
              .select("name")
              .eq("id", newData.active_schedule_id)
              .single();
            scheduleName = schedule?.name || "";
          }
          setEnforcement({
            is_blocked: newData.is_blocked,
            active_schedule_id: newData.active_schedule_id,
            schedule_name: scheduleName,
          });
        }
      )
      .subscribe();

    // Poll as backup every 10 seconds
    const poll = setInterval(fetchEnforcement, 10000);

    return () => {
      channel.unsubscribe();
      clearInterval(poll);
    };
  }, [deviceId]);

  const handlePair = async () => {
    if (!pairingCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      // Find device by pairing code
      const { data: device, error: err } = await supabase
        .from("devices")
        .select("*")
        .eq("pairing_code", pairingCode.trim().toUpperCase())
        .single();

      if (err || !device) {
        setError("Invalid pairing code. Check with your parent.");
        return;
      }

      // Mark as paired
      await supabase
        .from("devices")
        .update({ paired: true, status: "active" })
        .eq("id", device.id);

      // Create enforcement status row only if one doesn't exist yet
      const { data: existing } = await supabase
        .from("enforcement_status")
        .select("device_id")
        .eq("device_id", device.id)
        .single();

      if (!existing) {
        await supabase.from("enforcement_status").insert({
          device_id: device.id,
          is_blocked: false,
          active_schedule_id: null,
          updated_at: new Date().toISOString(),
        });
      }

      // Store locally
      localStorage.setItem("nexus_device_id", device.id);
      localStorage.setItem("nexus_device_name", device.name);

      setDeviceId(device.id);
      setDeviceName(device.name);
      setPaired(true);
    } catch {
      setError("Failed to pair. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // BLOCKED STATE — fullscreen overlay
  if (paired && enforcement?.is_blocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-red-950 to-red-900 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mb-8 mx-auto">
            <Lock size={60} className="text-white" />
          </div>

          <h1 className="text-3xl font-heading font-bold text-white text-center">
            Device Blocked
          </h1>

          {enforcement.schedule_name && (
            <p className="text-white/80 text-center mt-3 text-lg">
              {enforcement.schedule_name}
            </p>
          )}

          <p className="text-white/60 text-center mt-2">
            This device is currently restricted by your parent.
          </p>

          <div className="mt-10 p-4 rounded-xl bg-white/10 border border-white/20">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-white/80" />
              <div>
                <p className="text-white font-semibold">Focus Mode Active</p>
                <p className="text-white/60 text-sm">
                  Stay focused. Your parent will unblock when it&apos;s time.
                </p>
              </div>
            </div>
          </div>

          <p className="text-white/40 text-center mt-8 text-sm">
            Managed by Nexus
          </p>
        </motion.div>
      </div>
    );
  }

  // PAIRING STATE
  if (!paired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
        >
          <Wifi size={36} className="text-primary" />
        </motion.div>

        <h1 className="text-2xl font-heading font-bold">Pair This Device</h1>
        <p className="text-muted-foreground text-center mt-2 mb-8 max-w-xs">
          Enter the pairing code from your parent&apos;s Nexus dashboard
        </p>

        <input
          type="text"
          value={pairingCode}
          onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
          placeholder="Enter 6-digit code"
          maxLength={6}
          className="w-full max-w-xs px-4 py-4 rounded-lg bg-card border border-input text-foreground text-center text-2xl font-mono tracking-[0.5em] placeholder:text-muted-foreground placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg mt-3">
            {error}
          </p>
        )}

        <button
          onClick={handlePair}
          disabled={loading || pairingCode.length < 4}
          className="w-full max-w-xs py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg mt-4 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? "Pairing..." : "Pair Device"}
        </button>
      </div>
    );
  }

  // PAIRED & NOT BLOCKED — idle state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 rounded-full bg-active-green/20 flex items-center justify-center mb-6"
      >
        <Shield size={36} className="text-accent" />
      </motion.div>

      <h1 className="text-2xl font-heading font-bold">{deviceName}</h1>
      <p className="text-muted-foreground text-center mt-2">
        Connected to Nexus
      </p>

      <div className="mt-8 p-4 rounded-xl bg-active-green/10 border border-active-green/20 w-full max-w-xs">
        <p className="text-accent-foreground font-semibold text-center">
          All clear — no restrictions active
        </p>
      </div>

      <p className="text-muted-foreground text-center mt-6 text-sm max-w-xs">
        Keep this page open. When your parent activates a routine, this screen will update automatically.
      </p>

      <button
        onClick={() => {
          localStorage.removeItem("nexus_device_id");
          localStorage.removeItem("nexus_device_name");
          setPaired(false);
          setDeviceId(null);
        }}
        className="mt-8 text-sm text-muted-foreground hover:text-destructive"
      >
        Unpair this device
      </button>
    </div>
  );
}
