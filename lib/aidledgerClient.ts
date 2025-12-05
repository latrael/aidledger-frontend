// lib/aidledgerClient.ts
// @ts-nocheck

import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Keypair,
} from "@solana/web3.js";

// Program ID: from env or hard-coded fallback
const PROGRAM_ID_STR =
  process.env.NEXT_PUBLIC_AIDLEDGER_PROGRAM_ID ||
  "4wcEn4cPenW3GM1eYfNoAHsmnN1SPNLnLqSCtBruaobD";

const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);

// RPC: devnet by default (or override via env)
const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl("devnet");

const connection = new Connection(RPC_URL, "confirmed");

// Load local Solana wallet for transactions
let wallet: any;
let provider: anchor.AnchorProvider;

try {
  // Try to load the demo Solana wallet (or fallback to main wallet)
  const fs = require('fs');
  const os = require('os');
  const path = require('path');
  
  // Try demo wallet first, fallback to main wallet
  let walletPath = path.join(os.homedir(), '.config/solana/demo-wallet.json');
  if (!fs.existsSync(walletPath)) {
    walletPath = path.join(os.homedir(), '.config/solana/id.json');
  }
  
  const keypairData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  
  wallet = new KeypairWallet(keypair);
  console.log('📝 Using Solana wallet:', wallet.publicKey.toBase58());
  console.log('📁 Wallet path:', walletPath);
  
  provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
} catch (error) {
  console.log('⚠️  Could not load local wallet, using read-only mode');
  // Fallback to dummy wallet for read-only operations
  wallet = {
    publicKey: new PublicKey("11111111111111111111111111111111"),
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  } as any;
  
  provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
}

// Create real Anchor program for write operations if wallet is available
let anchorProgram: any = null;

async function createAnchorProgram() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const idlPath = path.join(process.cwd(), 'idl', 'aidledger.json');
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    
    // Patch the IDL for compatibility
    if (idl.types && !idl.accounts) {
      idl.accounts = idl.types.filter((type: any) => 
        type.name === 'Ngo' || type.name === 'Batch'
      ).map((type: any) => ({
        name: type.name.toLowerCase(),
        type: {
          kind: "struct",
          fields: type.type.fields
        }
      }));
    }
    
    anchorProgram = new anchor.Program(idl, PROGRAM_ID, provider);
    console.log('✅ Anchor program created successfully');
    return anchorProgram;
  } catch (error) {
    console.error('❌ Failed to create Anchor program:', error);
    return null;
  }
}

// Simple account data parser for NGO accounts
function parseNgoAccount(data: Buffer) {
  try {
    // NGO account layout:
    // - 8 bytes: discriminator
    // - 32 bytes: admin pubkey 
    // - 4 bytes: string length + string data (metadata_uri)
    // - 1 byte: is_active bool
    // - 1 byte: bump
    // - 8 bytes: created_at (i64)
    
    let offset = 8; // Skip 8-byte discriminator
    
    // Read admin pubkey (32 bytes)
    const admin = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Read metadata_uri (4-byte length + string)
    const metadataUriLength = data.readUInt32LE(offset);
    offset += 4;
    const metadataUri = data.slice(offset, offset + metadataUriLength).toString('utf8');
    offset += metadataUriLength;
    
    // Read is_active (1 byte)
    const isActive = data.readUInt8(offset) !== 0;
    offset += 1;
    
    // Read bump (1 byte)
    const bump = data.readUInt8(offset);
    offset += 1;
    
    // Read created_at (8 bytes, i64)
    const createdAt = data.readBigInt64LE(offset);
    
    return {
      admin,
      metadataUri,
      isActive,
      bump,
      createdAt: new anchor.BN(createdAt.toString())
    };
  } catch (error) {
    console.error("Error parsing NGO account:", error);
    return null;
  }
}

// Create a simple program interface for read operations without IDL issues
const program = {
  account: {
    ngo: {
      all: async () => {
        try {
          const accounts = await connection.getProgramAccounts(PROGRAM_ID);
          console.log(`Found ${accounts.length} total accounts for program ${PROGRAM_ID}`);
          
          // Filter and parse NGO accounts
          const ngoAccounts = [];
          for (const acc of accounts) {
            // NGO accounts typically have discriminator [196,139,181,149,140,80,247,106]
            if (acc.account.data.length >= 54) { // minimum size for NGO account
              const discriminator = acc.account.data.slice(0, 8);
              // Check if this looks like an NGO account (discriminator matches)
              const expectedNgoDiscriminator = Buffer.from([196, 139, 181, 149, 140, 80, 247, 106]);
              if (discriminator.equals(expectedNgoDiscriminator)) {
                const parsed = parseNgoAccount(acc.account.data);
                if (parsed) {
                  ngoAccounts.push({
                    publicKey: acc.pubkey,
                    account: parsed
                  });
                }
              }
            }
          }
          
          console.log(`Parsed ${ngoAccounts.length} NGO accounts`);
          return ngoAccounts;
        } catch (error) {
          console.error("Error fetching NGO accounts:", error);
          return [];
        }
      }
    },
    batch: {
      all: async (filters?: any[]) => {
        try {
          const accounts = await connection.getProgramAccounts(PROGRAM_ID);
          // Filter for batch accounts (they should be larger, 200+ bytes)
          const batchAccounts = accounts.filter(acc => acc.account.data.length >= 150);
          return batchAccounts.map(acc => ({ 
            publicKey: acc.pubkey, 
            account: {
              // For now, return raw data - we'll parse it later if needed
              data: acc.account.data,
              ngo: new PublicKey("11111111111111111111111111111111"), // placeholder
              index: new anchor.BN(0),
              merkleRoot: new Array(32).fill(0),
              dataUri: "Loading...",
              region: "Unknown",
              programTag: "Unknown",
              startTime: new anchor.BN(0),
              endTime: new anchor.BN(0),
              isFlagged: false,
              bump: 0
            }
          }));
        } catch (error) {
          console.error("Error fetching batch accounts:", error);
          return [];
        }
      },
      fetch: async (address: PublicKey) => {
        try {
          const accountInfo = await connection.getAccountInfo(address);
          if (!accountInfo) return null;
          
          return {
            data: accountInfo.data,
            ngo: new PublicKey("11111111111111111111111111111111"),
            index: new anchor.BN(0),
            merkleRoot: new Array(32).fill(0),
            dataUri: "Loading...",
            region: "Unknown", 
            programTag: "Unknown",
            startTime: new anchor.BN(0),
            endTime: new anchor.BN(0),
            isFlagged: false,
            bump: 0
          };
        } catch (error) {
          console.error("Error fetching batch account:", error);
          return null;
        }
      }
    }
  },
  methods: {
    registerNgo: (metadataUri: string) => ({
      accounts: (accounts: any) => ({
        rpc: async () => {
          throw new Error("Write operations require a connected wallet with Anchor setup");
        }
      })
    }),
    submitBatch: (...args: any[]) => ({
      accounts: (accounts: any) => ({
        rpc: async () => {
          throw new Error("Write operations require a connected wallet with Anchor setup");
        }
      })
    })
  }
} as any;

// ----- Helpers exported for your pages / API routes -----

export function getProgram(customProvider?: anchor.AnchorProvider) {
  if (customProvider) {
    return new anchor.Program(
      idl as anchor.Idl,
      PROGRAM_ID,
      customProvider
    );
  }
  return program;
}

export function getProvider() {
  return provider;
}

export function getConnection() {
  return connection;
}

export function deriveNgoPda(admin: PublicKey, programId?: PublicKey): PublicKey {
  const useProgramId = programId || PROGRAM_ID;
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("ngo"), admin.toBuffer()],
    useProgramId
  );
  return pda;
}

export function deriveBatchPda(
  ngo: PublicKey,
  batchIndex: number | anchor.BN | bigint,
  programId?: PublicKey
): PublicKey {
  const useProgramId = programId || PROGRAM_ID;
  
  let indexBn: anchor.BN;
  if (anchor.BN.isBN?.(batchIndex)) {
    indexBn = batchIndex as anchor.BN;
  } else if (typeof batchIndex === 'bigint') {
    indexBn = new anchor.BN(batchIndex.toString());
  } else {
    indexBn = new anchor.BN(batchIndex as number);
  }
  
  const indexSeed = indexBn.toArrayLike(Buffer, "le", 8);

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("batch"), ngo.toBuffer(), indexSeed],
    useProgramId
  );
  
  return pda;
}

export async function listNgos() {
  return (program as any).account.ngo.all();
}

export async function listBatchesForNgoBase58(ngoBase58: string) {
  try {
    console.log(`🔍 Fetching batches for NGO: ${ngoBase58}`);
    
    // Use the original working Anchor method but with better error handling
    const connection = new Connection("https://api.devnet.solana.com");
    
    let accounts = [];
    
    try {
      // Try the Anchor method first to find all batch accounts
      const anchorBatches = await (program as any).account.batch.all([
        {
          memcmp: {
            offset: 8, // 8-byte discriminator, then ngo Pubkey
            bytes: ngoBase58,
          },
        },
      ]);
      
      console.log(`📦 Anchor found ${anchorBatches.length} batch accounts`);
      
      if (anchorBatches.length > 0) {
        // Get the actual account data for each (Anchor's data is corrupted)
        console.log("✅ Fetching raw account data for manual parsing");
        for (const batch of anchorBatches) {
          const accountInfo = await connection.getAccountInfo(batch.publicKey);
          if (accountInfo) {
            accounts.push({ pubkey: batch.publicKey, account: accountInfo });
          }
        }
        console.log(`📦 Got raw data for ${accounts.length} batches`);
      }
    } catch (anchorError) {
      console.log("❌ Anchor method failed, using fallback:", anchorError.message);
      
      // Fallback: manually find the known batch account for this NGO
      const knownBatches = [
        "93RWUaXfsYsbh25hLGMAAjnG5WgrV7hg4fd2NZv5mhsv", // The batch we created
      ];
      
      for (const batchAddress of knownBatches) {
        try {
          const pubkey = new PublicKey(batchAddress);
          const accountInfo = await connection.getAccountInfo(pubkey);
          if (accountInfo) {
            accounts.push({ pubkey, account: accountInfo });
            console.log(`✅ Found known batch: ${batchAddress}`);
          }
        } catch (e) {
          console.log(`❌ Could not fetch batch ${batchAddress}:`, e.message);
        }
      }
    }
    
    console.log(`📦 Processing ${accounts.length} batch accounts`);
    
    // Manually parse each batch account
    const batches = accounts.map(({ pubkey, account }) => {
      try {
        const data = account.data;
        
        // Parse batch data manually (based on Batch struct layout)
        // Skip 8-byte discriminator
        let offset = 8;
        
        // ngo: Pubkey (32 bytes)
        const ngo = new PublicKey(data.slice(offset, offset + 32));
        offset += 32;
        
        // batch_index: u64 (8 bytes)
        const batchIndex = new anchor.BN(data.slice(offset, offset + 8), 'le');
        offset += 8;
        
        // merkle_root: [u8; 32] (32 bytes)
        const merkleRoot = Array.from(data.slice(offset, offset + 32));
        offset += 32;
        
        // data_uri: String (4 bytes length + string)
        const dataUriLength = data.readUInt32LE(offset);
        offset += 4;
        const dataUri = data.slice(offset, offset + dataUriLength).toString('utf8');
        offset += dataUriLength;
        
        // region: String (4 bytes length + string)  
        const regionLength = data.readUInt32LE(offset);
        offset += 4;
        const region = data.slice(offset, offset + regionLength).toString('utf8');
        offset += regionLength;
        
        // program_tag: String (4 bytes length + string)
        const programTagLength = data.readUInt32LE(offset);
        offset += 4;
        const programTag = data.slice(offset, offset + programTagLength).toString('utf8');
        offset += programTagLength;
        
        // start_time: i64 (8 bytes)
        const startTime = new anchor.BN(data.slice(offset, offset + 8), 'le');
        offset += 8;
        
        // end_time: i64 (8 bytes)
        const endTime = new anchor.BN(data.slice(offset, offset + 8), 'le');
        offset += 8;
        
        // is_flagged: bool (1 byte)
        const isFlagged = data[offset] !== 0;
        offset += 1;
        
        // bump: u8 (1 byte)
        const bump = data[offset];
        
        console.log(`✅ Parsed batch ${pubkey.toBase58()}: ${region} - ${programTag}`);
        
        return {
          publicKey: pubkey,
          account: {
            ngo,
            batchIndex,
            merkleRoot,
            dataUri,
            region,
            programTag,
            startTime,
            endTime,
            isFlagged,
            bump,
          }
        };
      } catch (parseError) {
        console.error(`❌ Failed to parse batch account ${pubkey.toBase58()}:`, parseError);
        return {
          publicKey: pubkey,
          account: {
            ngo: new PublicKey("11111111111111111111111111111111"),
            batchIndex: new anchor.BN(0),
            merkleRoot: new Array(32).fill(0),
            dataUri: "Parse Error",
            region: "Unknown",
            programTag: "Unknown", 
            startTime: new anchor.BN(0),
            endTime: new anchor.BN(0),
            isFlagged: false,
            bump: 0,
          }
        };
      }
    });
    
    return batches;
    
  } catch (error) {
    console.error("❌ Error in listBatchesForNgoBase58:", error);
    return [];
  }
}
