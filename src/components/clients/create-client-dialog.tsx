"use client";

import { useState, FormEvent } from "react";
import { Plus, Loader2, User, Building, Mail, Phone, FolderKanban, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface CreateClientDialogProps {
  onClientCreated?: () => void;
}

interface ClientFormData {
  client_name: string;
  company_name: string;
  email: string;
  phone: string;
  project_title: string;
  project_summary: string;
  budget: string | number;
  currency: string;
  deadline: string;
  status: string;
}

const initialFormState: ClientFormData = {
  client_name: "",
  company_name: "",
  email: "",
  phone: "",
  project_title: "",
  project_summary: "",
  budget: "",
  currency: "USD",
  deadline: "",
  status: "lead",
};

export function CreateClientDialog({ onClientCreated }: CreateClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: keyof ClientFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.client_name.trim()) errs.client_name = "Client name is required";
    if (!formData.project_title.trim()) errs.project_title = "Project title is required";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Invalid email address";
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        budget: formData.budget ? Number(formData.budget) : 0,
      };

      const res = await fetch("/api/Clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create client");

      toast.success("Client added successfully!");
      setFormData(initialFormState);
      setOpen(false);
      
      if (onClientCreated) onClientCreated();

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error("Error creating client", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-semibold shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add New Client
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Create Client Profile
          </DialogTitle>
          <DialogDescription>
            Save client details and project scope to generate AI proposals instantly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          {/* Client & Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Client Name *
              </label>
              <Input
                placeholder="e.g. Ali Ahmed"
                value={formData.client_name}
                onChange={(e) => handleChange("client_name", e.target.value)}
              />
              {errors.client_name && <p className="text-xs text-destructive">{errors.client_name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Building className="h-3.5 w-3.5" /> Company / Business
              </label>
              <Input
                placeholder="e.g. TechCorp Solutions"
                value={formData.company_name}
                onChange={(e) => handleChange("company_name", e.target.value)}
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </label>
              <Input
                type="email"
                placeholder="ali@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> Phone / WhatsApp
              </label>
              <Input
                placeholder="+92 300 1234567"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
          </div>

          {/* Project Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <FolderKanban className="h-3.5 w-3.5" /> Project Title *
            </label>
            <Input
              placeholder="e.g. SaaS Website & Admin Dashboard"
              value={formData.project_title}
              onChange={(e) => handleChange("project_title", e.target.value)}
            />
            {errors.project_title && <p className="text-xs text-destructive">{errors.project_title}</p>}
          </div>

          {/* Project Summary */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Initial Scope / Conversation Notes</label>
            <Textarea
              rows={3}
              placeholder="Paste raw conversation notes or outline core requirements..."
              value={formData.project_summary}
              onChange={(e) => handleChange("project_summary", e.target.value)}
            />
          </div>

          {/* Financials & Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" /> Budget
              </label>
              <Input
                type="number"
                placeholder="1500"
                value={formData.budget}
                onChange={(e) => handleChange("budget", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Currency</label>
              <Select value={formData.currency} onValueChange={(val) => handleChange("currency", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="PKR">PKR (Rs)</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Target Deadline
              </label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => handleChange("deadline", e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Client
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}