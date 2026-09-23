"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Sparkles,
  Send,
  Wand2,
  TestTube,
  Save,
  X,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

export function SequenceFormModal({
  open,
  onClose,
  sequence,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  sequence: any | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("manual");
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("compose");
  const [emailPrompt, setEmailPrompt] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState({ subject: "", body: "" });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sequence) {
      setName(sequence.name);
      setTriggerType(sequence.trigger_type || "manual");
      setSteps(sequence.steps?.length ? sequence.steps : [{ interval_days: 0, subject: "", body: "", use_ai: true, objective: "" }]);
      setCurrentStepIndex(0);
    } else {
      setName("");
      setTriggerType("manual");
      setSteps([{ interval_days: 0, subject: "", body: "", use_ai: true, objective: "" }]);
      setCurrentStepIndex(0);
    }
  }, [sequence, open]);

  const addStep = () => {
    setSteps([...steps, { interval_days: 1, subject: "", body: "", use_ai: true, objective: "" }]);
    setCurrentStepIndex(steps.length);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    setCurrentStepIndex(Math.max(0, index - 1));
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleGenerateEmail = async () => {
    if (!emailPrompt.trim()) {
      toast.error("Please enter a prompt for AI");
      return;
    }
    setLoadingAI(true);
    try {
      const res = await fetch("/api/ai/email-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: emailPrompt,
          purpose: "cold email",
          tone: "professional",
          length: "medium",
          personalization: "moderate",
          cta: "reply",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeneratedEmail({ subject: data.subject, body: data.body });
      updateStep(currentStepIndex, "subject", data.subject);
      updateStep(currentStepIndex, "body", data.body);
      setActiveTab("suggestions");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleGetSuggestions = async () => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep?.subject || !currentStep?.body) {
      toast.error("First generate or enter email content");
      return;
    }
    setLoadingAI(true);
    try {
      const res = await fetch("/api/ai/email-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailSubject: currentStep.subject,
          emailBody: currentStep.body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const applySuggestion = (suggestion: any) => {
    if (suggestion.suggestedChange) {
      const currentBody = steps[currentStepIndex].body || "";
      const newBody = currentBody + "\n\n" + suggestion.suggestedChange;
      updateStep(currentStepIndex, "body", newBody);
      toast.success("Suggestion applied");
    } else {
      toast.info("No direct text change available for this suggestion.");
    }
  };

  const handleSaveSequence = async () => {
    if (!name.trim()) {
      toast.error("Sequence name required");
      return;
    }
    if (steps.length === 0) {
      toast.error("At least one step required");
      return;
    }
    setSaving(true);
    try {
      const url = sequence ? `/api/follow-ups/sequences/${sequence.id}` : "/api/follow-ups/sequences";
      const method = sequence ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          trigger_type: triggerType,
          steps: steps,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success("Sequence saved successfully");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-white/10 bg-card/95 backdrop-blur-md text-foreground">
        <DialogHeader>
          <DialogTitle>{sequence ? "Edit Sequence" : "Create Sequence"}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Build your email sequence with AI assistance, suggestions, and preview.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Sequence Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Cold Outreach - Web Dev" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Trigger Type</label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                  <SelectItem value="lead_saved">Lead Saved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Steps Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            {steps.map((_, i) => (
              <Button
                key={i}
                variant={i === currentStepIndex ? "secondary" : "outline"}
                size="sm"
                onClick={() => setCurrentStepIndex(i)}
              >
                Step {i + 1}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={addStep}>
              <Plus className="h-3 w-3 mr-1" /> Add Step
            </Button>
          </div>

          {/* Current Step Editor */}
          {steps[currentStepIndex] && (
            <div className="border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Step {currentStepIndex + 1}</p>
                <Button variant="ghost" size="sm" className="text-red-400" onClick={() => removeStep(currentStepIndex)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Remove
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-white/5 border border-white/10 rounded-lg p-1">
                  <TabsTrigger value="compose" className="text-xs">Compose</TabsTrigger>
                  <TabsTrigger value="suggestions" className="text-xs">AI Suggestions</TabsTrigger>
                  <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="compose" className="mt-3 space-y-3">
                  <div>
                    <label className="text-xs font-medium">AI Prompt (describe desired email)</label>
                    <Textarea
                      value={emailPrompt}
                      onChange={(e) => setEmailPrompt(e.target.value)}
                      placeholder="e.g., Write a professional cold email to a potential client about our web development services..."
                      rows={2}
                    />
                    <Button onClick={handleGenerateEmail} disabled={loadingAI} className="mt-2 btn-gradient text-xs">
                      {loadingAI ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                      Generate Email
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium">Subject</label>
                      <Input
                        value={steps[currentStepIndex].subject}
                        onChange={(e) => updateStep(currentStepIndex, "subject", e.target.value)}
                        placeholder="Email subject"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Body</label>
                      <Textarea
                        rows={5}
                        value={steps[currentStepIndex].body}
                        onChange={(e) => updateStep(currentStepIndex, "body", e.target.value)}
                        placeholder="Email body"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium">Delay (days)</label>
                      <Input
                        type="number"
                        min="0"
                        value={steps[currentStepIndex].interval_days}
                        onChange={(e) => updateStep(currentStepIndex, "interval_days", Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Use AI</label>
                      <Select
                        value={steps[currentStepIndex].use_ai ? "true" : "false"}
                        onValueChange={(v) => updateStep(currentStepIndex, "use_ai", v === "true")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Use AI?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="suggestions" className="mt-3">
                  <Button onClick={handleGetSuggestions} disabled={loadingAI} className="btn-gradient text-xs">
                    {loadingAI ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Wand2 className="h-4 w-4 mr-1" />}
                    Get AI Suggestions
                  </Button>
                  <div className="space-y-2 mt-2">
                    {suggestions.map((sug, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium">{sug.title}</p>
                          <p className="text-[11px] text-muted-foreground">{sug.description}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => applySuggestion(sug)}>Apply</Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-3">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm font-bold">{steps[currentStepIndex].subject || "No Subject"}</p>
                    <div className="text-xs whitespace-pre-wrap mt-2">{steps[currentStepIndex].body || "No body content"}</div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving} className="text-xs">Cancel</Button>
          <Button onClick={handleSaveSequence} disabled={saving} className="btn-gradient text-xs">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save Sequence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}