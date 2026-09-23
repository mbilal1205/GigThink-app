import { Mail, Palette, Link2, Calendar, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AppConnector {
  provider: string;
  name: string;
  description: string;
  icon: LucideIcon;
  connectUrl?: string; // agar direct redirect URL ho
}

export const APP_CONNECTORS: AppConnector[] = [
  {
    provider: "google_gmail",
    name: "Gmail",
    description: "Send emails from your Gmail address",
    icon: Mail,
  },
  {
    provider: "canva",
    name: "Canva",
    description: "Edit and export your resumes & cover letters",
    icon: Palette,
    connectUrl: "/api/connections/canva/connect", // direct connect endpoint
  },
  // Future connectors yahan add karo, automatically show honge
  // {
  //   provider: "google_calendar",
  //   name: "Google Calendar",
  //   description: "Schedule interviews and follow-ups",
  //   icon: Calendar,
  // },
  // {
  //   provider: "slack",
  //   name: "Slack",
  //   description: "Get notifications in Slack",
  //   icon: MessageSquare,
  // },
];