import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck } from "lucide-react";

interface ProjectTitleSectionProps {
  clientName?: string;  // Optional banaya
  projectTitle?: string;  // Optional banaya
  onTitleChange: (value: string) => void;
}

export function ProjectTitleSection({
  clientName = "Valued Client",  // Default value
  projectTitle = "Untitled Proposal",  // Default value
  onTitleChange,
}: ProjectTitleSectionProps) {
  return (
    <div className="border-b pb-4">
      <Badge className="bg-primary/10 text-primary border-none text-xs font-semibold px-3 py-1 mb-2">
        <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Client: {clientName}
      </Badge>
      <Input
        value={projectTitle}
        onChange={(e) => onTitleChange(e.target.value)}
        className="text-2xl sm:text-3xl font-extrabold border-none shadow-none p-0 h-auto focus-visible:ring-0"
      />
    </div>
  );
}