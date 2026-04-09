import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { transcribeAudio } from "@/lib/whisper";
import { classifyRecording } from "@/lib/classify";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WEBHOOK_SECRET) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message || message.type !== "audio") {
      return NextResponse.json({ status: "ignored" });
    }

    const from = message.from;
    const audioId = message.audio.id;

    // Look up parent in parents table, join family for notification prefs
    const { data: parent } = await supabaseAdmin
      .from("parents")
      .select("*, families(*)")
      .eq("whatsapp", from)
      .single();

    if (!parent) {
      console.log("Unknown number:", from);
      return NextResponse.json({ status: "unknown_parent" });
    }

    const family = parent.families as any;

    const audioBuffer = await downloadMetaAudio(audioId);
    if (!audioBuffer) {
      return NextResponse.json({ status: "audio_download_failed" });
    }

    const filename = `${family.id}/${Date.now()}.ogg`;
    await supabaseAdmin.storage
      .from("recordings")
      .upload(filename, audioBuffer, { contentType: "audio/ogg" });

    const { data: urlData } = supabaseAdmin.storage
      .from("recordings")
      .getPublicUrl(filename);

    const { text: transcript, language } = await transcribeAudio(
      audioBuffer,
      filename,
    );

    const classification = await classifyRecording(transcript, language);

    await supabaseAdmin.from("recordings").insert({
      family_id: family.id,
      parent_id: parent.id,
      audio_url: urlData.publicUrl,
      language_detected: language,
      transcript_original: transcript,
      english_summary: classification.english_summary,
      primary_type: classification.primary_type,
      story_tags: classification.story_tags,
      legacy_tags: classification.legacy_tags,
      extracted_entities: classification.extracted_entities,
      classification_confidence: classification.confidence,
      needs_review: classification.needs_review,
    });

    // Update last_active on the parent row
    await supabaseAdmin
      .from("parents")
      .update({ last_active: new Date().toISOString() })
      .eq("id", parent.id);

    // Confirmation back to parent
    await sendWhatsAppMessage(
      from,
      getConfirmationMessage(parent.name, classification.primary_type),
    );

    if (classification.followup_prompt) {
      await sendWhatsAppMessage(from, classification.followup_prompt);
    }

    // Notify adult child
    await notifyAdultChild(parent.name, family, classification.primary_type);

    return NextResponse.json({ status: "success" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

async function notifyAdultChild(
  parentName: string,
  family: any,
  recordingType: string
) {
  const parentFirstName = parentName.split(" ")[0];
  const adultFirstName = family.adult_child_name.split(" ")[0];

  if (family.notify_whatsapp && family.adult_child_whatsapp) {
    try {
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
            to: family.adult_child_whatsapp,
            type: "template",
            template: {
              name: "rooh_notify_child",
              language: { code: "en" },
              components: [{
                type: "body",
                parameters: [
                  { type: "text", text: adultFirstName },
                  { type: "text", text: parentFirstName },
                ],
              }],
            },
          }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        console.error("WhatsApp notify failed:", err);
      }
    } catch (err) {
      console.error("WhatsApp notify error:", err);
    }
  }

  if (family.notify_email && family.adult_child_email) {
    try {
      await resend.emails.send({
        from: "Rooh <hello@rooh.family>",
        to: family.adult_child_email,
        subject: `${parentFirstName} just recorded a memory for you 🙏`,
        html: getEmailHtml(adultFirstName, parentFirstName),
      });
    } catch (err) {
      console.error("Email notify error:", err);
    }
  }
}

function getEmailHtml(adultName: string, parentName: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background: #FDF8F3; font-family: Georgia, serif;">
  <div style="max-width: 480px; margin: 40px auto; padding: 0 24px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <p style="font-size: 28px; color: #1C1917; margin: 0; letter-spacing: 1px;">Rooh</p>
    </div>
    <div style="background: white; border: 0.5px solid #E8E0D5; border-radius: 16px; padding: 32px; text-align: center;">
      <div style="font-size: 32px; margin-bottom: 16px;">🙏</div>
      <h1 style="font-size: 22px; font-weight: 400; color: #1C1917; margin: 0 0 12px;">
        ${parentName} recorded a memory
      </h1>
      <p style="font-size: 15px; color: #57534E; line-height: 1.7; margin: 0 0 28px;">
        Hi ${adultName}, ${parentName} just shared something with you on Rooh.
        Open your archive to listen to it.
      </p>
      <a href="https://rooh.family/dashboard"
        style="display: inline-block; padding: 14px 32px; background: #1C1917; color: #FDF8F3; text-decoration: none; border-radius: 10px; font-size: 15px; font-family: sans-serif;">
        Open your archive
      </a>
    </div>
    <p style="text-align: center; font-size: 12px; color: #A8A29E; margin-top: 24px; font-family: sans-serif;">
      You're receiving this because you set up notifications in Rooh.
      <a href="https://rooh.family/dashboard" style="color: #A8A29E;">Manage settings</a>
    </p>
  </div>
</body>
</html>
  `;
}

async function downloadMetaAudio(audioId: string): Promise<Buffer | null> {
  const token = process.env.WHATSAPP_API_KEY;
  if (!token) {
    console.error("No WHATSAPP_API_KEY set");
    return null;
  }

  try {
    const metaRes = await fetch(`https://graph.facebook.com/v18.0/${audioId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meta = await metaRes.json();
    console.log("Meta audio response:", JSON.stringify(meta));

    if (!meta.url) {
      console.error("No URL in Meta response:", meta);
      return null;
    }

    const audioRes = await fetch(meta.url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!audioRes.ok) {
      console.error("Audio download failed:", audioRes.status, audioRes.statusText);
      return null;
    }

    const arrayBuffer = await audioRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("Audio download error:", err);
    return null;
  }
}

function getConfirmationMessage(parentName: string, type: string): string {
  const name = parentName.split(" ")[0];
  const messages: Record<string, string> = {
    story: "Thank you " + name + " 🙏 Your memory has been saved safely. Your family will treasure this.",
    practical: "Thank you " + name + ". That important information has been saved for your family.",
    legacy: "Thank you " + name + " 🙏 Your message has been saved with care, in your exact words.",
    mixed: "Thank you " + name + " 🙏 Your recording has been saved safely for your family.",
    untagged: "Thank you " + name + ". Your recording has been saved.",
  };
  return messages[type] || messages.untagged;
}