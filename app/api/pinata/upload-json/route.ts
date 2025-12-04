// app/api/pinata/upload-json/route.ts
// @ts-nocheck

import { NextResponse } from "next/server";

const PINATA_ENDPOINT = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, content } = body || {};

    if (!content) {
      return NextResponse.json(
        { ok: false, error: "Missing 'content' in request body" },
        { status: 400 }
      );
    }

    const apiKey = process.env.PINATA_API_KEY;
    const apiSecret = process.env.PINATA_SECRET_API_KEY;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { ok: false, error: "Pinata API keys not configured on server" },
        { status: 500 }
      );
    }

    const pinataBody = {
      pinataMetadata: {
        name: name || "aidledger-json",
      },
      pinataContent: content,
    };

    const res = await fetch(PINATA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      },
      body: JSON.stringify(pinataBody),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Pinata error:", text);
      return NextResponse.json(
        { ok: false, error: `Pinata error: ${text}` },
        { status: 502 }
      );
    }

    const json = await res.json();
    const cid = json.IpfsHash;
    const uri = `ipfs://${cid}`;

    return NextResponse.json({
      ok: true,
      cid,
      uri,
      pinataResponse: json,
    });
  } catch (err: any) {
    console.error("upload-json error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
