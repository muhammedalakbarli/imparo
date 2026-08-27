// GET /api/openapi — OpenAPI 3.0 spesifikasiyası (JSON). Swagger UI bunu oxuyur.

import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/api/openapi";

export function GET() {
  return NextResponse.json(openApiSpec);
}
