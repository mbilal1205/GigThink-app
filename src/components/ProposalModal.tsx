"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Wand2 } from "lucide-react";
import { toast } from "sonner"; // Agar aap Sonner use kar rahe hain

export function ProposalModal({ isOpen, setIsOpen, lead }: { isOpen: boolean, setIsOpen: (val: boolean) => void, lead: any }) {
  const [proposal, setProposal] = useState("");
  const [subject, setSubject] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const generateProposal = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/proposal/generate", {
        method: "POST",
        body: JSON.stringify({ 
          message: `Create a proposal for ${lead.businessName}. They need help with ${lead.niche}.`,
          forceProposal: true 
        }),
      });
      const data = await res.json();
      setProposal(data.message.content);
      setSubject(`Collaboration opportunity with ${lead.businessName}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    setIsSending(true);
    try {
      const res = await fetch("/api/proposal/send-email", {
        method: "POST",
        body: JSON.stringify({ toEmail: lead.email, subject, htmlBody: proposal }),
      });
      if (res.ok) {
        setIsOpen(false);
        // Toast notification ka code yahan aayega
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pitch to {lead.businessName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Input 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
            placeholder="Email Subject..." 
          />
          <Textarea 
            value={proposal} 
            onChange={(e) => setProposal(e.target.value)}
            className="min-h-[300px]"
            placeholder="Generate proposal to see output..."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={generateProposal} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2" />}
            AI Generate
          </Button>
          <Button onClick={sendEmail} disabled={isSending || !proposal}>
            {isSending ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
            Send Pitch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}