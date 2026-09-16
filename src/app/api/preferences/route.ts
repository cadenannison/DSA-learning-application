import { NextRequest, NextResponse } from "next/server"
import { container } from "@/server/container"
import { preferencesSchema } from "@/server/models/schemas"

export async function GET() {
  const theme = await container.progressService.getTheme()
  return NextResponse.json(preferencesSchema.parse({ theme }))
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const parsed = preferencesSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await container.progressService.setTheme(parsed.data.theme)
  return NextResponse.json(preferencesSchema.parse({ theme: parsed.data.theme }))
}
