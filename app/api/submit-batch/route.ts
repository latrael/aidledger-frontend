// app/api/submit-batch/route.ts
// @ts-nocheck
import { NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import {
  getProvider,
  getProgram,
  deriveNgoPda,
  deriveBatchPda,
} from "@/lib/aidledgerClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const batchIndex = BigInt(body.batchIndex ?? 0);
    const dataUri = body.dataUri ?? "ipfs://aidledger-demo-batch";
    const region = body.region ?? "Global";
    const programTag = body.programTag ?? "DemoProgram";

    const nowSec = Math.floor(Date.now() / 1000);
    const startTime = body.startTime ?? nowSec;
    const endTime = body.endTime ?? nowSec + 7 * 24 * 60 * 60;

    // dummy merkle root for now
    const merkleRoot: number[] = new Array(32).fill(0);

    const provider = getProvider();
    const program = getProgram(provider);
    const wallet = provider.wallet as anchor.Wallet;

    const ngoPda = deriveNgoPda(wallet.publicKey, program.programId);
    const batchPda = deriveBatchPda(ngoPda, batchIndex, program.programId);

    const tx = await program.methods
      .submitBatch(
        new anchor.BN(batchIndex.toString()),
        merkleRoot,
        dataUri,
        region,
        programTag,
        new anchor.BN(startTime),
        new anchor.BN(endTime)
      )
      .accounts({
        ngo: ngoPda,
        batch: batchPda,
        admin: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const batchAccount = await (program as any).account.batch.fetch(batchPda);

    return NextResponse.json({
      ok: true,
      tx,
      ngoPda: ngoPda.toBase58(),
      batchPda: batchPda.toBase58(),
      batchAccount,
    });
  } catch (err: any) {
    console.error("submit-batch error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
