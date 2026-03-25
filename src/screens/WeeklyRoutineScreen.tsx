"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useData } from "@/context/DataContext";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 15 }, (_, i) => i + 7);

const colorMap: Record<number, string> = {
  0: "bg-primary/20 border-primary/30",
  1: "bg-muted border-muted-foreground/20",
  2: "bg-active-green/20 border-active-green/30",
  3: "bg-primary/10 border-primary/20",
};

function timeToHour(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

export default function WeeklyRoutineScreen({ onBack }: { onBack: () => void }) {
  const { schedules } = useData();

  return (
    <div className="min-h-screen bg-background px-6 pt-12 pb-24">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <h1 className="text-2xl font-heading font-bold">Weekly Schedule</h1>
      <p className="text-muted-foreground mt-1 mb-6">Your family&apos;s routine overview</p>

      {schedules.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No routines yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto -mx-6 px-6">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-8 gap-1">
                <div className="text-xs text-muted-foreground font-medium p-2" />
                {days.map((day) => (
                  <div key={day} className="text-xs text-center font-semibold p-2 text-foreground">
                    {day}
                  </div>
                ))}

                {hours.map((hour) => (
                  <div key={hour} className="contents">
                    <div className="text-xs text-muted-foreground p-1 text-right pr-2">
                      {hour > 12 ? `${hour - 12}pm` : hour === 12 ? "12pm" : `${hour}am`}
                    </div>
                    {days.map((day) => {
                      const blockIdx = schedules.findIndex((s) => {
                        const start = timeToHour(s.time_start);
                        const end = timeToHour(s.time_end);
                        const inDay = !s.days || s.days.includes(day);
                        return inDay && hour >= start && hour < end;
                      });
                      const block = blockIdx >= 0 ? schedules[blockIdx] : null;
                      return (
                        <div
                          key={`${day}-${hour}`}
                          className={`h-8 rounded border ${
                            block
                              ? colorMap[blockIdx % 4] || "bg-primary/10 border-primary/20"
                              : "bg-card border-border"
                          }`}
                        >
                          {block && hour === Math.floor(timeToHour(block.time_start)) && (
                            <span className="text-[9px] font-semibold truncate px-1 leading-8">
                              {block.name}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-3 mt-6"
          >
            {schedules.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${(colorMap[i % 4] || "bg-primary/10").split(" ")[0]}`} />
                <span className="text-xs text-muted-foreground">{s.name}</span>
              </div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
