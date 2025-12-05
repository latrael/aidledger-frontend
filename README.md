# AidLedger Frontend - Web Application

[![Next.js](https://img.shields.io/badge/Next.js-16.0.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Solana](https://img.shields.io/badge/Solana-Web3.js-9945FF?style=for-the-badge&logo=solana)](https://solana.com/)

**AidLedger Frontend** is a modern web application that provides an intuitive interface for managing NGO registrations, aid distribution batches, and blockchain wallet operations on the Solana network. This frontend connects to the AidLedger smart contracts to enable transparent, verifiable humanitarian aid tracking.

> **Note**: This is the **web application frontend**. For the smart contract backend, see [aidledger-dev](../aidledger-dev).

## 📑 Table of Contents

- [🌟 Features Overview](#-features-overview)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏗️ Application Architecture](#️-application-architecture)
- [🚀 Quick Start](#-quick-start)
- [🗺️ Application Routes & Workflow](#️-application-routes--workflow)
  - [🏠 Landing Page (/)](#-landing-page-)
  - [💼 Wallet Manager (/wallet)](#-wallet-manager-wallet)
  - [🏢 NGO Directory (/ngo)](#-ngo-directory-ngo)
  - [📦 Batch Management (/batches)](#-batch-management-batches)
  - [👨‍💼 Admin Dashboard (/admin)](#-admin-dashboard-admin)
- [🔧 API Routes Documentation](#-api-routes-documentation)
- [🧪 Testing the Complete Workflow](#-testing-the-complete-workflow)
- [🔒 Security & Best Practices](#-security--best-practices)
- [🚀 Deployment](#-deployment)
- [🛠️ Development Tools](#️-development-tools)
- [🤝 Integration Points](#-integration-points)
- [📊 Performance Metrics](#-performance-metrics)
- [🛣️ Roadmap](#️-roadmap)
- [📄 License](#-license)
- [🤝 Contributing](#-contributing)
- [📞 Support & Resources](#-support--resources)

## 🌟 Features Overview

### 🏠 **Dashboard & Analytics**
- Real-time statistics for wallets, NGOs, and batches
- Clean, professional interface with live data updates
- Quick navigation to all platform features

### 💼 **Wallet Management System**
- Create and manage multiple Solana wallets
- Automated SOL airdrop for devnet testing  
- Wallet balance monitoring and funding
- Secure keypair generation and storage

### 🏢 **NGO Registration & Management**
- Register new NGOs with IPFS metadata storage
- Upload rich metadata (name, description, website, contact info)
- Automated Pinata IPFS integration
- View all registered NGOs with detailed information

### 📦 **Batch Submission & Tracking**
- Submit aid distribution batches with comprehensive data
- Upload batch files to IPFS with automatic pinning
- Track batches by region, program, and time periods
- Associate batches with specific NGO wallets

### 👨‍💼 **Admin Dashboard**
- Comprehensive view of all NGOs and their batches
- Filter and search functionality
- Batch data verification and audit trails
- Real-time blockchain data synchronization

## 🛠️ Technology Stack

### Core Framework
- **[Next.js 16.0.6](https://nextjs.org/)**: React framework with App Router
- **[React 19.2.0](https://reactjs.org/)**: Component-based UI library
- **[TypeScript 5.0](https://www.typescriptlang.org/)**: Type-safe JavaScript

### Blockchain Integration
- **[@solana/web3.js](https://solana-labs.github.io/solana-web3.js/)**: Solana JavaScript SDK
- **[@coral-xyz/anchor](https://www.anchor-lang.com/)**: Solana program interaction framework
- **Custom IDL Patching**: Handles Anchor version compatibility issues

### Styling & UI
- **[Tailwind CSS 4.0](https://tailwindcss.com/)**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach with modern UI components
- **Custom Components**: Reusable interface elements

### Data Management
- **[IPFS](https://ipfs.io/)**: Decentralized file storage
- **[Pinata](https://pinata.cloud/)**: IPFS pinning service integration
- **Local Storage**: Client-side wallet and preference management

## 🏗️ Application Architecture

```
aidledger-frontend/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Landing page with statistics
│   ├── layout.tsx               # Root layout component
│   ├── globals.css              # Global styles
│   │
│   ├── wallet/                  # Wallet Management
│   │   └── page.tsx            # Wallet creation, funding, NGO registration
│   │
│   ├── ngo/                    # NGO Management  
│   │   └── page.tsx            # NGO listing and detailed views
│   │
│   ├── batches/                # Batch Management
│   │   └── page.tsx            # Batch submission and tracking
│   │
│   ├── admin/                  # Admin Dashboard
│   │   └── page.tsx            # Comprehensive NGO and batch overview
│   │
│   └── api/                    # API Routes
│       ├── wallet/             # Wallet operations
│       ├── ngos/              # NGO queries  
│       ├── batches/           # Batch operations
│       ├── register-ngo/      # NGO registration
│       ├── submit-batch/      # Batch submission
│       └── pinata/            # IPFS integration
│
├── lib/                        # Utility Libraries
│   ├── aidledgerClient.ts     # Solana program interaction
│   └── walletManager.ts       # Wallet management utilities
│
├── idl/                       # Interface Definition Language
│   └── aidledger.json        # Smart contract interface
│
└── public/                    # Static Assets
    └── favicon.ico
```

## 🚀 Quick Start

### Prerequisites

```bash
# Node.js 18+ required
node --version

# Install dependencies
npm install
# or
yarn install
```

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Pinata IPFS Configuration
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key

# Solana Configuration  
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_AIDLEDGER_PROGRAM_ID=4wcEn4cPenW3GM1eYfNoAHsmnN1SPNLnLqSCtBruaobD
```

### Development Server

```bash
# Start the development server
npm run dev
# or
yarn dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🗺️ Application Routes & Workflow

### 🏠 **Landing Page** (`/`)

**Route**: `http://localhost:3000/`

**Purpose**: Welcome dashboard with platform statistics and navigation

**Features**:
- Real-time statistics (wallet count, NGO count, batch count)
- Quick navigation cards to main features
- Professional branding and overview
- Live data updates from blockchain

**Workflow**:
1. View platform statistics
2. Click navigation cards to access features
3. Get oriented with platform capabilities

---

### 💼 **Wallet Manager** (`/wallet`)

**Route**: `http://localhost:3000/wallet`

**Purpose**: Create, manage, and fund Solana wallets for NGO operations

**Features**:
- **Wallet Creation**: Generate new Solana keypairs
- **Wallet Listing**: View all available wallets with balances
- **SOL Funding**: Automated devnet airdrop functionality
- **NGO Registration**: Direct registration from wallet interface
- **IPFS Integration**: Upload metadata with Pinata integration

**Complete Workflow**:

1. **Create a New Wallet**:
   ```
   Click "Create New Wallet" → Enter wallet name → Wallet generated with keypair
   ```

2. **Fund the Wallet**:
   ```
   Click "💰 Airdrop SOL" → Automated request to Solana devnet faucet
   ```

3. **Register NGO**:
   ```
   Fill out NGO form:
   - NGO Name: "Kenya Relief Foundation"
   - Description: "Providing clean water and education in rural Kenya"
   - Website: "https://kenyarelief.org"
   - Contact Email: "info@kenyarelief.org"
   - Region: "Kenya"
   
   → Click "Upload to IPFS" → Metadata uploaded to Pinata
   → Click "Register NGO" → On-chain registration
   ```

4. **View Registration Results**:
   ```
   Success message shows:
   - Transaction hash
   - NGO PDA address
   - IPFS metadata link
   ```

---

### 🏢 **NGO Directory** (`/ngo`)

**Route**: `http://localhost:3000/ngo`

**Purpose**: Browse and view detailed information about registered NGOs

**Features**:
- **NGO Listing**: Grid view of all registered NGOs
- **Detailed Views**: Click to see full NGO information
- **IPFS Metadata**: Automatic loading of metadata from IPFS
- **Search & Filter**: Find specific NGOs
- **Blockchain Verification**: On-chain data validation

**Workflow**:

1. **Browse NGOs**:
   ```
   View grid of NGO cards → Each shows name, region, and status
   ```

2. **View NGO Details**:
   ```
   Click NGO card → See complete information:
   - Full description and mission
   - Website and contact information
   - Registration date and blockchain data
   - Associated wallet address
   - IPFS metadata link
   ```

3. **Verify Information**:
   ```
   All data is pulled from blockchain → IPFS metadata automatically loaded
   ```

---

### 📦 **Batch Management** (`/batches`)

**Route**: `http://localhost:3000/batches`

**Purpose**: Submit and track aid distribution batches

**Features**:
- **Wallet Selection**: Choose which NGO wallet to use
- **File Upload**: Upload batch data files to IPFS
- **Metadata Forms**: Rich forms for batch information
- **Blockchain Submission**: Direct on-chain batch recording
- **Progress Tracking**: Real-time submission status

**Complete Workflow**:

1. **Select NGO Wallet**:
   ```
   Dropdown shows all wallets with registered NGOs → Select target wallet
   ```

2. **Upload Batch File**:
   ```
   Click "Choose File" → Select CSV/JSON with beneficiary data
   → File automatically uploaded to IPFS via Pinata
   → IPFS hash returned for blockchain storage
   ```

3. **Fill Batch Details**:
   ```
   Form fields:
   - Region: "Northern Kenya"
   - Program Tag: "WaterWells-Q1-2024"
   - Start Date: "2024-01-01"
   - End Date: "2024-03-31"
   - Description: "Water well installations in drought-affected areas"
   ```

4. **Submit to Blockchain**:
   ```
   Click "Submit Batch" → Transaction sent to Solana
   → Batch recorded with:
     - Sequential batch index
     - IPFS data URI
     - Program metadata
     - Time period
     - Merkle root for verification
   ```

5. **View Results**:
   ```
   Success shows:
   - Transaction signature
   - Batch PDA address  
   - IPFS data link
   - Confirmation of on-chain storage
   ```

---

### 👨‍💼 **Admin Dashboard** (`/admin`)

**Route**: `http://localhost:3000/admin`

**Purpose**: Comprehensive overview of all NGOs and their submitted batches

**Features**:
- **NGO Overview**: Complete list with registration details
- **Batch Tracking**: All batches across all NGOs
- **Data Verification**: Real-time blockchain data parsing
- **Search & Filter**: Find specific records
- **Audit Trail**: Complete transaction history

**Workflow**:

1. **View NGO Summary**:
   ```
   Table shows all registered NGOs:
   - NGO name and wallet address
   - Registration date
   - Total batches submitted
   - Current status (active/inactive)
   ```

2. **Review Batch Data**:
   ```
   Comprehensive batch table:
   - NGO association
   - Batch index and region
   - Program tag and time period
   - IPFS data links
   - Transaction signatures
   - Submission timestamps
   ```

3. **Verify Data Integrity**:
   ```
   All data pulled directly from blockchain:
   - No intermediary databases
   - Real-time parsing of account data
   - IPFS metadata resolution
   - Cryptographic verification
   ```

4. **Audit Operations**:
   ```
   Click transaction links → View on Solana explorer
   Click IPFS links → View raw metadata/data files
   Verify merkle roots → Batch data integrity confirmation
   ```

---

## 🔧 API Routes Documentation

### Wallet Operations

#### `GET /api/wallet`
```typescript
// List all available wallets
Response: { 
  ok: true, 
  wallets: WalletInfo[], 
  count: number 
}
```

#### `POST /api/wallet`
```typescript
// Create new wallet
Body: { name: string }
Response: { 
  ok: true, 
  wallet: WalletInfo, 
  airdropResult: AirdropStatus 
}
```

#### `POST /api/wallet/airdrop`
```typescript  
// Request SOL airdrop
Body: { address: string, amount?: number }
Response: { 
  ok: true, 
  signature: string, 
  balance: number 
}
```

### NGO Operations

#### `GET /api/ngos`
```typescript
// List all registered NGOs
Response: { 
  ok: true, 
  ngos: NGOAccount[] 
}
```

#### `POST /api/register-ngo`
```typescript
// Register new NGO
Body: { 
  metadataUri: string, 
  selectedWallet: string 
}
Response: { 
  ok: true, 
  tx: string, 
  ngoPda: string 
}
```

### Batch Operations

#### `GET /api/batches`
```typescript
// Get batches for specific NGO
Query: { ngo: string }
Response: { 
  ok: true, 
  batches: BatchAccount[] 
}
```

#### `POST /api/submit-batch`
```typescript
// Submit new batch
Body: { 
  ngoPda: string,
  dataUri: string,
  region: string,
  programTag: string,
  startTime: string,
  endTime: string,
  selectedWallet: string 
}
Response: { 
  ok: true, 
  tx: string, 
  batchPda: string 
}
```

### IPFS Operations

#### `POST /api/pinata/upload-file`
```typescript
// Upload file to IPFS
Body: FormData with file
Response: { 
  ok: true, 
  ipfsHash: string, 
  url: string 
}
```

#### `POST /api/pinata/upload-json`
```typescript
// Upload JSON metadata to IPFS  
Body: { data: object }
Response: { 
  ok: true, 
  ipfsHash: string, 
  url: string 
}
```

## 🧪 Testing the Complete Workflow

### End-to-End Demo Scenario

**Scenario**: Register a new NGO and submit an aid distribution batch

#### Step 1: Initial Setup
```bash
# Start the application
npm run dev

# Navigate to http://localhost:3000
# Verify landing page statistics
```

#### Step 2: Create & Fund Wallet
```
1. Go to /wallet
2. Click "Create New Wallet"
3. Name: "demo-ngo-wallet"
4. Click "💰 Airdrop SOL" (wait for devnet funding)
5. Verify wallet shows ~2 SOL balance
```

#### Step 3: Register NGO
```
1. Fill NGO registration form:
   - Name: "Global Aid Initiative"
   - Description: "Providing emergency relief worldwide"
   - Website: "https://globalaid.org"
   - Email: "contact@globalaid.org"
   - Region: "Global"

2. Click "Upload to IPFS" → Wait for IPFS hash
3. Click "Register NGO" → Wait for blockchain confirmation
4. Note transaction hash and NGO PDA address
```

#### Step 4: Verify NGO Registration
```
1. Go to /ngo
2. Find "Global Aid Initiative" in the list
3. Click to view detailed information
4. Verify all metadata loaded correctly
```

#### Step 5: Submit Aid Batch
```
1. Go to /batches  
2. Select "demo-ngo-wallet" from dropdown
3. Upload a sample CSV file with beneficiary data
4. Fill batch information:
   - Region: "Somalia"
   - Program: "EmergencyRelief-2024"
   - Start Date: Current date
   - End Date: 30 days from now
5. Click "Submit Batch" → Wait for confirmation
```

#### Step 6: Verify in Admin Dashboard
```
1. Go to /admin
2. Find your NGO in the NGOs table
3. Find your batch in the Batches table
4. Verify all data displays correctly
5. Click IPFS links to view uploaded content
```

#### Step 7: Blockchain Verification
```
1. Copy transaction hashes from responses
2. Visit https://explorer.solana.com/?cluster=devnet
3. Paste transaction hash to verify on-chain data
4. Confirm account creation and data storage
```

## 🔒 Security & Best Practices

### Wallet Security
- Private keys stored locally only
- No server-side key storage
- Secure random generation using Solana SDK
- Environment variable protection for API keys

### Data Integrity  
- All critical data stored on blockchain
- IPFS content addressing prevents tampering
- Merkle roots provide cryptographic verification
- Real-time blockchain data parsing

### API Security
- Server-side validation of all inputs
- Rate limiting on sensitive endpoints
- Error handling prevents information leakage
- IPFS integration sandboxed

## 🚀 Deployment

### Environment Variables
```env
# Required for production
PINATA_API_KEY=production_api_key
PINATA_SECRET_API_KEY=production_secret_key
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_AIDLEDGER_PROGRAM_ID=mainnet_program_id
```

### Production Build
```bash
# Build optimized production version
npm run build

# Start production server
npm start

# Or deploy to Vercel
vercel deploy
```

### Performance Optimization
- Next.js automatic code splitting
- Image optimization for IPFS content
- API route caching for blockchain data
- Client-side state management

## 🛠️ Development Tools

### Debugging
```bash
# Enable debug logging
DEBUG=aidledger:* npm run dev

# View network requests
# Open browser DevTools → Network tab

# Inspect Solana transactions  
# Use Solana Explorer with transaction hashes
```

### Code Quality
```bash
# Run TypeScript checks
npm run type-check

# Run ESLint
npm run lint

# Format with Prettier  
npm run format
```

## 🤝 Integration Points

### Backend Smart Contract
- Connects to deployed Solana program at `4wcEn4cPenW3GM1eYfNoAHsmnN1SPNLnLqSCtBruaobD`
- Uses generated IDL for type-safe interactions
- Handles account parsing and transaction signing

### IPFS Network
- Pinata service for reliable IPFS pinning
- Automatic metadata and file uploads
- Content addressing for data integrity
- Gateway access for decentralized retrieval

### Solana Devnet
- All transactions occur on Solana devnet
- Automatic wallet funding via faucet
- Explorer integration for transaction verification
- Real-time account data synchronization

## 📊 Performance Metrics

### Load Times
- Landing page: <2s initial load
- Wallet operations: <1s local actions
- Blockchain transactions: 2-5s confirmation
- IPFS uploads: 3-10s depending on file size

### User Experience
- Mobile-responsive design
- Progressive loading states
- Error handling with user feedback
- Offline-capable wallet management

## 🛣️ Roadmap

### Phase 1: Core Features ✅
- [x] Wallet management system
- [x] NGO registration workflow  
- [x] Batch submission interface
- [x] Admin dashboard
- [x] IPFS integration

### Phase 2: Enhanced UX 🚧
- [ ] Real-time notifications
- [ ] Advanced search and filtering
- [ ] Data visualization dashboards
- [ ] Mobile app companion

### Phase 3: Enterprise Features 🔮
- [ ] Multi-signature wallet support
- [ ] Role-based access control
- [ ] API documentation portal
- [ ] White-label deployment options

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Development setup and workflow
- Code style and standards  
- Testing requirements
- Pull request process

## 📞 Support & Resources

- **Issues**: [GitHub Issues](https://github.com/yourusername/aidledger-frontend/issues)
- **Documentation**: [Project Wiki](https://github.com/yourusername/aidledger-frontend/wiki)
- **Community**: [Discord Channel](https://discord.gg/aidledger)
- **Smart Contract**: [aidledger-dev repository](../aidledger-dev)

---

**Building transparent humanitarian aid distribution with modern web technologies** 🌍✨
