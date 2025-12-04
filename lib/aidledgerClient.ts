// lib/aidledgerClient.ts
// @ts-nocheck

import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import idlJson from "@/idl/aidledger.json";

// Seeds must match your Rust program
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

// Helper: get program ID from IDL or env
function getProgramId(): PublicKey {
  const fromIdl = patchedIdl.address as string | undefined;
  const fromEnv = process.env.AIDLEDGER_PROGRAM_ID as string | undefined;

  if (!fromIdl && !fromEnv) {
    throw new Error(
      "Aidledger program ID missing. Set `address` in IDL or `AIDLEDGER_PROGRAM_ID` env."
    );
  }

  return new PublicKey(fromIdl ?? fromEnv!);
}

// Toggle: use AnchorProvider.env() when developing locally
// On Vercel, leave this *unset* so we take the dummy-provider path.
const USE_ANCHOR_ENV = process.env.AIDLEDGER_USE_ANCHOR_ENV === "true";

export function getProvider() {
  if (USE_ANCHOR_ENV) {
    // Local dev: uses ANCHOR_WALLET + ANCHOR_PROVIDER_URL
    return anchor.AnchorProvider.env();
  }

  // Vercel / generic: construct provider from RPC URL + dummy wallet
  const rpcUrl =
    process.env.ANCHOR_PROVIDER_URL || clusterApiUrl("devnet");

  const connection = new Connection(rpcUrl, "confirmed");

  // We only do read-only RPC calls on Vercel, so a dummy wallet is fine.
  const dummyWallet = {
    publicKey: new PublicKey("11111111111111111111111111111111"),
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  } as any;

  const provider = new anchor.AnchorProvider(
    connection,
    dummyWallet,
    anchor.AnchorProvider.defaultOptions()
  );
  return provider;
}

export function getProgram(provider?: anchor.AnchorProvider) {
  const prov = provider || getProvider();
  const programId = getProgramId();
  return new anchor.Program(patchedIdl as anchor.Idl, programId, prov);
}

/**
 * Derive NGO PDA from admin pubkey
 */
export function deriveNgoPda(admin: PublicKey): [PublicKey, number] {
  const programId = getProgramId();
  return PublicKey.findProgramAddressSync(
    [NGO_SEED, admin.toBuffer()],
    programId
  );
}

/**
 * Derive Batch PDA from NGO pubkey + batch index
 */
export function deriveBatchPda(
  ngo: PublicKey,
  batchIndex: number | anchor.BN
): [PublicKey, number] {
  const programId = getProgramId();
  const indexBn = anchor.BN.isBN?.(batchIndex)
    ? (batchIndex as anchor.BN)
    : new anchor.BN(batchIndex as number);
  const indexSeed = indexBn.toArrayLike(Buffer, "le", 8);

  return PublicKey.findProgramAddressSync(
    [BATCH_SEED, ngo.toBuffer(), indexSeed],
    programId
  );
}

/**
 * List all NGOs
 */
export async function listNgos() {
  const provider = getProvider();
  const program = getProgram(provider);
  const ngos = await (program as any).account.ngo.all();
  return ngos;
}

/**
 * List batches filtered by NGO (base58)
 */
export async function listBatchesForNgoBase58(ngoBase58: string) {
  const provider = getProvider();
  const program = getProgram(provider);

  const batches = await (program as any).account.batch.all([
    {
      memcmp: {
        offset: 8, // account discriminator (8 bytes), then ngo Pubkey
        bytes: ngoBase58,
      },
    },
  ]);

  return batches;
}
