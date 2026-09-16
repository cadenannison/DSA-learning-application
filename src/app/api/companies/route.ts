import { NextResponse } from "next/server"
import { container } from "@/server/container"

export async function GET() {
  const companies = await container.problemService.listCompanies()
  return NextResponse.json(companies)
}
