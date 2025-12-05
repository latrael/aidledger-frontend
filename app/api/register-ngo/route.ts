// app/api/register-ngo/route.ts
// @ts-nocheck

import { NextResponse } from "next/server";
import * as anchor from "@coral-xyz/anchor";
import { 
  SystemProgram, 
  PublicKey, 
  Connection, 
  clusterApiUrl, 
  Keypair,
  Transaction,
  VersionedTransaction 
} from "@solana/web3.js";
import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';

const execAsync = promisify(exec);

// Simple wallet implementation to avoid import issues
class KeypairWallet {
  constructor(public payer: Keypair) {}

  get publicKey() {
    return this.payer.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (tx instanceof Transaction) {
      tx.partialSign(this.payer);
    } else {
      throw new Error('VersionedTransaction signing not implemented');
    }
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    return Promise.all(txs.map(tx => this.signTransaction(tx)));
  }
}
import {
  deriveNgoPda,
} from "@/lib/aidledgerClient";
import * as fs from "fs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { metadataUri, admin, walletName } = body as {
      metadataUri: string;
      admin?: string;
      walletName?: string;
    };

    if (!metadataUri) {
      return NextResponse.json(
        { ok: false, error: "metadataUri is required" },
        { status: 400 },
      );
    }

    // Use CLI approach for NGO registration to avoid Anchor Program issues
    try {
      const { WalletManager } = await import('@/lib/walletManager');
      
      // Load the specified wallet or get the best available one
      let walletInfo;
      if (walletName) {
        walletInfo = WalletManager.loadWallet(walletName);
      } else {
        walletInfo = WalletManager.getBestWallet();
      }
      
      const { keypair, info } = walletInfo;
      console.log(`🔑 Using wallet: ${info.name} (${info.publicKey})`);
      
      const selectedWalletPath = info.path;
      
      const adminPubkey = admin ? new PublicKey(admin) : keypair.publicKey;
      const ngoPda = deriveNgoPda(adminPubkey);

      console.log(`🚀 Registering NGO with admin: ${adminPubkey.toBase58()}`);
      console.log(`📧 Metadata URI: ${metadataUri}`);
      console.log(`🏦 NGO PDA: ${ngoPda.toBase58()}`);

      // Check if NGO already exists first
      console.log(`🔍 Checking if NGO already exists...`);
      const existingNgoAccount = await connection.getAccountInfo(ngoPda);
      if (existingNgoAccount) {
        console.log('✅ NGO already exists, returning existing data');
        return NextResponse.json({
          ok: true,
          tx: 'Already exists',
          ngoPda: ngoPda.toBase58(),
          message: 'NGO already registered for this wallet'
        });
      }

      // Set environment variables for the CLI script
      
      const env = {
        ...process.env,
        ANCHOR_WALLET: selectedWalletPath,
        ANCHOR_PROVIDER_URL: 'https://api.devnet.solana.com'
      };
      
      const cliResult = await execAsync(
        `cd ${path.join(process.cwd(), '../aidledger-dev/aidledger/offchain')} && npx ts-node registerNgo.ts \"${metadataUri}\"`,
        { env }
      );
      
      console.log(`✅ CLI output:`, cliResult.stdout);
      
      // Parse transaction hash from CLI output - try multiple patterns
      let tx = null;
      
      // Try different patterns for transaction hash
      const txPatterns = [
        /Register NGO tx: ([A-Za-z0-9]+)/,
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
      
      console.log(`📝 Parsed transaction hash: ${tx}`);
      
      // Fetch the created account
      const ngoAccount = await connection.getAccountInfo(ngoPda);

      return NextResponse.json({
        ok: true,
        tx,
        ngoPda: ngoPda.toBase58(),
        message: 'NGO registered successfully via CLI',
        cliOutput: cliResult.stdout,
      });
    } catch (walletError: any) {
      console.error('❌ Failed to register NGO:', walletError);
      
      // Check for specific error types and provide helpful messages
      if (walletError.message?.includes('Attempt to debit an account but found no record of a prior credit')) {
        const walletInfo = selectedWalletPath.includes('demo-wallet') ? 'demo-wallet' : 'selected wallet';
        return NextResponse.json({
          ok: false,
          error: `Wallet has insufficient SOL for transaction fees.`,
          errorType: 'insufficient_funds',
          details: `The ${walletInfo} needs SOL to pay for blockchain transaction fees.`,
          suggestion: 'Use the "💰 Airdrop SOL" button or run: solana airdrop 2 <wallet-address>'
        }, { status: 400 });
      }
      
      if (walletError.message?.includes('already in use') || walletError.message?.includes('account Address') && walletError.message?.includes('already in use')) {
        return NextResponse.json({
          ok: false,
          error: `NGO already exists for this wallet.`,
          errorType: 'duplicate_ngo',
          details: 'Each wallet can only register one NGO. Use a different wallet to register additional NGOs.',
          suggestion: 'Create a new wallet from the Wallet Manager to register another NGO.'
        }, { status: 400 });
      }
      
      // Generic error with more helpful message
      return NextResponse.json({
        ok: false,
        error: `NGO registration failed: ${walletError.message || 'Unknown error'}`,
        errorType: 'registration_error',
        details: 'There was an issue registering the NGO on the blockchain.',
        suggestion: 'Please check the wallet has sufficient SOL and try again.'
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error("POST /api/register-ngo error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}
