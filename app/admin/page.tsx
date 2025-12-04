// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";

interface NgoRow {
  pubkey: string;
  account: {
    metadataUri: string;
    isActive: boolean;
    createdAt?: { toString: () => string } | any;
    admin: string | { toString: () => string };
  };
}

interface BatchRow {
  pubkey: string;
  account: {
    batchIndex: any;
    region: string;
    programTag: string;
    dataUri: string;
    startTime: any;
    endTime: any;
    isFlagged: boolean;
  };
}

export default function AdminPage() {
  const [ngos, setNgos] = useState<NgoRow[]>([]);
  const [selectedNgo, setSelectedNgo] = useState<string | null>(null);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loadingNgos, setLoadingNgos] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

  useEffect(() => {
    const fetchNgos = async () => {
      setLoadingNgos(true);
      try {
        const res = await fetch("/api/ngos");
        const data = await res.json();
        if (data.ok) {
          setNgos(data.ngos);
        } else {
          console.error(data.error);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingNgos(false);
      }
    };
    fetchNgos();
  }, []);

  const handleSelectNgo = async (ngoPubkey: string) => {
    setSelectedNgo(ngoPubkey);
    setBatches([]);
    setLoadingBatches(true);
    try {
        const res = await fetch(
        `/api/batches?ngo=${encodeURIComponent(ngoPubkey)}`
        );
        const data = await res.json();
        if (data && data.ok) {
        setBatches(data.batches);
        } else {
        console.error("batches error:", data?.error ?? "Unknown error");
        }
    } catch (e) {
        console.error("fetch error:", e);
    } finally {
        setLoadingBatches(false);
    }
};


  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Aidledger Admin Dashboard</h1>
        <p className="text-sm text-gray-600">
          View registered NGOs and their submitted batches on the local
          Solana network.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* NGOs list */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Registered NGOs</h2>
          {loadingNgos ? (
            <p className="text-sm text-gray-500">Loading NGOs...</p>
          ) : ngos.length === 0 ? (
            <p className="text-sm text-gray-500">
              No NGOs found. Register one from the{" "}
              <a href="/ngo" className="text-blue-600 underline">
                NGO page
              </a>
              .
            </p>
          ) : (
            <div className="border rounded divide-y text-xs bg-white">
              {ngos.map((ngo) => {
                const createdAt = ngo.account.createdAt;
                const createdDate =
                createdAt && !Number.isNaN(createdAt)
                    ? new Date(createdAt * 1000).toLocaleString()
                    : "—";

                const admin = ngo.account.admin; // already a string from API

                return (
                  <button
                    key={ngo.pubkey}
                    onClick={() => handleSelectNgo(ngo.pubkey)}
                    className={`w-full text-left p-3 hover:bg-gray-50 ${
                      selectedNgo === ngo.pubkey ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="font-mono text-[11px] break-all mb-1">
                      {ngo.pubkey}
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-600">
                      <span>Admin: {String(admin)}</span>
                        <span
                            className={
                            ngo.account.isActive
                                ? "inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800"
                                : "inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                            }
                        >
                            {ngo.account.isActive ? "Active" : "Inactive"}
                        </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      URI: {ngo.account.metadataUri}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Batches list */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Batches</h2>
          {!selectedNgo ? (
            <p className="text-sm text-gray-500">
              Select an NGO on the left to view its batches.
            </p>
          ) : loadingBatches ? (
            <p className="text-sm text-gray-500">
              Loading batches for {selectedNgo}...
            </p>
          ) : batches.length === 0 ? (
            <p className="text-sm text-gray-500">
              No batches found for this NGO.
            </p>
          ) : (
            <div className="border rounded text-xs bg-white overflow-auto max-h-[480px]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left">Index</th>
                    <th className="px-2 py-1 text-left">Region</th>
                    <th className="px-2 py-1 text-left">Program</th>
                    <th className="px-2 py-1 text-left">Start</th>
                    <th className="px-2 py-1 text-left">End</th>
                    <th className="px-2 py-1 text-left">Data URI</th>
                  </tr>
                </thead>
                <tbody>
                  {batches
                    .slice()
                    .sort(
                        (a, b) =>
                        a.account.startTime - b.account.startTime ||
                        a.account.batchIndex - b.account.batchIndex
                    )
                    .map((b) => {
                        const idx = b.account.batchIndex;
                        const start =
                        b.account.startTime &&
                        new Date(b.account.startTime * 1000).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        });
                        const end =
                        b.account.endTime &&
                        new Date(b.account.endTime * 1000).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        });

                        return (
                        <tr key={b.pubkey} className="border-t">
                            <td className="px-2 py-1">{idx}</td>
                            <td className="px-2 py-1">{b.account.region}</td>
                            <td className="px-2 py-1">{b.account.programTag}</td>
                            <td className="px-2 py-1">{start}</td>
                            <td className="px-2 py-1">{end}</td>
                            <td className="px-2 py-1 max-w-[160px] truncate">
                            {b.account.dataUri}
                            </td>
                        </tr>
                        );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
