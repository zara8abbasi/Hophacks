"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HopHacksShell } from "@/components/hophacks-shell";
import { Button } from "@/components/ui/button";

type CameraState = "idle" | "loading" | "active" | "error" | "captured";

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

  const startCamera = useCallback(async () => {
    setErrorMessage(null);
    setPreviewUrl(null);
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
  }, [stopStream]);

  const captureStub = useCallback(() => {
    const video = videoRef.current;
    if (!video || cameraState !== "active") return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setPreviewUrl(canvas.toDataURL("image/jpeg", 0.85));
    setCameraState("captured");
    stopStream();
  }, [cameraState, stopStream]);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (cameraState === "active" && video && stream) {
      void attachStreamToVideo(video, stream);
    }
  }, [cameraState, attachStreamToVideo]);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  return (
    <HopHacksShell showBack>
      <div className="rounded-2xl border border-white/20 bg-white/95 p-6 text-black shadow-lg sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Take A Picture</h1>
        <p className="mt-2 text-sm text-black/70 sm:text-base">
          Position the item in frame. Disposal guidance will use this photo in a
          future update.
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-black/5">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Captured preview of your item"
              className="aspect-[4/3] w-full object-cover"
            />
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

        {cameraState === "captured" && (
          <p className="mt-4 rounded-lg bg-[#1a3d2e]/10 px-4 py-3 text-sm text-[#1a3d2e]">
            Photo saved locally for this session. AI identification and drop-off
            directions are not connected yet.
          </p>
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
              onClick={captureStub}
              className="h-11 flex-1 bg-black text-white hover:bg-black/90"
            >
              Capture photo
            </Button>
          ) : null}
          {cameraState === "captured" ? (
            <Button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                startCamera();
              }}
              variant="outline"
              className="h-11 flex-1 border-black/20 bg-white"
            >
              Retake
            </Button>
          ) : null}
        </div>
      </div>
    </HopHacksShell>
  );
}
