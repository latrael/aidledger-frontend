// app/api/wallet/route.ts
import { NextResponse } from "next/server";
import { WalletManager } from "@/lib/walletManager";

export async function GET() {
  try {
    const wallets = WalletManager.listWallets();
    const currentWallet = WalletManager.getCurrentWallet();
    
    return NextResponse.json({
      ok: true,
      wallets,
      currentWallet,
      count: wallets.length
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { action, name } = await req.json();
    
    if (action === 'create') {
      if (!name) {
        return NextResponse.json(
          { ok: false, error: 'Wallet name is required' },
          { status: 400 }
        );
      }
      
      const wallet = WalletManager.createWallet(name);
      
      // Try to airdrop SOL to the new wallet using the dedicated airdrop API
      try {
        const airdropRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/wallet/airdrop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: wallet.publicKey })
        });
        
        const airdropData = await airdropRes.json();
        
        if (airdropData.ok) {
          return NextResponse.json({
            ok: true,
            wallet,
            airdropSuccess: true,
            message: `Wallet '${name}' created successfully with 2 SOL airdropped!`
          });
        } else {
          return NextResponse.json({
            ok: true,
            wallet,
            airdropSuccess: false,
            message: `Wallet '${name}' created successfully (airdrop failed: ${airdropData.error})`
          });
        }
      } catch (airdropError: any) {
        return NextResponse.json({
          ok: true,
          wallet,
          airdropSuccess: false,
          message: `Wallet '${name}' created successfully (airdrop failed: ${airdropError.message})`
        });
      }
    }
    
    return NextResponse.json(
      { ok: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}