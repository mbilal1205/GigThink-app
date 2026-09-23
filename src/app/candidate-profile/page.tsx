"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CandidateProfileForm } from "@/components/profile/CandidateProfileForm";
import { Loader2 } from "lucide-react";

export default function CandidateProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/candidate-profile");
        const data = await res.json();
        if (res.ok && data.profile) {
          setExistingProfile(data.profile);
        }
      } catch (err) {
        console.error("[PROFILE_FETCH]", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold heading-gradient mb-2">ðŸ‘¤ Candidate Profile</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Complete your profile to get personalized job matches and automated applications.
      </p>
      <CandidateProfileForm initialData={existingProfile || undefined} />
    </div>
  );
}