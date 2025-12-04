// app/api/pinata/upload-file/route.ts
// @ts-nocheck

import { NextResponse } from "next/server";

const PINATA_FILE_ENDPOINT =
  "https://api.pinata.cloud/pinning/pinFileToIPFS";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.PINATA_API_KEY;
    const apiSecret = process.env.PINATA_SECRET_API_KEY;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "Pinata API keys not configured on server",
        },
        { status: 500 }
      );
    }

    const incomingForm = await req.formData();
    const file = incomingForm.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Missing 'file' field in form data" },
        { status: 400 }
      );
    }

    // Build form-data to send to Pinata
    const formData = new FormData();
    formData.append("file", file, file.name || "upload");

    const metadata = {
      name: `aidledger-receipt-${file.name || "upload"}`,
    };

    // IMPORTANT: send metadata as plain text field, not as another file
    formData.append("pinataMetadata", JSON.stringify(metadata));

    const res = await fetch(PINATA_FILE_ENDPOINT, {
      method: "POST",
      headers: {
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
        // let fetch set multipart content-type with boundary
      },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Pinata file error:", text);
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
    console.error("upload-file error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
