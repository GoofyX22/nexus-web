"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const fullscreenRetryRef = useRef<NodeJS.Timeout | null>(null);

  const isBlocked = paired && enforcement?.is_blocked;

  // ─── Fullscreen helpers ───────────────────────────────
  const requestFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen({ navigationUI: "hide" });
      } else if ((el as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen) {
        await (el as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      }
    } catch {
      // Fullscreen denied — user interaction required; we'll retry on next tap
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  // ─── Wake Lock ────────────────────────────────────────
  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // Wake Lock not supported or denied
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  // ─── Lock / Unlock device ────────────────────────────
  const lockDevice = useCallback(async () => {
    await requestFullscreen();
    await requestWakeLock();

    // Keep retrying fullscreen every 2s (in case kid exits it)
    if (fullscreenRetryRef.current) clearInterval(fullscreenRetryRef.current);
    fullscreenRetryRef.current = setInterval(async () => {
      if (!document.fullscreenElement) {
        await requestFullscreen();
      }
    }, 2000);
  }, [requestFullscreen, requestWakeLock]);

  const unlockDevice = useCallback(async () => {
    if (fullscreenRetryRef.current) {
      clearInterval(fullscreenRetryRef.current);
      fullscreenRetryRef.current = null;
    }
    await exitFullscreen();
    await releaseWakeLock();
  }, [exitFullscreen, releaseWakeLock]);

  // ─── Trigger lock/unlock on block state change ───────
  useEffect(() => {
    if (isBlocked) {
      lockDevice();
    } else {
      unlockDevice();
    }
    return () => {
      unlockDevice();
    };
  }, [isBlocked, lockDevice, unlockDevice]);

  // ─── Back button trap (push fake history entries) ─────
  useEffect(() => {
    if (!isBlocked) return;

    // Push extra history entries so back button doesn't leave
    for (let i = 0; i < 10; i++) {
      window.history.pushState({ blocked: true }, "", window.location.href);
    }

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Push another entry so they can never go back
      window.history.pushState({ blocked: true }, "", window.location.href);
      // Re-request fullscreen on back press
      requestFullscreen();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isBlocked, requestFullscreen]);

  // ─── Prevent keyboard escape from fullscreen ──────────
  useEffect(() => {
    if (!isBlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Escape, F11, Alt+F4, Ctrl+W, etc.
      if (
        e.key === "Escape" ||
        e.key === "F11" ||
        (e.altKey && e.key === "F4") ||
        (e.ctrlKey && e.key === "w") ||
        (e.ctrlKey && e.key === "t") ||
        (e.metaKey && e.key === "h")
      ) {
        e.preventDefault();
        e.stopPropagation();
        requestFullscreen();
      }
    };

    // Re-enter fullscreen when it exits
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isBlocked) {
        setTimeout(() => requestFullscreen(), 500);
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isBlocked, requestFullscreen]);

  // ─── Re-lock when page becomes visible again ──────────
  useEffect(() => {
    if (!isBlocked) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isBlocked) {
        requestFullscreen();
        requestWakeLock();
      }
    };

    // Re-acquire wake lock on visibility change
    const handleWakeLockRelease = () => {
      if (isBlocked) requestWakeLock();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    wakeLockRef.current?.addEventListener("release", handleWakeLockRelease);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isBlocked, requestFullscreen, requestWakeLock]);

  // ─── Beforeunload — warn if kid tries to close tab ───
  useEffect(() => {
    if (!isBlocked) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "This device is managed by Nexus. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isBlocked]);

  // ─── Check for stored pairing ─────────────────────────
  useEffect(() => {
    const storedDeviceId = localStorage.getItem("nexus_device_id");
    const storedDeviceName = localStorage.getItem("nexus_device_name");
    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
      setDeviceName(storedDeviceName || "This Device");
      setPaired(true);
    }
  }, []);

  // ─── Subscribe to enforcement status ──────────────────
  useEffect(() => {
    if (!deviceId) return;

    const fetchEnforcement = async () => {
      const { data } = await supabase
        .from("enforcement_status")
        .select("*")
        .eq("device_id", deviceId)
        .single();

      if (data) {
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

    // Poll backup every 5 seconds (more frequent for responsiveness)
    const poll = setInterval(fetchEnforcement, 5000);

    return () => {
      channel.unsubscribe();
      clearInterval(poll);
    };
  }, [deviceId]);

  // ─── Pairing handler ─────────────────────────────────
  const handlePair = async () => {
    if (!pairingCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data: device, error: err } = await supabase
        .from("devices")
        .select("*")
        .eq("pairing_code", pairingCode.trim().toUpperCase())
        .single();

      if (err || !device) {
        setError("Invalid pairing code. Check with your parent.");
        return;
      }

      await supabase
        .from("devices")
        .update({ paired: true, status: "active" })
        .eq("id", device.id);

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

  // ═══════════════════════════════════════════════════════
  // BLOCKED STATE — true fullscreen device lock
  // ═══════════════════════════════════════════════════════
  if (isBlocked) {
    return (
      <div
        className="fixed inset-0 z-[999999] bg-gradient-to-b from-red-950 to-red-900 flex flex-col items-center justify-center select-none"
        style={{
          // Cover absolutely everything
          width: "100vw",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          overscrollBehavior: "none",
        }}
        // Tap anywhere to re-request fullscreen (helps on mobile)
        onClick={() => requestFullscreen()}
        onTouchStart={() => requestFullscreen()}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex flex-col items-center px-6"
        >
          <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mb-8">
            <Lock size={60} className="text-white" />
          </div>

          <h1 className="text-4xl font-heading font-bold text-white text-center">
            Device Blocked
          </h1>

          {enforcement?.schedule_name && (
            <p className="text-white/80 text-center mt-3 text-xl">
              {enforcement.schedule_name}
            </p>
          )}

          <p className="text-white/60 text-center mt-3 text-lg">
            This device is currently restricted by your parent.
          </p>

          <div className="mt-10 p-5 rounded-2xl bg-white/10 border border-white/20 w-full max-w-sm">
            <div className="flex items-center gap-3">
              <Shield size={24} className="text-white/80 flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-lg">Focus Mode Active</p>
                <p className="text-white/60">
                  Stay focused. Your parent will unblock when it&apos;s time.
                </p>
              </div>
            </div>
          </div>

          {/* Pulsing indicator */}
          <div className="mt-10 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
            <p className="text-white/50 text-sm">Managed by Nexus</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // PAIRING STATE
  // ═══════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════
  // PAIRED & NOT BLOCKED — idle state
  // ═══════════════════════════════════════════════════════
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
