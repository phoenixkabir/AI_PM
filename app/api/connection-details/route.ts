import { AccessToken, AccessTokenOptions, VideoGrant } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db"; // Assuming db instance is exported from '@/db'
import { ProductConversations, UserFeedback } from "@/db/schema";
import { eq } from "drizzle-orm";

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// don't cache the results
export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
  userFeedbackId: string;
};

export async function GET(request: NextRequest) {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (API_KEY === undefined) {
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (API_SECRET === undefined) {
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    const roomNameData = request.nextUrl.searchParams.get("roomName");
    if (!roomNameData) {
        return NextResponse.json({ error: "roomName is required" }, { status: 400 });
    }
    const roomName = roomNameData;

    // Find the ProductConversation based on the roomName (uniqueName)
    const conversation = await db.query.ProductConversations.findFirst({
        where: eq(ProductConversations.uniqueName, roomName as any),
    });

    if (!conversation) {
        return NextResponse.json({ error: `ProductConversation with uniqueName ${roomName} not found` }, { status: 404 });
    }

    // Generate unique participant identity with timestamp to ensure uniqueness for concurrent users
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10_000);
    const participantIdentity = `voice_assistant_user_${timestamp}_${randomSuffix}`;

    // Create a new UserFeedback record, including participantIdentity in metadata
    const newUserFeedback = await db.insert(UserFeedback).values({
        conversationId: conversation.id,
        status: 'initiated',
        metadata: { participantIdentity: participantIdentity }, // Store participantIdentity
        // transcript and userData can be left as default or empty initially
    }).returning({ id: UserFeedback.id });

    if (!newUserFeedback || newUserFeedback.length === 0) {
        throw new Error("Failed to create new UserFeedback record");
    }

    const userFeedbackId = newUserFeedback[0].id;

    // Generate participant token
    const participantToken = await createParticipantToken(
      { identity: participantIdentity }, // Use the generated identity
      conversation.uniqueName // Use the uniqueName from the found conversation
    );

    // Return connection details including the new userFeedbackId and participantName
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName: conversation.uniqueName,
      participantToken: participantToken,
      participantName: participantIdentity, // Return the generated identity
      userFeedbackId: userFeedbackId,
    };
    const headers = new Headers({
      "Cache-Control": "no-store",
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in connection-details API:', error);
      return new NextResponse(error.message, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

function createParticipantToken(userInfo: AccessTokenOptions, roomName: string) {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "15m",
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}
