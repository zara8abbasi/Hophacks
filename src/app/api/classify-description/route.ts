import { NextResponse } from "next/server";
import {
  classifyDescriptionWithGrok,
  getGrokApiKey,
  mockClassifyDescription,
  type DescriptionClassification,
} from "@/lib/description-classification";

export type ClassifyDescriptionResponse = {
  classification: DescriptionClassification;
  source: "live" | "mock";
};

export async function POST(request: Request) {
  let body: { description?: string };
  try {
    body = (await request.json()) as { description?: string };
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Send JSON with a description field." },
      { status: 400 }
    );
  }

  const description = body.description?.trim() ?? "";
  if (!description) {
    return NextResponse.json(
      { error: "Description is required." },
      { status: 400 }
    );
  }

  const apiKey = getGrokApiKey();
  if (!apiKey) {
    const classification = mockClassifyDescription(description);
    const payload: ClassifyDescriptionResponse = {
      classification,
      source: "mock",
    };
    return NextResponse.json(payload);
  }

  try {
    const classification = await classifyDescriptionWithGrok(description);
    const payload: ClassifyDescriptionResponse = {
      classification,
      source: "live",
    };
    return NextResponse.json(payload);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Classification failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
