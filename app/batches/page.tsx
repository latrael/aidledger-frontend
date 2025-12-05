// app/batches/page.tsx
"use client";

import { useState } from "react";

interface ApiResult {
  ok: boolean;
  tx?: string;
  ngoPda?: string;
  batchPda?: string;
  batchAccount?: any;
  error?: string;
}

import { useEffect } from "react";

interface WalletInfo {
  name: string;
  path: string;
  publicKey: string;
  exists: boolean;
}

interface NgoInfo {
  pubkey: string;
  account: {
    admin: string;
    metadataUri: string;
    isActive: boolean;
    createdAt: number;
  };
}

export default function BatchesPage() {
  const [batchIndex, setBatchIndex] = useState(0);
  const [dataUri, setDataUri] = useState("ipfs://aidledger-demo-batch");
  const [region, setRegion] = useState("Kenya");
  const [programTag, setProgramTag] = useState("CashTransfers-Jan");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pinStatus, setPinStatus] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [r1ReceiptUrl, setR1ReceiptUrl] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [r1Wallet, setR1Wallet] = useState("");
  const [r1Amount, setR1Amount] = useState<number | "">("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  
  // Wallet and NGO selection
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [ngos, setNgos] = useState<NgoInfo[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [selectedNgo, setSelectedNgo] = useState<string>("");

  // Load wallets and NGOs
  useEffect(() => {
    const loadWalletsAndNgos = async () => {
      try {
        // Load wallets
        const walletsRes = await fetch("/api/wallet");
        const walletsData = await walletsRes.json();
        if (walletsData.ok) {
          setWallets(walletsData.wallets);
        }

        // Load NGOs
        const ngosRes = await fetch("/api/ngos");
        const ngosData = await ngosRes.json();
        if (ngosData.ok) {
          setNgos(ngosData.ngos);
        }
      } catch (error) {
        console.error("Failed to load wallets/NGOs:", error);
      }
    };

    loadWalletsAndNgos();
  }, []);

  // Filter NGOs for selected wallet
  const availableNgos = selectedWallet 
    ? ngos.filter(ngo => {
        const wallet = wallets.find(w => w.name === selectedWallet);
        return wallet && ngo.account.admin === wallet.publicKey;
      })
    : [];


    const handlePinBatchData = async () => {
      setPinLoading(true);
      setPinStatus(null);

      try {
        // basic validation: at least one recipient
        const recipients: any[] = [];
        if (r1Wallet && r1Amount !== "") {
          recipients.push({
            wallet: r1Wallet,
            amount: Number(r1Amount),
            receiptUrl: r1ReceiptUrl || null,
          });
        }
        if (recipients.length === 0) {
          setPinStatus("Please fill at least one recipient before pinning.");
          setPinLoading(false);
          return;
        }

        const content = {
          description: description || null,
          region,
          programTag,
          currency,
          recipients,
          createdAt: new Date().toISOString(),
        };

        const res = await fetch("/api/pinata/upload-json", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `aidledger-batch-${programTag || "demo"}`,
            content,
          }),
        });

        const data = await res.json();
        if (data.ok) {
          setDataUri(data.uri);
          setPinStatus(`Pinned batch data to IPFS: ${data.uri}`);
        } else {
          setPinStatus(`Pin failed: ${data.error ?? "Unknown error"}`);
        }
      } catch (e) {
        setPinStatus(`Pin failed: ${String(e)}`);
      } finally {
        setPinLoading(false);
      }
    };



    const uploadReceiptFile = async (file: File): Promise<string | null> => {
      setUploadLoading(true);
      setUploadStatus(null);
      try {
        const formData = new FormData();
        formData.append("file", file); // field name MUST be "file"

        const res = await fetch("/api/pinata/upload-file", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.ok) {
          setUploadStatus(`Uploaded receipt to IPFS: ${data.uri}`);
          return data.uri as string;
        } else {
          setUploadStatus(`Upload failed: ${data.error ?? "Unknown error"}`);
          return null;
        }
      } catch (e) {
        setUploadStatus(`Upload failed: ${String(e)}`);
        return null;
      } finally {
        setUploadLoading(false);
      }
    };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWallet || !selectedNgo) {
      setResult({ ok: false, error: "Please select a wallet and NGO" });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/submit-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchIndex,
          dataUri,
          region,
          programTag,
          walletName: selectedWallet,
          ngoPda: selectedNgo,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ ok: false, error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold">Submit Aid Batch</h1>
        <p className="text-sm text-gray-600">
          Each batch represents a{" "}
          <span className="font-medium">distribution round</span> for a
          program (e.g., cash transfers in a region over a time window).
          On-chain we store:
        </p>
        <ul className="text-sm text-gray-600 list-disc list-inside">
          <li>a Merkle root committing to recipients and amounts</li>
          <li>region and program tag</li>
          <li>start/end time window</li>
          <li>a link to detailed data (CSV or JSON) on IPFS</li>
        </ul>
        <p className="text-xs text-gray-500">
          Right now the Merkle root is a placeholder; later we&apos;ll compute it
          from real recipient data.
        </p>
      </section>

      <section className="border rounded-lg p-4 bg-emerald-50 text-xs text-emerald-900">
        <p className="font-semibold mb-1">What happens on-chain?</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Derive a batch PDA from NGO + batch index.</li>
          <li>Write metadata (region, tag, URI, timestamps).</li>
          <li>Emit a <code>BatchSubmitted</code> event for indexing.</li>
        </ul>
      </section>

            <form onSubmit={handleSubmit} className="space-y-4">
        {/* Wallet and NGO Selection */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">Select Wallet</label>
            <select
              value={selectedWallet}
              onChange={(e) => {
                setSelectedWallet(e.target.value);
                setSelectedNgo(""); // Reset NGO selection when wallet changes
              }}
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
          
          <div>
            <label className="block text-sm font-medium mb-2">Select NGO</label>
            <select
              value={selectedNgo}
              onChange={(e) => setSelectedNgo(e.target.value)}
              disabled={!selectedWallet}
              className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
            >
              <option value="">Choose an NGO...</option>
              {availableNgos.map((ngo) => (
                <option key={ngo.pubkey} value={ngo.pubkey}>
                  {ngo.account.metadataUri.replace('ipfs://', '').slice(0, 20)}... 
                  ({ngo.pubkey.slice(0, 8)}...)
                </option>
              ))}
            </select>
            {selectedWallet && availableNgos.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No NGOs found for this wallet. <a href="/wallet" className="text-blue-600 underline">Create one first</a>.
              </p>
            )}
          </div>
        </div>

        {/* Top row: batch index + program */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Batch Index
            </label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2 text-sm"
              value={batchIndex}
              onChange={(e) => setBatchIndex(Number(e.target.value))}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Increment this per NGO (0, 1, 2, ...).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Program Tag
            </label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={programTag}
              onChange={(e) => setProgramTag(e.target.value)}
              placeholder="CashTransfers-Jan-2026"
            />
          </div>
        </div>

        {/* Region + currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Region</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Kenya / Nairobi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Currency
            </label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="USD"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Batch Description
          </label>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Cash transfers to 2 pilot households for January."
          />
        </div>

        {/* Recipients + receipt URLs */}
        <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-medium mb-1">
                Recipient 1 Wallet
              </label>
              <input
                className="w-full border rounded px-2 py-1 text-xs"
                value={r1Wallet}
                onChange={(e) => setR1Wallet(e.target.value)}
                placeholder="So1111..."
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1">
                Amount
              </label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-xs"
                value={r1Amount}
                onChange={(e) =>
                  setR1Amount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1">
                Receipt URL (optional)
              </label>
              <div className="flex items-center gap-1">
                <input
                  className="w-full border rounded px-2 py-1 text-xs"
                  value={r1ReceiptUrl}
                  onChange={(e) => setR1ReceiptUrl(e.target.value)}
                  placeholder="ipfs://receipt1 or https://..."
                />
                <label className="text-[10px] px-2 py-1 border rounded cursor-pointer bg-gray-100 hover:bg-gray-200">
                  {uploadLoading ? "..." : "Upload"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const uri = await uploadReceiptFile(file);
                      if (uri) setR1ReceiptUrl(uri);
                      // reset input so selecting the same file again still triggers onChange
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        {uploadStatus && (
          <p className="text-[11px] text-gray-600 mt-1">{uploadStatus}</p>
        )}
        {/* IPFS dataUri + pin button */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Data URI (IPFS)
          </label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={dataUri}
            onChange={(e) => setDataUri(e.target.value)}
            placeholder="ipfs://cid-of-batch-json"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handlePinBatchData}
              disabled={pinLoading}
              className="px-3 py-1 rounded bg-gray-800 text-white text-[11px] disabled:opacity-50"
            >
              {pinLoading ? "Pinning..." : "Pin batch data to IPFS"}
            </button>
            {pinStatus && (
              <span className="text-[11px] text-gray-600">{pinStatus}</span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            This JSON will include description, recipients, and receipt URLs so
            auditors can inspect the full batch off-chain.
          </p>
        </div>

        {/* Submit button stays the same */}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-emerald-600 text-white text-sm disabled:opacity-50"
        >
          {loading ? "Submitting batch..." : "Submit Batch"}
        </button>
      </form>


      {result && (
        <section className="space-y-3">
          {result.ok ? (
            <div className="border border-emerald-200 bg-emerald-50 text-emerald-900 rounded-lg p-3 text-sm">
              <div className="font-semibold mb-1">Batch submitted ✅</div>
              <div className="text-xs space-y-1">
                <div>
                  <span className="font-medium">NGO PDA:</span>{" "}
                  <span className="font-mono break-all">
                    {result.ngoPda}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Batch PDA:</span>{" "}
                  <span className="font-mono break-all">
                    {result.batchPda}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Transaction:</span>{" "}
                  <span className="font-mono break-all">{result.tx}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-red-200 bg-red-50 text-red-900 rounded-lg p-3 text-sm">
              <div className="font-semibold mb-1">Submission failed</div>
              <div className="text-xs break-all">
                {result.error ?? "Unknown error"}
              </div>
            </div>
          )}

          <details className="text-xs">
            <summary className="cursor-pointer text-gray-600 mb-1">
              Raw API response
            </summary>
            <pre className="border rounded bg-gray-50 p-2 whitespace-pre-wrap break-all">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </section>
      )}
    </main>
  );
}
