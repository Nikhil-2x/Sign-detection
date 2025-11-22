import React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";

import { getStreamToken } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const { user, isLoaded } = useUser();

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!user,
  });

  const [detections, setDetections] = useState([]);
  const clearTimerRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const lastSentRef = useRef(0);

  const clearDetectionsSoon = () => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => setDetections([]), 800);
  };

  const sendFrame = useCallback(async (blob) => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    try {
      const form = new FormData();
      form.append("file", blob, "frame.jpg");

      const res = await fetch(
        "https://nick-localhost-sign-detect.hf.space/detect",
        // "http://localhost:7860/detect",
        {
          method: "POST",
          body: form,
        },
      );

      const data = await res.json();
      const dets = Array.isArray(data?.detections) ? data.detections : [];

      setDetections(dets);
      if (dets.length === 0) {
        clearDetectionsSoon();
      } else {
        clearDetectionsSoon();
      }
    } catch {
      // swallow network/model errors to keep UI responsive
    } finally {
      requestInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    const CAPTURE_INTERVAL_MS = 500;
    const id = setInterval(() => {
      const now = Date.now();
      if (now - lastSentRef.current < CAPTURE_INTERVAL_MS) return;

      const video = document.querySelector("video");
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

      const canvas = document.createElement("canvas");
      // Reduce resolution for bandwidth/latency; backend rescales
      const targetW = Math.min(640, video.videoWidth);
      const scale = targetW / video.videoWidth;
      const targetH = Math.floor(video.videoHeight * scale);
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, targetW, targetH);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            lastSentRef.current = now;
            sendFrame(blob);
          }
        },
        "image/jpeg",
        0.8,
      );
    }, 100);

    return () => {
      clearInterval(id);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [sendFrame]);

  // useEffect(() => {
  //   const initCall = async () => {
  //     if (!tokenData.token || !user || !callId) return;

  //     try {
  //       const videoClient = new StreamVideoClient({
  //         apiKey: STREAM_API_KEY,
  //         user: {
  //           id: user.id,
  //           name: user.fullName,
  //           image: user.imageUrl,
  //         },
  //         token: tokenData.token,
  //       });

  //       const callInstance = videoClient.call("default", callId);
  //       await callInstance.join({ create: true });

  //       setClient(videoClient);
  //       setCall(callInstance);
  //     } catch (error) {
  //       console.log("Error init call:", error);
  //       toast.error("Cannot connect to the call.");
  //     } finally {
  //       setIsConnecting(false);
  //     }
  //   };

  //   initCall();
  // }, [tokenData, user, callId]);
  //
  useEffect(() => {
    let isMounted = true;
    let videoClientRef;
    let callRef;

    const initCall = async () => {
      if (!tokenData?.token || !user || !callId) return;

      try {
        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: {
            id: user.id,
            name: user.fullName,
            image: user.imageUrl,
          },
          token: tokenData.token,
        });
        videoClientRef = videoClient;

        const callInstance = videoClient.call("default", callId);
        callRef = callInstance;
        await callInstance.join({ create: true });

        if (!isMounted) return;
        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.log("Error init call:", error);
        toast.error("Cannot connect to the call.");
      } finally {
        if (isMounted) setIsConnecting(false);
      }
    };

    initCall();

    return () => {
      isMounted = false;
      try {
        callRef?.leave?.();
      } catch {
        // ignore
      }
      try {
        // Disconnect the user/session; method presence varies by SDK version.
        videoClientRef?.disconnectUser?.();
        videoClientRef?.destroy?.();
      } catch {
        // ignore
      }
    };
  }, [tokenData, user, callId]);

  if (isConnecting || !isLoaded) {
    return (
      <div className="h-screen flex justify-center items-center">
        Connecting to call...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="relative w-full max-w-4xl mx-auto">
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent detections={detections} />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later</p>
          </div>
        )}
        {/* Overlay for gesture results */}
        {detections?.length > 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-end p-4 gap-2">
            {detections.slice(0, 3).map((d, i) => (
              <div
                key={i}
                className="bg-black/70 text-white rounded-md px-3 py-2 shadow-md text-sm"
              >
                <span className="font-semibold mr-2">{d.label}</span>
                <span className="opacity-80">
                  {(d.score * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = ({ detections = [] }) => {
  const { useCallCallingState } = useCallStateHooks();

  const callingState = useCallCallingState();
  const navigate = useNavigate();

  if (callingState === CallingState.LEFT) return navigate("/");

  return (
    <StreamTheme>
      <div className="relative">
        <SpeakerLayout />
        {/* Optional bounding boxes overlay */}
        {detections?.length > 0 && <BoxesOverlay detections={detections} />}
      </div>
      <CallControls />
    </StreamTheme>
  );
};

const BoxesOverlay = () => {
  // We don't have direct access to the underlying video element dimensions here reliably.
  // The backend already returns pixel coordinates relative to captured frame. We scaled
  // down the captured frame before sending, so to render boxes aligned to the visible
  // layout would require knowing the actual video DOM rect. For simplicity, we render
  // badges only above; boxes overlay can be enabled when DOM sizing is wired.
  // Placeholder for future box rendering if needed.
  return null;
};

export default CallPage;
