// components/Section.tsx
interface SectionProps {
  title: string;
  children: React.ReactNode;
  icon?: string;
}
export function Section({ title, children, icon }: SectionProps) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <span>{icon}</span> {title}
      </h3>
      <div className="text-sm leading-relaxed text-foreground/85">{children}</div>
    </div>
  );
}