// import { NextRequest, NextResponse } from "next/server";
// import { createSupabaseServerClient } from "@/utils/supabase/server";
// import { connectToDatabase } from "@/lib/db/mongodb";
// import Project from "@/lib/models/Project";

// // GET - Fetch all projects
// export async function GET(req: NextRequest) {
//   try {
//     const supabase = await createSupabaseServerClient();
//     const {
//       data: { user },
//       error: authError,
//     } = await supabase.auth.getUser();

//     if (authError || !user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     await connectToDatabase();

//     const { searchParams } = new URL(req.url);
//     const status = searchParams.get("status");
//     const clientId = searchParams.get("clientId");

//     // Build query
//     const query: any = { userId: user.id };

//     if (status && status !== "all") {
//       query.status = status;
//     }

//     if (clientId) {
//       query.clientId = clientId;
//     }

//     const projects = await Project.find(query)
//       .sort({ createdAt: -1 })
//       .select("_id title clientName clientId status budget description createdAt updatedAt")
//       .lean();

//     // Serialize for JSON
//     const serializedProjects = projects.map((p: any) => ({
//       _id: p._id.toString(),
//       title: p.title || "Untitled Project",
//       clientName: p.clientName || "Unknown Client",
//       clientId: p.clientId || "",
//       status: p.status || "Draft",
//       budget: p.budget || 0,
//       description: p.description || "",
//       createdAt: p.createdAt || new Date(),
//       updatedAt: p.updatedAt || new Date(),
//     }));

//     return NextResponse.json({
//       success: true,
//       projects: serializedProjects,
//       total: serializedProjects.length,
//     });
//   } catch (error: any) {
//     console.error("[GET_PROJECTS_ERROR]:", error);
//     return NextResponse.json(
//       { error: error.message || "Failed to fetch projects" },
//       { status: 500 }
//     );
//   }
// }

// // POST - Create new project
// export async function POST(req: NextRequest) {
//   try {
//     const supabase = await createSupabaseServerClient();
//     const {
//       data: { user },
//       error: authError,
//     } = await supabase.auth.getUser();

//     if (authError || !user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     await connectToDatabase();

//     const body = await req.json();
//     const { title, clientName, clientId, budget, description, status } = body;

//     if (!title || !clientName) {
//       return NextResponse.json(
//         { error: "Title and client name are required" },
//         { status: 400 }
//       );
//     }

//     const project = await Project.create({
//       userId: user.id,
//       title,
//       clientName,
//       clientId: clientId || "",
//       budget: budget || 0,
//       description: description || "",
//       status: status || "Draft",
//     });

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Project created successfully!",
//         project: {
//           _id: project._id.toString(),
//           title: project.title,
//           clientName: project.clientName,
//           status: project.status,
//         },
//       },
//       { status: 201 }
//     );
//   } catch (error: any) {
//     console.error("[CREATE_PROJECT_ERROR]:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }



// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Project from "@/lib/models/Project";

export async function GET(req: NextRequest) {
  try {
    // --- Auth ---
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Fetch Projects ---
    await connectToDatabase();
    const projects = await Project.find({ userId: user.id })
      .sort({ createdAt: -1 }) // Latest first
      .select("_id title clientName status createdAt")
      .lean();

    // Convert _id to string for JSON
    const formattedProjects = projects.map((p: any) => ({
      _id: p._id.toString(),
      title: p.title || "Untitled",
      clientName: p.clientName || "Unknown Client",
      status: p.status || "Draft",
      createdAt: p.createdAt,
    }));

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
    });
  } catch (error: any) {
    console.error("[API_PROJECTS_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}