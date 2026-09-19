import type { DescriptionClassification } from "@/lib/description-classification";

const STORAGE_KEY = "hophacks-disposal-result";
const MAX_PHOTO_CHARS = 400_000;

export type DisposalResultOrigin = "/type" | "/picture" | "/speech";

export type DisposalResultSession = {
  classification: DescriptionClassification;
  source: "live" | "mock";
  origin: DisposalResultOrigin;
  inputSummary?: string;
  photoPreviewUrl?: string;
  /** User confirmed Grok identification on /identify */
  identificationConfirmed?: boolean;
  savedAt: number;
};

export function saveDisposalResultSession(
  payload: Omit<DisposalResultSession, "savedAt">
): void {
  if (typeof window === "undefined") return;
  const photoPreviewUrl =
    payload.photoPreviewUrl &&
    payload.photoPreviewUrl.length <= MAX_PHOTO_CHARS
      ? payload.photoPreviewUrl
      : undefined;
  const session: DisposalResultSession = {
    ...payload,
    photoPreviewUrl,
    savedAt: Date.now(),
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    const withoutPhoto = { ...session, photoPreviewUrl: undefined };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(withoutPhoto));
  }
}

export function loadDisposalResultSession(): DisposalResultSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DisposalResultSession;
    if (
      !parsed?.classification?.objectName ||
      !parsed.classification.category ||
      !parsed.classification.class
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDisposalResultSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function markDisposalIdentificationConfirmed(): void {
  const session = loadDisposalResultSession();
  if (!session) return;
  saveDisposalResultSession({
    classification: session.classification,
    source: session.source,
    origin: session.origin,
    inputSummary: session.inputSummary,
    photoPreviewUrl: session.photoPreviewUrl,
    identificationConfirmed: true,
  });
}
