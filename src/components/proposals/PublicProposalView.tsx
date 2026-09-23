"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function PublicProposalView({ proposal, agencyProfile, isPremium }: any) {
  const handleAction = async (action: string) => {
    // Call API to record client action
    await fetch(`/api/proposals/public/${proposal.shareId}/action`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    toast.success(`Action recorded: ${action}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Agency Header (if premium, no GigThink branding) */}
        <div className="mb-8 text-center">
          {agencyProfile?.logo_url && (
            <img src={agencyProfile.logo_url} alt={agencyProfile.agency_name} className="h-16 mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-bold">{proposal.title}</h1>
          <p className="text-gray-600">{agencyProfile?.agency_name}</p>
        </div>

        {/* Proposal Sections */}
        {proposal.sections?.filter((s: any) => s.isVisible).map((section: any) => (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose" dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, "<br/>") }} />
            </CardContent>
          </Card>
        ))}

        {/* Actions */}
        <div className="flex gap-4 justify-center mt-8">
          <Button onClick={() => handleAction("accepted")}><ThumbsUp className="mr-2 h-4 w-4" /> Accept</Button>
          <Button variant="outline" onClick={() => handleAction("rejected")}><ThumbsDown className="mr-2 h-4 w-4" /> Reject</Button>
          <Button variant="secondary" onClick={() => handleAction("changes_requested")}><MessageSquare className="mr-2 h-4 w-4" /> Request Changes</Button>
        </div>

        {/* Footer Branding */}
        {!isPremium && (
          <div className="text-center mt-12 text-gray-400 text-sm">
            Powered by <span className="font-semibold text-gray-500">GigThink</span>
          </div>
        )}
      </div>
    </div>
  );
}