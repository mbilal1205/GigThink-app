import { ProposalAssistantPanel } from "@/components/proposals/ProposalAssistantPanel";
import type { CustomBlock, InsertTarget } from "@/components/proposals/proposal-types";

interface AIPanelWrapperProps {
  projectTitle?: string;  // Optional banaya
  clientName?: string;  // Optional banaya
  proposalSummary?: string;  // Optional banaya
  customBlocks?: CustomBlock[];  // Optional banaya
  selectedCustomBlockId: string | null;
  onTargetChange: (target: InsertTarget) => void;
  onGenerate: (target: InsertTarget) => void;
  onCreateCustomBlock: () => void;
  onPromptSubmit: (prompt: string) => void;
  onCustomBlockChange: (id: string | null) => void;
}

export function AIPanelWrapper({
  projectTitle = "Untitled Project",  // Default value
  clientName = "Valued Client",  // Default value
  proposalSummary = "",  // Default value
  customBlocks = [],  // Default empty array
  selectedCustomBlockId,
  onTargetChange,
  onGenerate,
  onCreateCustomBlock,
  onPromptSubmit,
  onCustomBlockChange,
}: AIPanelWrapperProps) {
  return (
    <div className="xl:sticky xl:top-6 space-y-4">
      <ProposalAssistantPanel
        projectTitle={projectTitle}
        clientName={clientName}
        proposalSummary={proposalSummary}
        customBlocks={customBlocks}
        selectedCustomBlockId={selectedCustomBlockId}
        onTargetChange={onTargetChange}
        onInsert={(target) => onGenerate(target)}
        onCreateCustomBlock={onCreateCustomBlock}
        onGenerateProposal={() => onGenerate("executiveSummary")}
        onPromptSubmit={(promptText) => onPromptSubmit(promptText)}
        onCustomBlockChange={onCustomBlockChange}
      />
    </div>
  );
}