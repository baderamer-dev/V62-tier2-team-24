import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/require-auth";

// ── GET /api/paths/[id] ──────────────────────────────────────────────────────
// Returns the full path document (including completedSteps) from Firestore.
// Only the owner can read their path.
export const GET = requireAuth<{ id: string }>(
  async (_request, { params, auth }) => {
    const { id } = await params;

    try {
      const db = getAdminFirestore();
      const doc = await db.collection("paths").doc(id).get();

      if (!doc.exists) {
        return NextResponse.json({ error: "Path not found" }, { status: 404 });
      }

      const data = doc.data()!;

      if (data.userId !== auth.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json(data, { status: 200 });
    } catch (err) {
      console.error(`[GET /api/paths/${id}] Firestore error:`, err);
      return NextResponse.json(
        { error: "Failed to fetch path" },
        { status: 500 },
      );
    }
  },
);
