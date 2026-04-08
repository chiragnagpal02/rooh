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
      .select("*")
      .eq("adult_child_email", userEmail)
      .single();

    if (!family) {
      return NextResponse.json({ success: false, error: "No family" });
    }

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
          to: family.parent_whatsapp,
          type: "template",
          template: {
            name: "rooh_prompt",
            language: { code: "en" },
            components: [{
              type: "body",
              parameters: [
                { type: "text", text: family.parent_name.split(" ")[0] },
                { type: "text", text: prompt },
              ],
            }],
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp send failed:", data);
      return NextResponse.json({ success: false, error: "WhatsApp send failed" });
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