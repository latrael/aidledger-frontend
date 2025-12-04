// lib/aidledgerClient.ts
// Node-side helper for API routes

// @ts-nocheck
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
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

const connection = new Connection(process.env.ANCHOR_PROVIDER_URL || clusterApiUrl("devnet"));
const wallet = new anchor.Wallet(Keypair.generate()); // dummy
const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());


export function getProvider() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  return provider;
}

export function getProgram(provider?: anchor.AnchorProvider) {
  const p = provider ?? getProvider();
  // modern constructor: Program(idl, provider)
  return new anchor.Program(patchedIdl as anchor.Idl, p);
}

export function deriveNgoPda(admin: PublicKey, programId: PublicKey) {
  const [ngoPda] = PublicKey.findProgramAddressSync(
    [NGO_SEED, admin.toBuffer()],
    programId
  );
  return ngoPda;
}

export function deriveBatchPda(
  ngoPda: PublicKey,
  batchIndex: bigint,
  programId: PublicKey
) {
  const batchIndexBuf = Buffer.alloc(8);
  batchIndexBuf.writeBigUInt64LE(batchIndex);
  const [batchPda] = PublicKey.findProgramAddressSync(
    [BATCH_SEED, ngoPda.toBuffer(), batchIndexBuf],
    programId
  );
  return batchPda;
}

export async function listNgos() {
  const provider = getProvider();
  const program = getProgram(provider);

  const ngos = await (program as any).account.ngo.all();
  return ngos;
}

// List all batches for a specific NGO (ng0 as base58 string)
export async function listBatchesForNgoBase58(ngoBase58: string) {
  const provider = getProvider();
  const program = getProgram(provider);

  const batches = await (program as any).account.batch.all([
    {
      memcmp: {
        offset: 8,        // discriminator (8 bytes) then ngo Pubkey
        bytes: ngoBase58, // must be a non-empty base58 string
      },
    },
  ]);

  return batches;
}

