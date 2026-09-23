"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// 1. Zod Schema (Same as Backend for consistency)
const formSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  source: z.enum(['WhatsApp', 'Email', 'Meeting', 'Manual']),
  rawText: z.string().min(10, "Conversation is too short. Paste a bit more context."),
});

export default function NewClientForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Initialize React Hook Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      source: "WhatsApp",
      rawText: "",
    },
  });

  // 3. Submit Handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/projects/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process the conversation.");
      }

      toast.success("Project Initiated!", {
        description: "AI is analyzing the conversation...",
      });

      // Redirect to the processing/proposal screen using the returned ID
      router.push(`/projects/${data.projectId}/analyze?convId=${data.conversationId}`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Error", { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">New Project</CardTitle>
        <CardDescription>
          Paste the raw conversation from your client, and our AI Solution Architect will handle the rest.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Title Field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. SaaS Dashboard for Hospital" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Source Field */}
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conversation Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="WhatsApp">WhatsApp Chat</SelectItem>
                        <SelectItem value="Email">Email Thread</SelectItem>
                        <SelectItem value="Meeting">Meeting Notes</SelectItem>
                        <SelectItem value="Manual">Manual Entry</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Raw Text Field */}
            <FormField
              control={form.control}
              name="rawText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raw Conversation</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Paste your client's messages here..." 
                      className="min-h-[200px] resize-y"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Don't worry about formatting, timestamps, or typos. The AI will clean it up automatically.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button with Loading State */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Conversation...
                </>
              ) : (
                "Generate Solution Architecture"
              )}
            </Button>
            
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}