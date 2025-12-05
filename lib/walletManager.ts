// lib/walletManager.ts
import { Keypair } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface WalletInfo {
  name: string;
  path: string;
  publicKey: string;
  exists: boolean;
}

export class WalletManager {
  private static walletDir = path.join(os.homedir(), '.config/solana');

  /**
   * List all available wallets in the Solana config directory
   */
  static listWallets(): WalletInfo[] {
    const wallets: WalletInfo[] = [];
    
    // Common wallet names to check for
    const commonNames = ['id.json', 'demo-wallet.json', 'live-demo-wallet.json'];
    
    // Check for existing wallets
    if (fs.existsSync(this.walletDir)) {
      const files = fs.readdirSync(this.walletDir);
      const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'cli' && !f.startsWith('.'));
      
      for (const file of jsonFiles) {
        const walletPath = path.join(this.walletDir, file);
        try {
          const keypairData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
          const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
          
          wallets.push({
            name: file.replace('.json', ''),
            path: walletPath,
            publicKey: keypair.publicKey.toBase58(),
            exists: true
          });
        } catch (error) {
          console.warn(`Failed to load wallet ${file}:`, error);
        }
      }
    }
    
    return wallets;
  }

  /**
   * Create a new wallet with a given name
   */
  static createWallet(name: string): WalletInfo {
    const walletPath = path.join(this.walletDir, `${name}.json`);
    
    if (fs.existsSync(walletPath)) {
      throw new Error(`Wallet ${name} already exists`);
    }

    // Ensure directory exists
    if (!fs.existsSync(this.walletDir)) {
      fs.mkdirSync(this.walletDir, { recursive: true });
    }

    // Generate new keypair
    const keypair = Keypair.generate();
    const keypairArray = Array.from(keypair.secretKey);
    
    // Save to file
    fs.writeFileSync(walletPath, JSON.stringify(keypairArray));
    
    return {
      name,
      path: walletPath,
      publicKey: keypair.publicKey.toBase58(),
      exists: true
    };
  }

  /**
   * Get the currently configured Solana CLI wallet
   */
  static getCurrentWallet(): WalletInfo | null {
    try {
      const configPath = path.join(this.walletDir, 'cli', 'config.yml');
      if (!fs.existsSync(configPath)) {
        return null;
      }
      
      const configContent = fs.readFileSync(configPath, 'utf8');
      const keypairMatch = configContent.match(/keypair_path:\s*(.+)/);
      
      if (keypairMatch && keypairMatch[1]) {
        const walletPath = keypairMatch[1].trim().replace(/['"]/g, '');
        const expandedPath = walletPath.startsWith('~') 
          ? walletPath.replace('~', os.homedir()) 
          : walletPath;
        
        if (fs.existsSync(expandedPath)) {
          const keypairData = JSON.parse(fs.readFileSync(expandedPath, 'utf8'));
          const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
          
          return {
            name: path.basename(expandedPath, '.json'),
            path: expandedPath,
            publicKey: keypair.publicKey.toBase58(),
            exists: true
          };
        }
      }
    } catch (error) {
      console.warn('Failed to get current wallet:', error);
    }
    
    return null;
  }

  /**
   * Load a wallet by name or path
   */
  static loadWallet(nameOrPath: string): { keypair: Keypair; info: WalletInfo } {
    let walletPath: string;
    
    if (nameOrPath.includes('/') || nameOrPath.includes('\\')) {
      // It's a path
      walletPath = nameOrPath;
    } else {
      // It's a name, construct path
      if (!nameOrPath.endsWith('.json')) {
        nameOrPath += '.json';
      }
      walletPath = path.join(this.walletDir, nameOrPath);
    }

    if (!fs.existsSync(walletPath)) {
      throw new Error(`Wallet not found: ${walletPath}`);
    }

    const keypairData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

    return {
      keypair,
      info: {
        name: path.basename(walletPath, '.json'),
        path: walletPath,
        publicKey: keypair.publicKey.toBase58(),
        exists: true
      }
    };
  }

  /**
   * Get the best available wallet (prioritizes demo wallets, falls back to main wallet)
   */
  static getBestWallet(): { keypair: Keypair; info: WalletInfo } {
    const wallets = this.listWallets();
    
    // Priority order: demo-wallet, live-demo-wallet, id (main), first available
    const priorityOrder = ['demo-wallet', 'live-demo-wallet', 'id'];
    
    for (const priority of priorityOrder) {
      const wallet = wallets.find(w => w.name === priority);
      if (wallet) {
        return this.loadWallet(wallet.path);
      }
    }
    
    // If no priority wallets found, use first available
    if (wallets.length > 0) {
      return this.loadWallet(wallets[0].path);
    }
    
    throw new Error('No wallets found. Please create a wallet first.');
  }
}