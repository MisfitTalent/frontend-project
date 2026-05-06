import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const specPath = path.join(
  process.cwd(),
  "openapi",
  "owned-sales-automation.json",
);

export async function GET() {
  try {
    const contents = await fs.readFile(specPath, "utf8");
    return new NextResponse(contents, {
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { message: "Owned OpenAPI spec not found." },
      { status: 404 },
    );
  }
}
