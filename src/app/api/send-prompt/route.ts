import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {

    // Create user client from request
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") || "",
          },
        },
      },
    );

    const { prompt, userEmail } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ success: false, error: "No email" });
    }

    // Get family
    const { data: family } = await supabaseAdmin
      .from("families")
      .select("*")
      .eq("adult_child_email", userEmail)
      .single();

    if (!family) {
      return NextResponse.json({ success: false, error: "No family" });
    }

    // ✅ Send WhatsApp message
    await sendWhatsAppMessage(
      family.parent_whatsapp,
      `Hi ${family.parent_name.split(" ")[0]} 😊\n\n${prompt}`,
    );

    // ✅ Log to prompt_log
    await supabaseAdmin.from("prompt_log").insert({
      family_id: family.id,
      prompt_text: prompt,
      prompt_category: "manual", // you can improve this later
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SEND PROMPT ERROR:", err);
    return NextResponse.json({ success: false });
  }
}
