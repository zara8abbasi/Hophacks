import { NextResponse } from "next/server";
import {
  classifyPictureWithGrok,
  getGrokApiKey,
  mockClassifyPicture,
  normalizePictureDataUrl,
  type DescriptionClassification,
} from "@/lib/description-classification";

export type ClassifyPictureResponse = {
  classification: DescriptionClassification;
  source: "live" | "mock";
};

export async function POST(request: Request) {
  let body: { image?: string };
  try {
    body = (await request.json()) as { image?: string };
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Send JSON with an image field (JPEG data URL or base64)." },
      { status: 400 }
    );
  }

  const imageRaw = body.image?.trim() ?? "";
  if (!imageRaw) {
    return NextResponse.json(
      { error: "Image is required." },
      { status: 400 }
    );
  }

  try {
    normalizePictureDataUrl(imageRaw);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid image data.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const apiKey = getGrokApiKey();
  if (!apiKey) {
    const payload: ClassifyPictureResponse = {
      classification: mockClassifyPicture(),
      source: "mock",
    };
    return NextResponse.json(payload);
  }

  try {
    const classification = await classifyPictureWithGrok(imageRaw);
    const payload: ClassifyPictureResponse = {
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
