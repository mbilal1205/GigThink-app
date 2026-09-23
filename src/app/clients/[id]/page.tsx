"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Building2, Mail, Phone, Calendar, FolderKanban } from "lucide-react";
import { GenerateProposalModal } from "@/components/proposals/GenerateProposalModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ClientDetailsPage() {
  const params = useParams();
  const clientId = params.id as string;

  // Assume client data fetched from Supabase
  const [client, setClient] = useState<{ id: string; name: string; email: string; budget?: number } | null>({
    id: clientId,
    name: "Health Care Systems",
    email: "contact@healthcare.org",
    budget: 4500,
  });

  if (!client) return <div>Loading client details...</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Top Bar with Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight">{client.name}</h1>
            <Badge variant="secondary">Active Client</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-4">
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {client.email}</span>
          </p>
        </div>

        {/* Generate Proposal Modal Button */}
        <GenerateProposalModal 
          clientId={client.id} 
          clientName={client.name} 
          defaultBudget={client.budget} 
        />
      </div>

      {/* Client Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Target Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${client.budget?.toLocaleString() || "N/A"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}