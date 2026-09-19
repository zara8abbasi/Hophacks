export type ClassificationStatus =
  | "identified"
  | "unsure"
  | "needs_clarification";

export type DescriptionClassification = {
  /** Short name for the identified object (e.g. "Plastic takeout container") */
  objectName: string;
  /** Broad disposal-oriented category (e.g. "Plastic", "Electronics") */
  category: string;
  /** Finer class within the category (e.g. "Rigid plastic #5") */
  class: string;
  /** Model confidence 0–100; values below 50 mean Grok is unsure */
  confidence: number;
  /** When true, disposal rules need more detail before guessing */
  needsClarification: boolean;
  /** Question to ask the user; empty when not needed */
  clarifyingQuestion: string;
  status?: ClassificationStatus;
};

export const CLASSIFICATION_JSON_SCHEMA = {
  name: "disposal_item_classification",
  schema: {
    type: "object",
    properties: {
      objectName: {
        type: "string",
        description:
          "Concise name of the item the user is trying to dispose of",
      },
      category: {
        type: "string",
        description:
          "Broad material or waste category useful for recycling rules",
      },
      class: {
        type: "string",
        description:
          "More specific class or subtype within the category",
      },
      confidence: {
        type: "number",
        description:
          "Integer 0–100: how confident you are in objectName and disposal class given the input",
      },
      needsClarification: {
        type: "boolean",
        description:
          "True when common disposal rules depend on missing facts (empty vs full containers, hazardous residue, material, liquid vs solid). Do not guess—ask instead.",
      },
      clarifyingQuestion: {
        type: "string",
        description:
          "One short question when needsClarification is true (e.g. empty vs full paint can). Empty string when needsClarification is false.",
      },
      status: {
        type: "string",
        enum: ["identified", "unsure", "needs_clarification"],
        description:
          "Optional hint: identified when confident and complete; needs_clarification when needsClarification; unsure when confidence is below 50.",
      },
    },
    required: [
      "objectName",
      "category",
      "class",
      "confidence",
      "needsClarification",
      "clarifyingQuestion",
    ],
    additionalProperties: false,
  },
  strict: true,
} as const;

const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
const DEFAULT_GROK_MODEL = "grok-3-mini";
const DEFAULT_GROK_VISION_MODEL = "grok-4.6";
const MAX_PICTURE_BASE64_CHARS = 7_000_000;

const CLASSIFICATION_SYSTEM_PROMPT =
  "You help Baltimore residents understand what they are trying to dispose of. Identify the physical object and return structured classification fields: objectName (short label), category (broad material or waste stream), class (specific subtype useful for local disposal), confidence (integer 0–100), needsClarification (boolean), clarifyingQuestion (string), and optional status (identified | unsure | needs_clarification). " +
  "Use confidence below 50 when the input is too vague to identify the item responsibly—set status to unsure and still provide your best-guess objectName if any. " +
  "When common disposal rules depend on facts the user did not provide (examples: paint can empty vs still full, battery type, container residue, hazardous liquid vs empty, material type), set needsClarification true, status needs_clarification, and ask one concrete clarifyingQuestion about disposal-relevant attributes—do not guess empty/full or hazardous contents. " +
  "When needsClarification is false, clarifyingQuestion must be an empty string. Use plain English.";

export function getGrokApiKey(): string | undefined {
  const key = process.env.XAI_API_KEY ?? process.env.GROK_API_KEY;
  if (!key?.trim()) return undefined;
  return key.trim();
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function normalizeClassification(
  raw: Omit<DescriptionClassification, "status"> & {
    status?: ClassificationStatus;
  }
): DescriptionClassification {
  const confidence = clampConfidence(raw.confidence);
  const needsClarification = Boolean(raw.needsClarification);
  const clarifyingQuestion = (raw.clarifyingQuestion ?? "").trim();

  let status: ClassificationStatus = raw.status ?? "identified";
  if (needsClarification && clarifyingQuestion) {
    status = "needs_clarification";
  } else if (confidence < 50) {
    status = "unsure";
  } else if (status === "needs_clarification" || status === "unsure") {
    status = "identified";
  }

  return {
    objectName: raw.objectName.trim(),
    category: raw.category.trim(),
    class: raw.class.trim(),
    confidence,
    needsClarification: status === "needs_clarification",
    clarifyingQuestion:
      status === "needs_clarification" ? clarifyingQuestion : "",
    status,
  };
}

export function mergeDescriptionWithClarification(
  original: string,
  answer: string
): string {
  const base = original.trim();
  const detail = answer.trim();
  if (!detail) return base;
  if (!base) return detail;
  return `${base}\n\nAdditional detail from user: ${detail}`;
}

function paintHasDisposalDetail(lower: string): boolean {
  return (
    lower.includes("empty") ||
    lower.includes("full") ||
    lower.includes("dried") ||
    lower.includes(" dry") ||
    lower.includes("dry ") ||
    lower.includes("no paint") ||
    lower.includes("still has") ||
    lower.includes("liquid") ||
    lower.includes("wet paint")
  );
}

export function mockClassifyDescription(
  description: string
): DescriptionClassification {
  const lower = description.toLowerCase();

  if (/\bpaint\b/.test(lower) && !paintHasDisposalDetail(lower)) {
    return normalizeClassification({
      objectName: "Paint can (condition unclear)",
      category: "Hazardous / special collection",
      class: "Metal or plastic paint container — rules depend on empty vs full",
      confidence: 58,
      needsClarification: true,
      clarifyingQuestion:
        "Is the paint can empty or does it still have paint in it?",
    });
  }

  if (
    lower.includes("battery") ||
    lower.includes("lithium") ||
    lower.includes("aa ") ||
    lower.includes("aaa ")
  ) {
    return normalizeClassification({
      objectName: "Household battery",
      category: "Hazardous / special collection",
      class: "Rechargeable or alkaline battery",
      confidence: 88,
      needsClarification: false,
      clarifyingQuestion: "",
    });
  }

  if (
    lower.includes("phone") ||
    lower.includes("laptop") ||
    lower.includes("tablet") ||
    lower.includes("charger") ||
    lower.includes("cable")
  ) {
    return normalizeClassification({
      objectName: "Small electronic device or accessory",
      category: "Electronics",
      class: "E-waste (drop-off or special recycling)",
      confidence: 85,
      needsClarification: false,
      clarifyingQuestion: "",
    });
  }

  if (
    lower.includes("glass") &&
    (lower.includes("bottle") || lower.includes("jar"))
  ) {
    return normalizeClassification({
      objectName: "Glass bottle or jar",
      category: "Glass",
      class: "Container glass (rinse before recycling)",
      confidence: 90,
      needsClarification: false,
      clarifyingQuestion: "",
    });
  }

  if (
    lower.includes("plastic") ||
    lower.includes("#") ||
    lower.includes("takeout") ||
    lower.includes("container")
  ) {
    return normalizeClassification({
      objectName: "Plastic food container",
      category: "Plastic",
      class: "Rigid plastic (check resin number on label)",
      confidence: 82,
      needsClarification: false,
      clarifyingQuestion: "",
    });
  }

  if (lower.includes("paint") || lower.includes("chemical")) {
    return normalizeClassification({
      objectName: "Household chemical or paint",
      category: "Hazardous / special collection",
      class: "Liquid or chemical waste (do not trash or pour)",
      confidence: 86,
      needsClarification: false,
      clarifyingQuestion: "",
    });
  }

  const snippet =
    description.length > 48 ? `${description.slice(0, 48).trim()}…` : description;

  return normalizeClassification({
    objectName: snippet || "Unspecified household item",
    category: "General waste / recycling (mock)",
    class: "Needs live Grok classification for a precise match",
    confidence: 38,
    needsClarification: false,
    clarifyingQuestion: "",
  });
}

function parseClassificationFromGrokContent(
  content: string
): DescriptionClassification {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error("Grok returned classification JSON we could not parse.");
  }

  const objectName =
    typeof parsed.objectName === "string" ? parsed.objectName : "";
  const category = typeof parsed.category === "string" ? parsed.category : "";
  const classField = typeof parsed.class === "string" ? parsed.class : "";

  if (!objectName.trim() || !category.trim() || !classField.trim()) {
    throw new Error("Grok classification was missing required fields.");
  }

  const confidence =
    typeof parsed.confidence === "number" ? parsed.confidence : 50;
  const needsClarification =
    typeof parsed.needsClarification === "boolean"
      ? parsed.needsClarification
      : false;
  const clarifyingQuestion =
    typeof parsed.clarifyingQuestion === "string"
      ? parsed.clarifyingQuestion
      : "";
  const status =
    parsed.status === "identified" ||
    parsed.status === "unsure" ||
    parsed.status === "needs_clarification"
      ? parsed.status
      : undefined;

  return normalizeClassification({
    objectName,
    category,
    class: classField,
    confidence,
    needsClarification,
    clarifyingQuestion,
    status,
  });
}

export async function classifyDescriptionWithGrok(
  description: string
): Promise<DescriptionClassification> {
  const apiKey = getGrokApiKey();
  if (!apiKey) {
    return mockClassifyDescription(description);
  }

  const model = process.env.GROK_MODEL?.trim() || DEFAULT_GROK_MODEL;

  const response = await fetch(XAI_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: CLASSIFICATION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: description,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: CLASSIFICATION_JSON_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Grok API error (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Grok returned an empty classification response.");
  }

  return parseClassificationFromGrokContent(content);
}

/** Normalize client JPEG payload to a data URL for xAI vision messages. */
export function normalizePictureDataUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Image data is required.");
  }
  if (trimmed.startsWith("data:")) {
    if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(trimmed)) {
      throw new Error("Image must be a JPEG, PNG, or WebP data URL.");
    }
    return trimmed;
  }
  if (trimmed.length > MAX_PICTURE_BASE64_CHARS) {
    throw new Error("Image is too large. Capture a smaller photo and try again.");
  }
  return `data:image/jpeg;base64,${trimmed}`;
}

export function mockClassifyPicture(
  supplementalText?: string
): DescriptionClassification {
  const detail = supplementalText?.trim();
  if (detail) {
    return mockClassifyDescription(
      mergeDescriptionWithClarification("Photo of item for disposal", detail)
    );
  }

  return normalizeClassification({
    objectName: "Item in photo (mock)",
    category: "General waste / recycling (mock)",
    class: "Needs live Grok vision for a precise match",
    confidence: 42,
    needsClarification: false,
    clarifyingQuestion: "",
  });
}

export async function classifyPictureWithGrok(
  imageInput: string,
  supplementalText?: string
): Promise<DescriptionClassification> {
  const apiKey = getGrokApiKey();
  const detail = supplementalText?.trim();
  if (!apiKey) {
    return mockClassifyPicture(detail);
  }

  const dataUrl = normalizePictureDataUrl(imageInput);
  if (dataUrl.length > MAX_PICTURE_BASE64_CHARS) {
    throw new Error("Image is too large. Capture a smaller photo and try again.");
  }

  const model =
    process.env.GROK_VISION_MODEL?.trim() || DEFAULT_GROK_VISION_MODEL;

  const userTextParts = [
    "Identify the primary item in this photo that someone would want to throw away or recycle, then classify it.",
  ];
  if (detail) {
    userTextParts.push(
      `The user also provided this clarification about the photo: ${detail}`
    );
  }

  const response = await fetch(XAI_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            CLASSIFICATION_SYSTEM_PROMPT +
            " Use the photo as the primary signal; treat any user clarification text as additional facts about the same item.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
            {
              type: "text",
              text: userTextParts.join("\n\n"),
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: CLASSIFICATION_JSON_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const detailText = await response.text().catch(() => "");
    throw new Error(
      `Grok API error (${response.status})${detailText ? `: ${detailText.slice(0, 200)}` : ""}`
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Grok returned an empty classification response.");
  }

  return parseClassificationFromGrokContent(content);
}
