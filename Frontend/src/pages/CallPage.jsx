import React from "react";
import { useEffect, useState } from "react";
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

  const sendFrame = async (blob) => {
    const form = new FormData();
    form.append("file", blob, "frame.jpg");

    const res = await fetch("http://localhost:9000/detect", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    console.log("AI:", data.detections);
  };

  useEffect(() => {
    const id = setInterval(() => {
      let video = document.querySelector("video");

      if (!video) return;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);

      canvas.toBlob((blob) => sendFrame(blob), "image/jpeg");
    }, 400);

    return () => clearInterval(id);
  }, []);

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
      } catch {}
      try {
        // Disconnect the user/session; method presence varies by SDK version.
        videoClientRef?.disconnectUser?.();
        videoClientRef?.destroy?.();
      } catch {}
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
              <CallContent />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();

  const callingState = useCallCallingState();
  const navigate = useNavigate();

  if (callingState === CallingState.LEFT) return navigate("/");

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};

export default CallPage;
