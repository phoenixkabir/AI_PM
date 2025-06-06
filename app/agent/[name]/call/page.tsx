"use client";

import { CloseIcon } from "@/components/CloseIcon";
import { NoAgentNotification } from "@/components/NoAgentNotification";
import TranscriptionView from "@/components/TranscriptionView";
import {
  BarVisualizer,
  DisconnectButton,
  RoomAudioRenderer,
  RoomContext,
  VideoTrack,
  VoiceAssistantControlBar,
  useVoiceAssistant,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { ConnectionState, Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
// @ts-expect-error - TODO: fix this
import type { ConnectionDetails } from "./api/connection-details/route";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import useCombinedTranscriptions from "@/hooks/useCombinedTranscriptions";

// Extract LiveKit-dependent logic into a separate component
interface CallContentProps {
  room: Room;
  userFeedbackId: string | null;
  agentName: string;
}

function CallContent({ room, userFeedbackId, agentName }: CallContentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const combinedTranscriptions = useCombinedTranscriptions();

  const onConnectButtonClicked = useCallback(async () => {
    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details?roomName=" + agentName.toLowerCase().replace(/ /g, '-'),
      window.location.origin
    );
    const response = await fetch(url.toString());
    const connectionDetailsData: ConnectionDetails = await response.json();

    await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
    await room.localParticipant.setMicrophoneEnabled(true);
    setIsConnected(true);
  }, [room, agentName]);

  useEffect(() => {
    room.on(RoomEvent.MediaDevicesError, onDeviceFailure);

    return () => {
      room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
      setIsConnected(false);
    };
  }, [room]);

  useEffect(() => {
    room.on(RoomEvent.ConnectionStateChanged, (state) => {
      setIsConnected(state === ConnectionState.Connected);
      console.log("Connection state changed to", state);
    });
  }, [room]);

  useEffect(() => {
    if (userFeedbackId && combinedTranscriptions.length > 0) {
      const sendTranscript = async () => {
        try {
          const response = await fetch(`/api/feedback/${userFeedbackId}/transcript`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(combinedTranscriptions),
          });

          if (!response.ok) {
            console.error('Failed to send transcript update:', response.statusText);
          } else {
            console.log('Transcript update sent successfully');
          }
        } catch (error) {
          console.error('Error sending transcript update:', error);
        }
      };

      sendTranscript();
    }
  }, [combinedTranscriptions, userFeedbackId]);

  return (
    <main data-lk-theme="default" className="h-full w-screen flex justify-center items-center bg-[var(--lk-bg)]">
      {isConnected ? (
        <div className="flex w-full h-screen">
          <div className="flex flex-col items-center justify-center p-6">
            <h1 className="text-2xl font-bold mb-4 capitalize">{agentName}</h1>
            <div className="w-[300px] h-[150px]">
              <AgentVisualizer />
            </div>
            <StartOrEndCallButton onConnectButtonClicked={onConnectButtonClicked} />
          </div>

          <div className={cn(isConnected && "flex-1 p-6")}>
            <SimpleVoiceAssistant />
          </div>
        </div>
      ) : (
        <div className="flex w-full h-screen items-center justify-center">
          <div className="flex flex-col items-center justify-center p-6">
            <h1 className="text-2xl font-bold mb-4 capitalize">{agentName}</h1>
            <div className="w-[300px] h-[150px]">
              <AgentVisualizer />
            </div>
            <StartOrEndCallButton onConnectButtonClicked={onConnectButtonClicked} />
          </div>
        </div>
      )}
    </main>
  );
}

export default function Page() {
  const params = useParams();
  const agentName = (params.name as string).replaceAll("-", " ");
  const [room] = useState(new Room());
  const [userFeedbackId, setUserFeedbackId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserFeedbackId = async () => {
      const url = new URL(
        process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details?roomName=" + agentName.toLowerCase().replace(/ /g, '-'),
        window.location.origin
      );
      try {
        const response = await fetch(url.toString());
        const connectionDetailsData: ConnectionDetails = await response.json();
        setUserFeedbackId(connectionDetailsData.userFeedbackId);
      } catch (error) {
        console.error("Failed to fetch connection details or create user feedback:", error);
      }
    };

    if (agentName) {
      fetchUserFeedbackId();
    }
  }, [agentName]);

  return (
    <RoomContext.Provider value={room}>
      <CallContent room={room} userFeedbackId={userFeedbackId} agentName={agentName} />
    </RoomContext.Provider>
  );
}

function SimpleVoiceAssistant() {
  const { state: agentState } = useVoiceAssistant();

  if (agentState === "disconnected") {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="connected"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col h-full"
      >
        <div className="flex-1 w-full overflow-y-auto">
          <TranscriptionView />
        </div>
        <RoomAudioRenderer />
        <NoAgentNotification state={agentState} />
      </motion.div>
    </AnimatePresence>
  );
}

function AgentVisualizer() {
  const { state: agentState, videoTrack, audioTrack } = useVoiceAssistant();

  if (videoTrack) {
    return (
      <div className="rounded-lg overflow-hidden h-full w-full">
        <VideoTrack trackRef={videoTrack} />
      </div>
    );
  }
  return (
    <BarVisualizer
      state={agentState}
      barCount={5}
      trackRef={audioTrack}
      className="agent-visualizer"
      options={{ minHeight: 24 }}
    />
  );
}

function StartOrEndCallButton(props: { onConnectButtonClicked: () => void }) {
  const { state: agentState } = useVoiceAssistant();

  return (
    <div className="mb-6">
      {agentState === "disconnected" ? (
        <button
          className="flex items-center justify-center px-6 py-3 bg-transparent border border-gray-600 text-white rounded-md"
          onClick={() => props.onConnectButtonClicked()}
        >
          <span>Start Call</span>
        </button>
      ) : (
        <ControlBar />
      )}
    </div>
  );
}

function ControlBar() {
  const { state: agentState } = useVoiceAssistant();

  return (
    <div className="relative h-[60px] w-full">
      <AnimatePresence>
        {agentState !== "disconnected" && agentState !== "connecting" && (
          <motion.div
            initial={{ opacity: 0, top: "10px" }}
            animate={{ opacity: 1, top: 0 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex h-8 absolute left-1/2 -translate-x-1/2  justify-center"
          >
            <VoiceAssistantControlBar controls={{ leave: false }} />
            <DisconnectButton>
              <CloseIcon />
            </DisconnectButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function onDeviceFailure(error: Error) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
