// app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">Aidledger Dashboard</h1>
      <p className="text-gray-600">
        Register NGOs and submit transparent aid batches on Solana localnet.
      </p>
      <div className="flex gap-4">
        <a
          href="/ngo"
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Register NGO
        </a>
        <a
          href="/batches"
          className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Submit Batch
        </a>
      </div>
    </main>
  );
}
