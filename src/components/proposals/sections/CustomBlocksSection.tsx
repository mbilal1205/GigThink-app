import { Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProposalCustomBlockCard } from "@/components/proposals/ProposalCustomBlockCard";
import type { CustomBlock } from "@/components/proposals/proposal-types";

interface CustomBlocksSectionProps {
  customSections: CustomBlock[];
  onAddBlock: () => void;
  onRemoveBlock: (id: string) => void;
  onUpdateBlock: (id: string, field: "title" | "content", value: string) => void;
  onAiFill: (customBlockId: string) => void;
}

export function CustomBlocksSection({
  customSections,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onAiFill,
}: CustomBlocksSectionProps) {
  return (
    <div className="space-y-4 border-t pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Layers className="h-4.5 w-4.5 text-primary" /> 7. Custom Sections & Support Blocks
        </h3>
        <Button variant="outline" size="sm" onClick={onAddBlock} className="text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Custom Block
        </Button>
      </div>

      <div className="space-y-3">
        {customSections?.map((block) => (
          <ProposalCustomBlockCard
            key={block.id}
            block={block}
            onTitleChange={(value) => onUpdateBlock(block.id, "title", value)}
            onContentChange={(value) => onUpdateBlock(block.id, "content", value)}
            onRemove={() => onRemoveBlock(block.id)}
            onAiFill={() => onAiFill(block.id)}
          />
        ))}
      </div>
    </div>
  );
}