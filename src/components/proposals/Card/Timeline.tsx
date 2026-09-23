// components/Timeline.tsx
interface Milestone {
  week: string;
  task: string;
}
export function Timeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-foreground">⏳ Timeline</h3>
      <ul className="space-y-1">
        {milestones.map((m, i) => (
          <li key={i} className="text-sm text-foreground/80 flex gap-2">
            <span className="font-medium text-primary">{m.week}:</span> {m.task}
          </li>
        ))}
      </ul>
    </div>
  );
}