import Anthropic from "@anthropic-ai/sdk";
import { ClassificationResult } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function classifyRecording(
  transcript: string,
  language: string,
): Promise<ClassificationResult> {
  const prompt = `You are processing a voice recording for Rooh — a family memory archive app.
An elderly parent sent this voice note to preserve their stories and information for their adult child.

Transcript (language: ${language}):
"${transcript}"

Analyse this transcript and return a JSON object with exactly these fields:

{
  "primary_type": one of "story" | "practical" | "legacy" | "mixed" | "untagged",
  "story_tags": array of relevant tags from ["childhood", "marriage", "career", "faith", "festivals", "values", "family", "travel"],
  "legacy_tags": array from ["farewell", "ceremony", "possession", "letter", "grandchildren", "wishes"],
  "extracted_entities": {
    "insurance": [{ "provider": "", "number": "", "type": "" }],
    "bank": [{ "name": "", "branch": "", "details": "" }],
    "medical": [{ "name": "", "role": "", "contact": "", "hospital": "" }],
    "medicines": [{ "name": "", "frequency": "", "dosage": "", "condition": "" }],
    "symptoms": [{ "description": "", "duration": "", "severity": "" }],
    "appointments": [{ "doctor": "", "date": "", "reason": "" }],
    "property": [{ "description": "", "location": "" }],
    "contacts": [{ "name": "", "relation": "", "number": "" }]
  },
  "english_summary": "2-3 sentence plain English summary of what was shared. Warm and personal in tone.",
  "confidence": number between 0 and 1,
  "needs_review": true if confidence below 0.65 or audio seems unclear,
  "followup_prompt": "A gentle WhatsApp follow-up question if practical info was mentioned but seems incomplete. Empty string if not needed."
}

Rules:
- primary_type is "mixed" if the recording contains both personal stories AND practical information
- primary_type is "legacy" if the parent is leaving a message or expressing wishes
- primary_type is "untagged" only if the content is completely unclear
- For legacy recordings, keep english_summary very brief — just note it is a personal message
- Only populate extracted_entities fields that are actually mentioned — leave others as empty arrays
- Return ONLY valid JSON, no extra text`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean) as ClassificationResult;
  } catch {
    // Fallback if parsing fails
    return {
      primary_type: "untagged",
      story_tags: [],
      legacy_tags: [],
      extracted_entities: {},
      english_summary:
        "Recording saved. Could not be automatically classified.",
      confidence: 0,
      needs_review: true,
    };
  }
}
