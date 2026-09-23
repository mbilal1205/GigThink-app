// components/CoverLetter.tsx
interface CoverLetterProps {
  clientName: string;
  company: string;
  body: string; // AI generated body
}
export function CoverLetter({ clientName, company, body }: CoverLetterProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">📝 Cover Letter</h3>
      <p className="text-xs text-muted-foreground">Dear {clientName},</p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{body}</p>
      <p className="text-xs text-muted-foreground">
        Best regards,<br />
        Lead Proposal Writer, {company}
      </p>
    </div>
  );
}