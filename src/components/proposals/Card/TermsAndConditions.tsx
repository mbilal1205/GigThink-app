// components/TermsAndConditions.tsx
export function TermsAndConditions({ terms }: { terms: string[] }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-foreground">📜 Terms & Conditions</h3>
      <ul className="list-disc pl-4 space-y-0.5">
        {terms.map((t, i) => (
          <li key={i} className="text-xs text-foreground/80">{t}</li>
        ))}
      </ul>
    </div>
  );
}