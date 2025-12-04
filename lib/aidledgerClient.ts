// lib/aidledgerClient.ts
// @ts-nocheck

import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Keypair,
} from "@solana/web3.js";
import idlJson from "@/idl/aidledger.json";

// Seeds must match your Rust
const NGO_SEED = Buffer.from("ngo");
const BATCH_SEED = Buffer.from("batch");

// Patch IDL accounts to avoid `size` error
const modernIdl: any = idlJson as any;
const patchedIdl: any = {
  ...modernIdl,
  accounts: (modernIdl.accounts ?? [])
    .filter((acc: any) => !!acc)
    .map((acc: any) => ({ ...acc, size: acc.size ?? 0 })),
};

const PROGRAM_ID = new PublicKey(
  (patchedIdl.address as string) || process.env.AIDLEDGER_PROGRAM_ID!
);

// Toggle: use AnchorProvider.env() when developing locally
// On Vercel, this will be undefined/false, so it will use the dummy wallet path.
const USE_ANCHOR_ENV = process.env.AIDLEDGER_USE_ANCHOR_ENV === "true";

export function getProvider() {
  if (USE_ANCHOR_ENV) {
    // Local dev: use ANCHOR_WALLET + ANCHOR_PROVIDER_URL
    return anchor.AnchorProvider.env();
  }

  // Cloud / generic: construct provider from RPC URL + dummy wallet
  const rpcUrl =
    process.env.ANCHOR_PROVIDER_URL || clusterApiUrl("devnet");

  const connection = new Connection(rpcUrl, "confirmed");
  const wallet = new anchor.Wallet(Keypair.generate()); // read-only / ephemeral
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  return provider;
}

export function getProgram(provider?: anchor.AnchorProvider) {
  const prov = provider || getProvider();
  return new anchor.Program(patchedIdl as anchor.Idl, PROGRAM_ID, prov);
}

// Example helper: list NGOs
export async function listNgos() {
  const provider = getProvider();
  const program = getProgram(provider);
  const ngos = await (program as any).account.ngo.all();
  return ngos;
}

// Example helper: list batches for NGO (base58)
export async function listBatchesForNgoBase58(ngoBase58: string) {
  const provider = getProvider();
  const program = getProgram(provider);

  const batches = await (program as any).account.batch.all([
    {
      memcmp: {
        offset: 8, // discriminator (8 bytes), then ngo Pubkey
        bytes: ngoBase58,
      },
    },
  ]);

  return batches;
}
