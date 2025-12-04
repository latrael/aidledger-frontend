// app/api/batches/route.ts
// @ts-nocheck

import { NextResponse } from "next/server";
import { listBatchesForNgoBase58 } from "@/lib/aidledgerClient";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const ngo = url.searchParams.get("ngo");

    if (!ngo) {
      return NextResponse.json(
        { ok: false, error: "Missing 'ngo' query parameter" },
        { status: 400 }
      );
    }

    const batches = await listBatchesForNgoBase58(ngo);

    // sort by batchIndex ascending
    batches.sort(
      (a: any, b: any) =>
        Number(a.account.batchIndex) - Number(b.account.batchIndex)
    );

    const flattened = batches.map((b: any) => ({
      pubkey: b.publicKey.toBase58(),
      account: {
        ngo: b.account.ngo.toBase58(),
        batchIndex: Number(b.account.batchIndex),
        merkleRoot: b.account.merkleRoot, // bytes[]
        dataUri: b.account.dataUri,
        region: b.account.region,
        programTag: b.account.programTag,
        startTime: Number(b.account.startTime),
        endTime: Number(b.account.endTime),
        isFlagged: b.account.isFlagged,
        bump: b.account.bump,
      },
    }));

    return NextResponse.json({
      ok: true,
      ngo,
      batches: flattened,
    });
  } catch (err: any) {
    console.error("GET /api/batches error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
