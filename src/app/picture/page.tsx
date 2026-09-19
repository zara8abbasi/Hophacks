"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HopHacksShell } from "@/components/hophacks-shell";
import { Button } from "@/components/ui/button";
import { ClassificationOutcomeActions } from "@/components/classification-outcome-actions";
import { DescriptionClassificationPanel } from "@/components/description-classification-panel";
import { classifyPictureFromDataUrl } from "@/lib/classify-picture-client";
import {
  mergeDescriptionWithClarification,
  type DescriptionClassification,
} from "@/lib/description-classification";

type CameraState = "idle" | "loading" | "active" | "error" | "captured";
type ClassifyStatus = "idle" | "loading" | "success" | "api_error";

const PICTURE_CONTEXT_SEED = "Photo of item for disposal";

function cameraErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "Camera permission was denied. Allow camera access in your browser settings, then try again—or use Type A Description instead.";
      case "NotFoundError":
      case "DevicesNotFoundError":
        return "No camera was found on this device. Connect a camera or use Type A Description instead.";
      case "NotReadableError":
      case "TrackStartError":
        return "Your camera is in use by another app. Close it and try again.";
      case "OverconstrainedError":
        return "This device couldn’t use the requested camera settings. Try again or use Type A Description.";
      case "SecurityError":
        return "Camera access isn’t available on this page. Use localhost or HTTPS, or try Type A Description.";
      default:
        break;
    }
  }
  if (err instanceof Error && err.message.includes("not supported")) {
    return err.message;
  }
  return "We couldn’t open your camera. Check permissions or use Type A Description instead.";
}

async function requestCameraStream(): Promise<MediaStream> {
  const attempts: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: "environment" } }, audio: false },
    { video: { facingMode: "user" }, audio: false },
    { video: true, audio: false },
  ];
  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        throw err;
      }
    }
  }
  throw lastError ?? new Error("Could not open camera.");
}

export default function PicturePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [classifyStatus, setClassifyStatus] = useState<ClassifyStatus>("idle");
  const [classification, setClassification] =
    useState<DescriptionClassification | null>(null);
  const [source, setSource] = useState<"live" | "mock" | null>(null);
  const [classifyErrorMessage, setClassifyErrorMessage] = useState<
    string | null
  >(null);
  const [videoReady, setVideoReady] = useState(false);
  const [pictureContext, setPictureContext] = useState("");
  const classifyRequestIdRef = useRef(0);
  const attemptedClassifyUrlRef = useRef<string | null>(null);

  const resetClassification = useCallback(() => {
    setClassifyStatus("idle");
    setClassification(null);
    setSource(null);
    setClassifyErrorMessage(null);
    setPictureContext("");
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const attachStreamToVideo = useCallback(async (video: HTMLVideoElement, stream: MediaStream) => {
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      // Autoplay policies rarely block muted inline video; ignore transient failures.
    }
  }, []);

  const classifyCapturedImage = useCallback(
    async (
      dataUrl: string,
      options?: { supplementalText?: string; keepPrevious?: boolean }
    ) => {
      const requestId = ++classifyRequestIdRef.current;
      setClassifyStatus("loading");
      if (!options?.keepPrevious) {
        setClassification(null);
        setSource(null);
      }
      setClassifyErrorMessage(null);

      const result = await classifyPictureFromDataUrl(
        dataUrl,
        options?.supplementalText
      );

      if (requestId !== classifyRequestIdRef.current) return;

      if (!result.ok) {
        setClassifyStatus("api_error");
        setClassifyErrorMessage(result.errorMessage);
        return;
      }

      setClassification(result.classification);
      setSource(result.source);
      setClassifyStatus("success");
    },
    []
  );

  const startCamera = useCallback(async () => {
    setErrorMessage(null);
    setPreviewUrl(null);
    setVideoReady(false);
    attemptedClassifyUrlRef.current = null;
    resetClassification();
    setCameraState("loading");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported in this browser.");
      }
      const stream = await requestCameraStream();
      streamRef.current = stream;
      setCameraState("active");
    } catch (err) {
      setCameraState("error");
      setErrorMessage(cameraErrorMessage(err));
      stopStream();
    }
  }, [resetClassification, stopStream]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || cameraState !== "active") return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (width < 8 || height < 8) {
      setErrorMessage(
        "Camera is still warming up. Wait until the live preview looks clear, then tap Capture photo again."
      );
      return;
    }

    setErrorMessage(null);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopStream();
    setPreviewUrl(dataUrl);
    setPictureContext("");
    setCameraState("captured");
  }, [cameraState, stopStream]);

  useEffect(() => {
    if (!previewUrl || cameraState !== "captured") return;
    if (attemptedClassifyUrlRef.current === previewUrl) return;
    attemptedClassifyUrlRef.current = previewUrl;
    void classifyCapturedImage(previewUrl);
  }, [previewUrl, cameraState, classifyCapturedImage]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (cameraState === "active" && video && stream) {
      setVideoReady(false);
      const onReady = () => {
        if (video.videoWidth >= 8 && video.videoHeight >= 8) {
          setVideoReady(true);
        }
      };
      video.addEventListener("loadedmetadata", onReady);
      video.addEventListener("resize", onReady);
      void attachStreamToVideo(video, stream).then(onReady);
      return () => {
        video.removeEventListener("loadedmetadata", onReady);
        video.removeEventListener("resize", onReady);
      };
    }
    setVideoReady(false);
    return undefined;
  }, [cameraState, attachStreamToVideo]);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const handleRetake = useCallback(() => {
    setPreviewUrl(null);
    attemptedClassifyUrlRef.current = null;
    void startCamera();
  }, [startCamera]);

  const showOutcomePanel =
    (classifyStatus === "success" || classifyStatus === "loading") &&
    classification &&
    source;

  return (
    <HopHacksShell showBack>
      <div className="rounded-2xl border border-white/20 bg-white/95 p-6 text-black shadow-lg sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Take A Picture</h1>
        <p className="mt-2 text-sm text-black/70 sm:text-base">
          Position the item in frame and tap <strong>Capture photo</strong>.
          The live preview stays on your device; only the captured JPEG is sent
          to Grok vision on our server to identify the object and classify it for
          Baltimore disposal rules.
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-black/5">
          {previewUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Captured preview of your item"
                className="aspect-[4/3] w-full object-cover"
              />
              {classifyStatus === "loading" && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/45 px-4 text-center text-sm font-medium text-white"
                  aria-live="polite"
                >
                  Identifying with Grok…
                </div>
              )}
            </div>
          ) : cameraState === "loading" ? (
            <div className="flex aspect-[4/3] w-full items-center justify-center bg-black/10 text-sm text-black/70">
              Opening camera…
            </div>
          ) : cameraState === "error" ? (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-[#1a3d2e]/15 p-6 text-center text-sm text-black/70">
              <span className="font-medium text-black/80">Camera unavailable</span>
              <span>Tap Start camera to try again, or go back and use Type A Description.</span>
            </div>
          ) : cameraState === "active" ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="aspect-[4/3] w-full bg-black/80 object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center bg-[#1a3d2e]/20 p-6 text-center text-sm text-black/60">
              Camera preview will appear here after you start.
            </div>
          )}
        </div>

        {errorMessage && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {errorMessage}
          </p>
        )}

        {cameraState === "active" && (
          <p className="mt-4 text-sm text-black/60">
            Preview is local; <span className="font-medium text-black/80">Capture</span>{" "}
            sends the photo to Grok.
            {!videoReady ? " Waiting for camera to be ready…" : null}
          </p>
        )}

        {classifyStatus === "loading" && !previewUrl && (
          <p className="mt-4 text-sm text-black/60" aria-live="polite">
            Identifying with Grok…
          </p>
        )}

        {classifyStatus === "api_error" && classifyErrorMessage && (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {classifyErrorMessage}
          </p>
        )}

        {showOutcomePanel && (
          <div className="mt-6">
            <DescriptionClassificationPanel
              classification={classification}
              source={source}
            />
            <ClassificationOutcomeActions
              classification={classification}
              busy={classifyStatus === "loading"}
              tryAgainLabel="Retake photo"
              onTryAgain={handleRetake}
              onSubmitClarification={async (answer) => {
                if (!previewUrl) return;
                const mergedContext = mergeDescriptionWithClarification(
                  pictureContext || PICTURE_CONTEXT_SEED,
                  answer
                );
                setPictureContext(mergedContext);
                await classifyCapturedImage(previewUrl, {
                  supplementalText: mergedContext,
                  keepPrevious: true,
                });
              }}
            />
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {cameraState === "idle" || cameraState === "error" ? (
            <Button
              type="button"
              onClick={startCamera}
              className="h-11 flex-1 bg-black text-white hover:bg-black/90"
            >
              Start camera
            </Button>
          ) : null}
          {cameraState === "active" ? (
            <Button
              type="button"
              onClick={capturePhoto}
              disabled={!videoReady}
              className="h-11 flex-1 bg-black text-white hover:bg-black/90 disabled:opacity-50"
            >
              {videoReady ? "Capture photo" : "Preparing camera…"}
            </Button>
          ) : null}
          {cameraState === "captured" ? (
            <>
              <Button
                type="button"
                onClick={handleRetake}
                variant="outline"
                className="h-11 flex-1 border-black/20 bg-white text-black hover:bg-black/5"
                disabled={classifyStatus === "loading"}
              >
                Retake
              </Button>
              {classifyStatus === "api_error" && previewUrl ? (
                <Button
                  type="button"
                  onClick={() => void classifyCapturedImage(previewUrl)}
                  className="h-11 flex-1 bg-black text-white hover:bg-black/90"
                >
                  Try classify again
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </HopHacksShell>
  );
}
