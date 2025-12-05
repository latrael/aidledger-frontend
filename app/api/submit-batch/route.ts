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

    const { walletName, ngoPda: providedNgoPda } = body;
    const batchIndex = BigInt(body.batchIndex ?? 0);
    const dataUri = body.dataUri ?? "ipfs://aidledger-demo-batch";
    const region = body.region ?? "Global";
    const programTag = body.programTag ?? "DemoProgram";

    const nowSec = Math.floor(Date.now() / 1000);
    const startTime = body.startTime ?? nowSec;
    const endTime = body.endTime ?? nowSec + 7 * 24 * 60 * 60;

    // dummy merkle root for now
    const merkleRoot: number[] = new Array(32).fill(0);

    // Use CLI approach similar to register-ngo to use specific wallet
    if (walletName && providedNgoPda) {
      const { WalletManager } = await import('@/lib/walletManager');
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      const path = require('path');
      
      // Load the specified wallet
      const walletInfo = WalletManager.loadWallet(walletName);
      const selectedWalletPath = walletInfo.info.path;
      
      console.log(`🚀 Submitting batch with wallet: ${walletInfo.info.name} (${walletInfo.info.publicKey})`);
      console.log(`🏦 NGO PDA: ${providedNgoPda}`);

      // Set environment variables for the CLI script
      const env = {
        ...process.env,
        ANCHOR_WALLET: selectedWalletPath,
        ANCHOR_PROVIDER_URL: 'https://api.devnet.solana.com'
      };
      
      // Check if there's a CLI script for batch submission, if not use the original approach
      const projectRoot = path.join(process.cwd(), '../aidledger-dev/aidledger/offchain');
      
      try {
        const cliResult = await execAsync(
          `cd ${projectRoot} && npx ts-node submitBatch.ts "${providedNgoPda}" "${batchIndex}" "${dataUri}" "${region}" "${programTag}" "${startTime}" "${endTime}"`,
          { env }
        );
        
        console.log(`✅ CLI batch output:`, cliResult.stdout);
        
        // Parse transaction hash from CLI output - try multiple patterns
        let tx = null;
        
        const txPatterns = [
          /submitBatch tx: ([A-Za-z0-9]+)/,
          /Transaction: ([A-Za-z0-9]+)/,
          /tx: ([A-Za-z0-9]+)/,
          /([A-Za-z0-9]{87,88})/  // Solana transaction signatures are typically 87-88 chars
        ];
        
        for (const pattern of txPatterns) {
          const match = cliResult.stdout.match(pattern);
          if (match) {
            tx = match[1];
            break;
          }
        }
        
        if (!tx) {
          console.error('Failed to parse transaction hash. CLI output:', cliResult.stdout);
          throw new Error('Failed to parse transaction hash from CLI output');
        }
        
        console.log(`📝 Parsed batch transaction hash: ${tx}`);
        
        return NextResponse.json({
          ok: true,
          tx,
          ngoPda: providedNgoPda,
          batchPda: `batch-${batchIndex}`, // Placeholder
          message: 'Batch submitted successfully via CLI',
          cliOutput: cliResult.stdout,
        });
      } catch (cliError) {
        console.log('CLI batch submission failed, falling back to direct approach:', cliError.message);
        // Fall through to original approach
      }
    }

    // Original approach as fallback
    const provider = getProvider();
    const program = getProgram();
    const wallet = provider.wallet as anchor.Wallet;

    const ngoPda = providedNgoPda ? new (await import('@solana/web3.js')).PublicKey(providedNgoPda) : deriveNgoPda(wallet.publicKey);
    const batchPda = deriveBatchPda(ngoPda, batchIndex);

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
