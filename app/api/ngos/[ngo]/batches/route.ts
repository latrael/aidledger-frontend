// app/api/ngos/[ngo]/batches/route.ts
// @ts-nocheck

import { NextResponse } from "next/server";
import { listBatchesForNgoBase58 } from "@/lib/aidledgerClient";

interface Params {
  ngo: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Params },
) {
  try {
    const ngoBase58 = params.ngo; // string from the URL

    const batches = await listBatchesForNgoBase58(ngoBase58);

    // sort by batchIndex ascending
    batches.sort(
      (a: any, b: any) =>
        Number(a.account.batchIndex) - Number(b.account.batchIndex),
    );

    const flattened = batches.map((b: any) => ({
      pubkey: b.publicKey.toBase58(),
      account: {
        ngo: b.account.ngo.toBase58(),
        batchIndex: Number(b.account.batchIndex),
        merkleRoot: b.account.merkleRoot, // already plain bytes[]
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
      ngo: ngoBase58,
      batches: flattened,
    });
  } catch (err: any) {
    console.error("GET /api/ngos/[ngo]/batches error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}
