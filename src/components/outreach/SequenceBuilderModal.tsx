"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Send, Wand2, TestTube, Save, X, Loader2 } from "lucide-react";

export function SequenceBuilderModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [activeTab, setActiveTab] = useState("compose");
  const [step, setStep] = useState(1);
  const [sequenceName, setSequenceName] = useState("");
  const [steps, setSteps] = useState<any[]>([
    { interval_days: 0, subject: "", body: "", use_ai: true, objective: "", ai_suggestions: [] },
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [emailPrompt, setEmailPrompt] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState({ subject: "", body: "" });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [testDelay, setTestDelay] = useState(1);
  const [testLogId, setTestLogId] = useState("");
  const [testStatus, setTestStatus] = useState("");

  const handleGenerateEmail = async () => {
    if (!emailPrompt) {
      toast.error("Please enter a prompt for AI");
      return;
    }
    setLoadingAI(true);
    try {
      const res = await fetch("/api/ai/email-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: emailPrompt, purpose: "cold email", tone: "professional", length: "medium" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGeneratedEmail({ subject: data.subject, body: data.body });
      // Update current step's email
      const newSteps = [...steps];
      newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], subject: data.subject, body: data.body };
      setSteps(newSteps);
      setActiveTab("suggestions");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleGetSuggestions = async () => {
    if (!generatedEmail.subject || !generatedEmail.body) {
      toast.error("First generate or enter email content");
      return;
    }
    setLoadingAI(true);
    try {
      const res = await fetch("/api/ai/email-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailSubject: generatedEmail.subject, emailBody: generatedEmail.body }),
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

  const handleApplySuggestion = (suggestion: any) => {
    // Example: append suggested change to body
    if (suggestion.suggestedChange) {
      const newBody = generatedEmail.body + "\n\n" + suggestion.suggestedChange;
      setGeneratedEmail({ ...generatedEmail, body: newBody });
      const newSteps = [...steps];
      newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], body: newBody };
      setSteps(newSteps);
      toast.success("Suggestion applied");
    }
  };

  const handleAddStep = () => {
    setSteps([...steps, { interval_days: 1, subject: "", body: "", use_ai: true, objective: "" }]);
    setCurrentStepIndex(steps.length);
  };

  const handleUpdateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSaveSequence = async () => {
    if (!sequenceName.trim()) {
      toast.error("Please enter sequence name");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/follow-ups/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sequenceName,
          trigger_type: "manual",
          steps: steps,
          is_test: testMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Sequence saved!");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartTest = async () => {
    if (!testRecipient || !sequenceName) {
      toast.error("Recipient email and sequence name required");
      return;
    }
    try {
      const res = await fetch("/api/sequences/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sequence_id: "", // will be filled after sequence created
          recipient_email: testRecipient,
          delay_minutes: testDelay,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTestLogId(data.test.id);
      setTestStatus("scheduled");
      toast.success("Test scheduled!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-white/10 bg-card/95 backdrop-blur-md text-foreground">
        <DialogHeader>
          <DialogTitle>Create Email Sequence</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Sequence Name</label>
              <Input value={sequenceName} onChange={(e) => setSequenceName(e.target.value)} placeholder="e.g., Cold Outreach - Web Dev" />
            </div>
            <div>
              <label className="text-xs font-medium">Test Mode</label>
              <Select value={testMode ? "true" : "false"} onValueChange={(v) => setTestMode(v === "true")}>
                <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Live</SelectItem>
                  <SelectItem value="true">Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Steps Navigation */}
          <div className="flex flex-wrap gap-2">
            {steps.map((s, i) => (
              <Button
                key={i}
                variant={i === currentStepIndex ? "secondary" : "outline"}
                size="sm"
                onClick={() => setCurrentStepIndex(i)}
              >
                Step {i + 1}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddStep}>+ Add Step</Button>
          </div>

          {/* Current Step Editor */}
          <div className="border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Step {currentStepIndex + 1}</p>
              <Button variant="ghost" size="sm" className="text-red-400" onClick={() => {
                const newSteps = steps.filter((_, idx) => idx !== currentStepIndex);
                setSteps(newSteps);
                setCurrentStepIndex(Math.max(0, currentStepIndex - 1));
              }}>Remove</Button>
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
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="text-xs font-medium">Subject</label>
                    <Input value={steps[currentStepIndex].subject} onChange={(e) => handleUpdateStep(currentStepIndex, 'subject', e.target.value)} placeholder="Email subject" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Body</label>
                    <Textarea rows={5} value={steps[currentStepIndex].body} onChange={(e) => handleUpdateStep(currentStepIndex, 'body', e.target.value)} placeholder="Email body" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Delay Days</label>
                    <Input type="number" min="0" value={steps[currentStepIndex].interval_days} onChange={(e) => handleUpdateStep(currentStepIndex, 'interval_days', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Use AI</label>
                    <Select value={steps[currentStepIndex].use_ai ? "true" : "false"} onValueChange={(v) => handleUpdateStep(currentStepIndex, 'use_ai', v === "true")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <Button size="sm" variant="outline" onClick={() => handleApplySuggestion(sug)}>Apply</Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-3">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm font-bold">{steps[currentStepIndex].subject || 'No Subject'}</p>
                  <div className="text-xs whitespace-pre-wrap mt-2">{steps[currentStepIndex].body || 'No body content'}</div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Test Section */}
          {testMode && (
            <div className="border border-white/10 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2"><TestTube className="h-4 w-4" /> Test Mode</p>
              <div className="flex gap-2">
                <Input value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)} placeholder="Your test email" />
                <Input type="number" min="1" value={testDelay} onChange={(e) => setTestDelay(Number(e.target.value))} placeholder="Delay (minutes)" />
                <Button onClick={handleStartTest} className="btn-gradient text-xs">Start Test</Button>
              </div>
              {testStatus && <p className="text-xs text-muted-foreground">Status: {testStatus}</p>}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveSequence} disabled={saving} className="btn-gradient">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save Sequence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}