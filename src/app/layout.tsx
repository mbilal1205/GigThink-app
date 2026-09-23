import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "../lib/utils";
import { Toaster } from "sonner";
import Providers from "@/components/Providers";
import { ClientLayout } from "@/components/layout/ClientLayout";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const fontHeading = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "GigThink AI | The All-in-One Freelance Client Hunter",
    template: "%s | GigThink AI",
  },
  description: "GigThink AI helps freelancers find high-quality local business leads, generate elite proposals, and manage outreach. Build your agency empire today.",
  keywords: ["Freelance AI", "Client Hunting", "Proposal Generator", "Local Business Leads", "GigThink", "SaaS for Freelancers"],
  authors: [{ name: "CodEarn Tech" }],
  creator: "CodEarn Tech",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#596cf5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning={true}
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          fontSans.variable,
          fontHeading.variable
        )}
      >
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>

        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
      </body>
    </html>
  );
}