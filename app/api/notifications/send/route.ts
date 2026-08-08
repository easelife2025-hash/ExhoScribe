import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging, MulticastMessage } from "firebase-admin/messaging";

// Initialize Firebase Admin if it hasn't been initialized
if (!getApps().length) {
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "red-aura-ncf5x",
  });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, data } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getFirestore();
    const tokensSnapshot = await db.collection("users").doc(userId).collection("fcmTokens").get();

    if (tokensSnapshot.empty) {
      return NextResponse.json({ message: "User has no registered devices for notifications" }, { status: 200 });
    }

    const tokens: string[] = [];
    tokensSnapshot.forEach((doc) => {
      tokens.push(doc.id);
    });

    const message: MulticastMessage = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens,
    };

    const response = await getMessaging().sendEachForMulticast(message);
    
    // Cleanup invalid tokens
    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        if (
          resp.error?.code === "messaging/invalid-registration-token" ||
          resp.error?.code === "messaging/registration-token-not-registered"
        ) {
          failedTokens.push(tokens[idx]);
        }
      }
    });

    if (failedTokens.length > 0) {
      const batch = db.batch();
      failedTokens.forEach((token) => {
        const tokenRef = db.collection("users").doc(userId).collection("fcmTokens").doc(token);
        batch.delete(tokenRef);
      });
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      successCount: response.successCount, 
      failureCount: response.failureCount 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
