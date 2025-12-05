"use client";

import { useState, useEffect } from "react";

interface WalletInfo {
  name: string;
  path: string;
  publicKey: string;
  exists: boolean;
  balance?: number;
}

interface WalletResponse {
  ok: boolean;
  wallets: WalletInfo[];
  currentWallet: WalletInfo | null;
  count: number;
  error?: string;
}

export default function WalletManagerPage() {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [currentWallet, setCurrentWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [metadataUri, setMetadataUri] = useState("");
  
  // NGO metadata form fields
  const [ngoName, setNgoName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [region, setRegion] = useState("");
  
  // Pinata upload state
  const [pinStatus, setPinStatus] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  const loadWallets = async () => {
    try {
      const res = await fetch("/api/wallet");
      const data: WalletResponse = await res.json();
      if (data.ok) {
        // Load balances for each wallet
        const walletsWithBalances = await Promise.all(
          data.wallets.map(async (wallet) => {
            try {
              const balanceRes = await fetch(`https://api.devnet.solana.com`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: 1,
                  method: 'getBalance',
                  params: [wallet.publicKey]
                })
              });
              const balanceData = await balanceRes.json();
              const lamports = balanceData.result?.value || 0;
              return { ...wallet, balance: lamports / 1000000000 }; // Convert to SOL
            } catch {
              return { ...wallet, balance: 0 };
            }
          })
        );
        setWallets(walletsWithBalances);
        setCurrentWallet(data.currentWallet);
      }
    } catch (error) {
      console.error("Failed to load wallets:", error);
    }
  };

  const airdropToWallet = async (walletName: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/airdrop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletName })
      });
      
      const data = await res.json();
      if (data.ok) {
        alert(`Airdrop successful! 2 SOL sent to ${walletName}`);
        loadWallets(); // Refresh balances
      } else {
        alert(`Airdrop failed: ${data.error}`);
      }
    } catch (error) {
      alert(`Airdrop failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const createWallet = async () => {
    if (!newWalletName.trim()) {
      alert("Please enter a wallet name");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: newWalletName.trim() })
      });
      
      const data = await res.json();
      if (data.ok) {
        alert(`Wallet created! Public Key: ${data.wallet.publicKey}`);
        setNewWalletName("");
        loadWallets();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Failed to create wallet: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Upload NGO metadata to Pinata and get an ipfs:// URI
  const handlePinNgoMetadata = async () => {
    setPinLoading(true);
    setPinStatus(null);

    try {
      // Basic required fields check
      if (!ngoName || !description || !region) {
        setPinStatus(
          "Please fill in at least Name, Description, and Region before pinning."
        );
        setPinLoading(false);
        return;
      }

      const content = {
        name: ngoName,
        description,
        website: website || null,
        contactEmail: contactEmail || null,
        region,
        createdAt: new Date().toISOString(),
      };

      const res = await fetch("/api/pinata/upload-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `aidledger-ngo-${ngoName || "unnamed"}`,
          content,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setMetadataUri(data.uri);
        setPinStatus(`Pinned NGO metadata to IPFS: ${data.uri}`);
      } else {
        setPinStatus(`Pin failed: ${data.error ?? "Unknown error"}`);
      }
    } catch (e) {
      setPinStatus(`Pin failed: ${String(e)}`);
    } finally {
      setPinLoading(false);
    }
  };

  const registerNgo = async () => {
    if (!selectedWallet) {
      alert("Please select a wallet");
      return;
    }
    if (!metadataUri.trim()) {
      alert("Please enter metadata URI or create one using the form above");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register-ngo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          metadataUri: metadataUri.trim(),
          walletName: selectedWallet 
        })
      });
      
      const data = await res.json();
      if (data.ok) {
        alert(`NGO registered successfully!\nTransaction: ${data.tx}\nNGO PDA: ${data.ngoPda}`);
        // Clear form after successful registration
        setMetadataUri("");
        setNgoName("");
        setDescription("");
        setWebsite("");
        setContactEmail("");
        setRegion("");
        setPinStatus(null);
        // Refresh wallet list to update any changes
        loadWallets();
      } else {
        // Show detailed error information
        let errorMessage = `Registration failed: ${data.error}`;
        if (data.details) {
          errorMessage += `\n\nDetails: ${data.details}`;
        }
        if (data.suggestion) {
          errorMessage += `\n\nSuggestion: ${data.suggestion}`;
        }
        
        // For insufficient funds, offer to try airdrop
        if (data.errorType === 'insufficient_funds' && selectedWallet) {
          const tryAirdrop = confirm(`${errorMessage}\n\nWould you like to try airdropping SOL to this wallet now?`);
          if (tryAirdrop) {
            airdropToWallet(selectedWallet);
          }
        } else {
          alert(errorMessage);
        }
      }
    } catch (error) {
      alert(`Failed to register NGO: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Wallet Manager</h1>
        <p className="text-gray-600">
          Create and manage Solana wallets for NGO registration demo.
        </p>
      </div>

      {/* Create New Wallet */}
      <section className="border rounded-lg p-6 bg-white">
        <h2 className="text-xl font-semibold mb-4">Create New Wallet</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Wallet Name</label>
            <input
              type="text"
              value={newWalletName}
              onChange={(e) => setNewWalletName(e.target.value)}
              placeholder="e.g., demo-2024, live-presentation"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <button
            onClick={createWallet}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Wallet"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Use descriptive names like "demo-2024" or "presentation-live"
        </p>
      </section>

      {/* Existing Wallets */}
      <section className="border rounded-lg p-6 bg-white">
        <h2 className="text-xl font-semibold mb-4">Available Wallets ({wallets.length})</h2>
        {wallets.length === 0 ? (
          <p className="text-gray-500">No wallets found. Create one above!</p>
        ) : (
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <div key={wallet.name} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{wallet.name}</div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      (wallet.balance || 0) > 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {wallet.balance?.toFixed(2) || '0.00'} SOL
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">{wallet.publicKey}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  {(wallet.balance || 0) < 0.1 && (
                    <button
                      onClick={() => airdropToWallet(wallet.name)}
                      disabled={loading}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      💰 Airdrop SOL
                    </button>
                  )}
                  {currentWallet?.publicKey === wallet.publicKey && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Current CLI
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Register NGO */}
      <section className="border rounded-lg p-6 bg-white">
        <h2 className="text-xl font-semibold mb-4">Register NGO</h2>
        <div className="space-y-6">
          {/* Wallet Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Wallet</label>
            <select
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Choose a wallet...</option>
              {wallets.map((wallet) => (
                <option key={wallet.name} value={wallet.name}>
                  {wallet.name} ({wallet.publicKey.slice(0, 8)}...)
                </option>
              ))}
            </select>
          </div>

          {/* NGO Metadata Form */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3">NGO Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">NGO Name *</label>
                <input
                  type="text"
                  value={ngoName}
                  onChange={(e) => setNgoName(e.target.value)}
                  placeholder="e.g. Umoja Relief Fund"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this NGO does."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.org"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@example.org"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Primary Region *</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Kenya, East Africa"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Metadata URI Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3">Metadata URI (IPFS)</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={metadataUri}
                onChange={(e) => setMetadataUri(e.target.value)}
                placeholder="ipfs://cid-of-ngo-metadata"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePinNgoMetadata}
                  disabled={pinLoading}
                  className="px-3 py-2 rounded bg-gray-800 text-white text-sm disabled:opacity-50 hover:bg-gray-700"
                >
                  {pinLoading ? "Pinning..." : "📌 Pin NGO metadata to IPFS"}
                </button>
                {pinStatus && (
                  <span className="text-sm text-gray-600">
                    {pinStatus}
                  </span>
                )}
              </div>
              
              <p className="text-xs text-gray-500">
                💡 Fill in the NGO information above and click "Pin NGO metadata to IPFS" to automatically create and upload the metadata, 
                or paste an existing <code className="font-mono bg-gray-100 px-1 rounded">ipfs://</code> URI.
              </p>
            </div>
          </div>
          
          {/* Register Button */}
          <button
            onClick={registerNgo}
            disabled={loading || !selectedWallet || !metadataUri}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registering NGO..." : "🚀 Register NGO on Solana"}
          </button>
        </div>
      </section>

      {/* Quick Demo Setup */}
      <section className="border rounded-lg p-6 bg-blue-50">
        <h2 className="text-xl font-semibold mb-4">🎯 Quick Demo Setup</h2>
        <div className="space-y-2 text-sm">
          <p><strong>For live demos:</strong></p>
          <ol className="list-decimal ml-6 space-y-1">
            <li>Create a wallet named "live-demo-{new Date().getFullYear()}"</li>
            <li>Use metadata URI like "ipfs://live-demo-ngo-{Date.now()}"</li>
            <li>Register the NGO</li>
            <li>Visit <a href="/admin" className="text-blue-600 underline">/admin</a> to see it appear</li>
          </ol>
          <p className="text-gray-600 mt-2">
            💡 Each wallet can only register one NGO, so create new wallets for multiple demos.
          </p>
        </div>
      </section>
    </main>
  );
}