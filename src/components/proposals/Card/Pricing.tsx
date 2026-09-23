// components/Pricing.tsx
interface PricingItem {
  item: string;
  cost: string;
}
export function Pricing({ total, breakdown }: { total: string; breakdown: PricingItem[] }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-foreground">💰 Pricing</h3>
      <p className="text-sm font-medium text-foreground">Total: {total}</p>
      <ul className="space-y-0.5">
        {breakdown.map((b, i) => (
          <li key={i} className="text-xs text-muted-foreground flex justify-between">
            <span>{b.item}</span>
            <span>{b.cost}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}