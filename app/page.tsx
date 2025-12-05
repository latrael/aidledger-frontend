// app/page.tsx
"use client";

import { useEffect, useState } from "react";

interface Stats {
  wallets: number;
  ngos: number;
  batches: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ wallets: 0, ngos: 0, batches: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Load wallets count
        const walletsRes = await fetch("/api/wallet");
        const walletsData = await walletsRes.json();
        
        // Load NGOs count  
        const ngosRes = await fetch("/api/ngos");
        const ngosData = await ngosRes.json();
        
        setStats({
          wallets: walletsData.ok ? walletsData.count : 0,
          ngos: ngosData.ok ? ngosData.ngos.length : 0,
          batches: 0, // TODO: Add batch counting API
        });
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50">
      {/* Header */}
      <div className="px-8 py-6 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Aidledger</h1>
          </div>
          <div className="text-sm text-gray-500">
            Solana Devnet • Transparent Aid Distribution
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transparent Aid Distribution
            <span className="block text-blue-600">on Solana Blockchain</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Create wallets, register NGOs, and submit transparent aid batches with 
            automated IPFS metadata storage and blockchain verification.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {loading ? "..." : stats.wallets}
            </div>
            <div className="text-gray-600">Active Wallets</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {loading ? "..." : stats.ngos}
            </div>
            <div className="text-gray-600">Registered NGOs</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {loading ? "..." : stats.batches}
            </div>
            <div className="text-gray-600">Aid Batches</div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* Wallet Manager */}
          <a
            href="/wallet"
            className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <span className="text-2xl">🔑</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Wallet Manager</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create wallets, register NGOs, and manage your blockchain identities with automated SOL funding.
            </p>
            <div className="text-blue-600 text-sm font-medium group-hover:text-blue-700">
              Manage Wallets →
            </div>
          </a>

          {/* NGO Registration */}
          <a
            href="/ngo"
            className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
              <span className="text-2xl">🏢</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Register NGO</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create verifiable NGO identities on-chain with metadata stored on IPFS for transparency.
            </p>
            <div className="text-emerald-600 text-sm font-medium group-hover:text-emerald-700">
              Register NGO →
            </div>
          </a>

          {/* Batch Submission */}
          <a
            href="/batches"
            className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Submit Batches</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create transparent aid distribution batches with recipient details and proof of delivery.
            </p>
            <div className="text-purple-600 text-sm font-medium group-hover:text-purple-700">
              Submit Batch →
            </div>
          </a>

          {/* Admin Dashboard */}
          <a
            href="/admin"
            className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Dashboard</h3>
            <p className="text-sm text-gray-600 mb-4">
              View all registered NGOs, their batches, and monitor blockchain activity across the platform.
            </p>
            <div className="text-orange-600 text-sm font-medium group-hover:text-orange-700">
              View Dashboard →
            </div>
          </a>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Platform Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔐</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Blockchain Security</h3>
              <p className="text-sm text-gray-600">
                All transactions are secured by Solana's blockchain with transparent, immutable records.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Easy Management</h3>
              <p className="text-sm text-gray-600">
                Simple interface for creating wallets, registering NGOs, and managing aid distributions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌐</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">IPFS Integration</h3>
              <p className="text-sm text-gray-600">
                Metadata and documents stored on IPFS for decentralized, permanent accessibility.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p className="text-gray-400">
            Built on Solana • Powered by IPFS • Made for Transparent Aid Distribution
          </p>
        </div>
      </div>
    </main>
  );
}
