// app/api/wallet/airdrop/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { walletName, address } = await req.json();
    
    if (!walletName && !address) {
      return NextResponse.json(
        { ok: false, error: 'Either walletName or address is required' },
        { status: 400 }
      );
    }

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    const path = require('path');
    const os = require('os');

    // Retry logic for airdrop
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        let airdropResult;
        
        if (walletName) {
          // Use wallet by name
          const walletPath = path.join(os.homedir(), '.config/solana', `${walletName}.json`);
          
          if (!require('fs').existsSync(walletPath)) {
            return NextResponse.json(
              { ok: false, error: `Wallet ${walletName} not found` },
              { status: 404 }
            );
          }

          // Set keypair and airdrop
          await execAsync(`solana config set --keypair "${walletPath}"`);
          airdropResult = await execAsync(`solana airdrop 2`, { timeout: 30000 });
        } else {
          // Use address directly
          airdropResult = await execAsync(`solana airdrop 2 ${address}`, { timeout: 30000 });
        }
        
        // If we get here, airdrop was successful
        return NextResponse.json({
          ok: true,
          message: `Airdrop successful on attempt ${attempt}`,
          walletName,
          address,
          output: airdropResult.stdout,
          attempts: attempt
        });
        
      } catch (airdropError: any) {
        lastError = airdropError;
        console.log(`Airdrop attempt ${attempt} failed:`, airdropError.message);
        
        // If it's a rate limit error and we have retries left, wait and try again
        if (attempt < maxRetries && airdropError.message.includes('rate limit')) {
          console.log(`Waiting 2 seconds before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
    }
    
    // All retries failed
    const errorMessage = lastError?.message || 'Unknown error';
    console.error('Airdrop failed after all retries:', errorMessage);
    
    if (errorMessage.includes('rate limit')) {
      return NextResponse.json({
        ok: false,
        error: 'Airdrop failed due to rate limiting. Please try again in a few minutes.',
        details: errorMessage,
        suggestion: 'Use the CLI command: solana airdrop 2 ' + (address || walletName)
      });
    }
    
    return NextResponse.json({
      ok: false,
      error: `Airdrop failed after ${maxRetries} attempts: ${errorMessage}`,
      details: errorMessage
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}