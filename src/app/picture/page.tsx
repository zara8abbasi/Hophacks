"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HopHacksShell } from "@/components/hophacks-shell";
import { Button } from "@/components/ui/button";

type CameraState = "idle" | "loading" | "active" | "error" | "captured";

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

  const startCamera = useCallback(async () => {
    setErrorMessage(null);
    setPreviewUrl(null);
    setCameraState("loading");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraState("active");
    } catch {
      setCameraState("error");
      setErrorMessage(
        "We couldn’t open your camera. Check permissions or use Type A Description instead."
      );
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
      video.srcObject = stream;
      void video.play();
    }
  }, [cameraState]);

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
          ) : cameraState === "active" ? (
            <video
              ref={videoRef}
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
