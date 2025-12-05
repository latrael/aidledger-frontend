#!/usr/bin/env node

// scripts/demo-helper.js - Easy demo wallet management
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const WALLET_DIR = path.join(os.homedir(), '.config/solana');

function createWallet(name) {
  console.log(`🔑 Creating wallet: ${name}`);
  
  const walletPath = path.join(WALLET_DIR, `${name}.json`);
  
  if (fs.existsSync(walletPath)) {
    console.log(`❌ Wallet ${name} already exists!`);
    return false;
  }

  try {
    execSync(`solana-keygen new --outfile "${walletPath}" --no-bip39-passphrase`, { stdio: 'inherit' });
    
    // Switch to this wallet
    execSync(`solana config set --keypair "${walletPath}"`, { stdio: 'inherit' });
    
    // Airdrop SOL for transactions
    console.log(`💰 Airdropping SOL to new wallet...`);
    execSync(`solana airdrop 2`, { stdio: 'inherit' });
    
    console.log(`✅ Wallet ${name} created and configured!`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create wallet: ${error.message}`);
    return false;
  }
}

function listWallets() {
  console.log(`📋 Available wallets:`);
  
  if (!fs.existsSync(WALLET_DIR)) {
    console.log(`No wallets found.`);
    return;
  }
  
  const files = fs.readdirSync(WALLET_DIR);
  const wallets = files.filter(f => f.endsWith('.json') && f !== 'cli');
  
  if (wallets.length === 0) {
    console.log(`No wallets found.`);
    return;
  }
  
  wallets.forEach(wallet => {
    const name = wallet.replace('.json', '');
    console.log(`  • ${name}`);
  });
}

function quickDemo(demoName) {
  const timestamp = Date.now();
  const walletName = demoName || `demo-${timestamp}`;
  
  console.log(`🚀 Setting up quick demo with wallet: ${walletName}`);
  
  if (createWallet(walletName)) {
    const metadataUri = `ipfs://demo-ngo-${timestamp}`;
    
    console.log(`📝 You can now register an NGO with:`);
    console.log(`   Wallet: ${walletName}`);
    console.log(`   Metadata URI: ${metadataUri}`);
    console.log(``);
    console.log(`🌐 Visit http://localhost:3000/wallet to register via UI`);
    console.log(`📊 Visit http://localhost:3000/admin to see results`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'create':
    const name = args[1];
    if (!name) {
      console.log(`Usage: node demo-helper.js create <wallet-name>`);
      process.exit(1);
    }
    createWallet(name);
    break;
    
  case 'list':
    listWallets();
    break;
    
  case 'quick':
    const demoName = args[1];
    quickDemo(demoName);
    break;
    
  default:
    console.log(`Demo Helper - Easy wallet management for NGO demos`);
    console.log(``);
    console.log(`Usage:`);
    console.log(`  node demo-helper.js create <name>    - Create a new wallet`);
    console.log(`  node demo-helper.js list             - List all wallets`);
    console.log(`  node demo-helper.js quick [name]     - Quick demo setup`);
    console.log(``);
    console.log(`Examples:`);
    console.log(`  node demo-helper.js create presentation-2024`);
    console.log(`  node demo-helper.js quick live-demo`);
    console.log(`  node demo-helper.js list`);
}