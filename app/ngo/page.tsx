// app/ngo/page.tsx
"use client";

import { useState } from "react";

interface ApiResult {
  ok: boolean;
  tx?: string;
  ngoPda?: string;
  ngoAccount?: any;
  error?: string;
}

export default function NgoPage() {
  // Form fields for NGO metadata
  const [ngoName, setNgoName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [region, setRegion] = useState("");

  // This is what goes on-chain
  const [metadataUri, setMetadataUri] = useState("");

  // Status for Pinata + register flows
  const [pinStatus, setPinStatus] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Upload NGO metadata to Pinata and get an ipfs:// URI
  const handlePinNgoMetadata = async () => {
    setPinLoading(true);
    setPinStatus(null);

    try {
      // basic required fields check
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

  // Call your /api/register-ngo route with the metadataUri
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      if (!metadataUri) {
        setResult({
          ok: false,
          error:
            "No metadata URI set. Pin your NGO metadata to IPFS or paste an ipfs:// URI first.",
        });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/register-ngo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadataUri }),
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
        <h1 className="text-2xl font-bold">Register NGO</h1>
        <p className="text-sm text-gray-600">
          Fill in basic NGO information, pin it to IPFS as JSON, and then
          register a{" "}
          <span className="font-medium">verifiable NGO identity</span> on
          Solana pointing to that metadata.
        </p>
      </section>

      {/* NGO form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              NGO Name *
            </label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={ngoName}
              onChange={(e) => setNgoName(e.target.value)}
              placeholder="e.g. Umoja Relief Fund"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description *
            </label>
            <textarea
              className="w-full border rounded px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what this NGO does."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Website
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.org"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Contact Email
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@example.org"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Primary Region *
            </label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. Kenya, East Africa"
            />
          </div>
        </section>

        {/* IPFS + metadata URI section */}
        <section className="space-y-2">
          <label className="block text-sm font-medium mb-1">
            Metadata URI (IPFS)
          </label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={metadataUri}
            onChange={(e) => setMetadataUri(e.target.value)}
            placeholder="ipfs://cid-of-ngo-metadata"
          />
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handlePinNgoMetadata}
              disabled={pinLoading}
              className="px-3 py-1 rounded bg-gray-800 text-white text-[11px] disabled:opacity-50"
            >
              {pinLoading ? "Pinning..." : "Pin NGO metadata to IPFS"}
            </button>
            {pinStatus && (
              <span className="text-[11px] text-gray-600">
                {pinStatus}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            You can either paste an existing{" "}
            <code className="font-mono">ipfs://</code> URI, or click the
            button to generate and pin metadata based on the fields above.
          </p>
        </section>

        {/* Register button */}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          {loading ? "Registering NGO on-chain..." : "Register NGO on Solana"}
        </button>
      </form>

      {/* Status banner */}
      {result && (
        <section className="space-y-3 mt-4">
          {result.ok ? (
            <div className="border border-emerald-200 bg-emerald-50 text-emerald-900 rounded-lg p-3 text-sm">
              <div className="font-semibold mb-1">NGO registered ✅</div>
              <div className="text-xs space-y-1">
                <div>
                  <span className="font-medium">NGO PDA:</span>{" "}
                  <span className="font-mono break-all">
                    {result.ngoPda}
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
              <div className="font-semibold mb-1">Registration failed</div>
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
