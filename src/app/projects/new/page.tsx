import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Project from "@/lib/models/Project";

export default async function NewProjectPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await connectToDatabase();

  // Create new project with valid status
  const newProject = new Project({
    title: "New Project",
    userId: user.id,
    clientName: "New Client", // Required field
    status: "Draft", // âš¡ Capital D - must match enum
    budget: 0,
    description: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await newProject.save();

  // Redirect to the new project's detail page
  redirect(`/projects/${newProject._id.toString()}`);
}