// app/api/ngos/route.ts
// @ts-nocheck

import { NextResponse } from "next/server";
import { listNgos } from "@/lib/aidledgerClient";

export async function GET() {
  try {
    const ngos = await listNgos();

    const flattened = ngos.map((n: any) => ({
      pubkey: n.publicKey.toBase58(),
      account: {
        admin: n.account.admin.toBase58(),
        metadataUri: n.account.metadataUri,
        isActive: n.account.isActive,
        createdAt: n.account.createdAt
          ? Number(n.account.createdAt)
          : null,
      },
    }));

    return NextResponse.json({
      ok: true,
      ngos: flattened,
    });
  } catch (err: any) {
    console.error("GET /api/ngos error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}
