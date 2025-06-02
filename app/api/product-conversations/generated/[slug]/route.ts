import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { GeneratedConversations } from "@/db/schema";
import { eq } from "drizzle-orm";

// This endpoint retrieves the generated conversation data based on the slug
// It's used to populate the customize form with the AI-generated data
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    // Fetch the generated conversation data from the database
    const generatedData = await db
      .select()
      .from(GeneratedConversations)
      .where(eq(GeneratedConversations.slug, slug))
      .limit(1)
      .then((rows) => rows[0]);
    
    if (!generatedData) {
      return NextResponse.json({ error: "Generated conversation not found" }, { status: 404 });
    }
    
    return NextResponse.json(generatedData);
  } catch (error) {
    console.error("Error fetching generated conversation:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
