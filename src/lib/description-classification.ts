export type DescriptionClassification = {
  /** Short name for the identified object (e.g. "Plastic takeout container") */
  objectName: string;
  /** Broad disposal-oriented category (e.g. "Plastic", "Electronics") */
  category: string;
  /** Finer class within the category (e.g. "Rigid plastic #5") */
  class: string;
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
    },
    required: ["objectName", "category", "class"],
    additionalProperties: false,
  },
  strict: true,
} as const;

const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
const DEFAULT_GROK_MODEL = "grok-3-mini";
const DEFAULT_GROK_VISION_MODEL = "grok-4.6";
const MAX_PICTURE_BASE64_CHARS = 7_000_000;

export function getGrokApiKey(): string | undefined {
  const key = process.env.XAI_API_KEY ?? process.env.GROK_API_KEY;
  if (!key?.trim()) return undefined;
  return key.trim();
}

export function mockClassifyDescription(
  description: string
): DescriptionClassification {
  const lower = description.toLowerCase();

  if (
    lower.includes("battery") ||
    lower.includes("lithium") ||
    lower.includes("aa ") ||
    lower.includes("aaa ")
  ) {
    return {
      objectName: "Household battery",
      category: "Hazardous / special collection",
      class: "Rechargeable or alkaline battery",
    };
  }

  if (
    lower.includes("phone") ||
    lower.includes("laptop") ||
    lower.includes("tablet") ||
    lower.includes("charger") ||
    lower.includes("cable")
  ) {
    return {
      objectName: "Small electronic device or accessory",
      category: "Electronics",
      class: "E-waste (drop-off or special recycling)",
    };
  }

  if (
    lower.includes("glass") &&
    (lower.includes("bottle") || lower.includes("jar"))
  ) {
    return {
      objectName: "Glass bottle or jar",
      category: "Glass",
      class: "Container glass (rinse before recycling)",
    };
  }

  if (
    lower.includes("plastic") ||
    lower.includes("#") ||
    lower.includes("takeout") ||
    lower.includes("container")
  ) {
    return {
      objectName: "Plastic food container",
      category: "Plastic",
      class: "Rigid plastic (check resin number on label)",
    };
  }

  if (lower.includes("paint") || lower.includes("chemical")) {
    return {
      objectName: "Household chemical or paint",
      category: "Hazardous / special collection",
      class: "Liquid or chemical waste (do not trash or pour)",
    };
  }

  const snippet =
    description.length > 48 ? `${description.slice(0, 48).trim()}…` : description;

  return {
    objectName: snippet || "Unspecified household item",
    category: "General waste / recycling (mock)",
    class: "Needs live Grok classification for a precise match",
  };
}

function parseClassificationFromGrokContent(
  content: string
): DescriptionClassification {
  let parsed: DescriptionClassification;
  try {
    parsed = JSON.parse(content) as DescriptionClassification;
  } catch {
    throw new Error("Grok returned classification JSON we could not parse.");
  }

  if (
    !parsed.objectName?.trim() ||
    !parsed.category?.trim() ||
    !parsed.class?.trim()
  ) {
    throw new Error("Grok classification was missing required fields.");
  }

  return {
    objectName: parsed.objectName.trim(),
    category: parsed.category.trim(),
    class: parsed.class.trim(),
  };
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
          content:
            "You help Baltimore residents understand what they are trying to dispose of. From the user's description, identify the physical object and return a structured classification with objectName (short label), category (broad material or waste stream), and class (more specific subtype). Use plain English. If the description is vague, make your best reasonable guess and reflect uncertainty in the class field.",
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

export function mockClassifyPicture(): DescriptionClassification {
  return {
    objectName: "Item in photo (mock)",
    category: "General waste / recycling (mock)",
    class: "Needs live Grok vision for a precise match",
  };
}

export async function classifyPictureWithGrok(
  imageInput: string
): Promise<DescriptionClassification> {
  const apiKey = getGrokApiKey();
  if (!apiKey) {
    return mockClassifyPicture();
  }

  const dataUrl = normalizePictureDataUrl(imageInput);
  if (dataUrl.length > MAX_PICTURE_BASE64_CHARS) {
    throw new Error("Image is too large. Capture a smaller photo and try again.");
  }

  const model =
    process.env.GROK_VISION_MODEL?.trim() || DEFAULT_GROK_VISION_MODEL;

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
            "You help Baltimore residents understand what they are trying to dispose of. From the photo, identify the main disposable object in frame and return a structured classification with objectName (short label), category (broad material or waste stream), and class (more specific subtype). Use plain English. If the image is unclear, make your best reasonable guess and reflect uncertainty in the class field.",
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
              text: "Identify the primary item in this photo that someone would want to throw away or recycle, then classify it.",
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
