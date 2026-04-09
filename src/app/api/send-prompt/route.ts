import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { prompt, userEmail } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ success: false, error: "No email" });
    }

    const { data: family } = await supabaseAdmin
      .from("families")
      .select("id")
      .eq("adult_child_email", userEmail)
      .single();

    if (!family) {
      return NextResponse.json({ success: false, error: "No family" });
    }

    // Fetch all parents for this family
    const { data: parents } = await supabaseAdmin
      .from("parents")
      .select("*")
      .eq("family_id", family.id)
      .order("created_at", { ascending: true })

    if (!parents || parents.length === 0) {
      return NextResponse.json({ success: false, error: "No parents found" });
    }

    // Send prompt to all connected parents
    for (const parent of parents) {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: parent.whatsapp,
            type: "template",
            template: {
              name: "rooh_prompt",
              language: { code: "en" },
              components: [{
                type: "body",
                parameters: [
                  { type: "text", text: parent.name.split(" ")[0] },
                  { type: "text", text: prompt },
                ],
              }],
            },
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        console.error(`WhatsApp send failed for ${parent.name}:`, data);
      }
    }

    await supabaseAdmin.from("prompt_log").insert({
      family_id: family.id,
      prompt_text: prompt,
      prompt_category: "manual",
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("SEND PROMPT ERROR:", err);
    return NextResponse.json({ success: false });
  }
}