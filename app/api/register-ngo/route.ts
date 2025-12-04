// app/api/register-ngo/route.ts
// @ts-nocheck
import { NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { getProvider, getProgram, deriveNgoPda } from "@/lib/aidledgerClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const metadataUri =
      body.metadataUri ?? "ipfs://aidledger-demo-ngo";

    const provider = getProvider();
    const program = getProgram(provider);
    const wallet = provider.wallet as anchor.Wallet;

    const ngoPda = deriveNgoPda(wallet.publicKey, program.programId);

    const tx = await program.methods
      .registerNgo(metadataUri)
      .accounts({
        ngo: ngoPda,
        admin: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const ngoAccount = await (program as any).account.ngo.fetch(ngoPda);

    return NextResponse.json({
      ok: true,
      tx,
      ngoPda: ngoPda.toBase58(),
      ngoAccount,
    });
  } catch (err: any) {
    console.error("register-ngo error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
