import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { TimelineItem } from "@/components/proposals/proposal-types";

interface TimelineSectionProps {
  timeline?: TimelineItem[];  // Optional banaya
  onUpdate: (timeline: TimelineItem[]) => void;
}

export function TimelineSection({ 
  timeline = [],  // Default empty array
  onUpdate 
}: TimelineSectionProps) {
  return (
    <div className="rounded-2xl border p-4 sm:p-5 space-y-3 bg-background shadow-sm">
      <h3 className="text-base font-bold flex items-center gap-2">
        <Clock className="h-4.5 w-4.5 text-amber-500" /> 5. Project Timeline & Milestones
      </h3>
      <p className="text-xs text-muted-foreground">
        Schedule breakdown across phases and weeks.
      </p>
      <div className="space-y-2 pt-2">
        {timeline.map((item, idx) => (
          <div
            key={idx}
            className="p-3 border rounded-xl bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div className="space-y-1 flex-1">
              <Input
                value={item.phase}
                onChange={(e) => {
                  const updated = [...timeline];
                  updated[idx] = { ...updated[idx], phase: e.target.value };
                  onUpdate(updated);
                }}
                className="font-semibold text-xs border-none p-0 h-auto bg-transparent"
                placeholder="Phase name"
              />
              <Input
                value={item.duration}
                onChange={(e) => {
                  const updated = [...timeline];
                  updated[idx] = { ...updated[idx], duration: e.target.value };
                  onUpdate(updated);
                }}
                className="text-xs text-muted-foreground border-none p-0 h-auto bg-transparent"
                placeholder="Duration"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}