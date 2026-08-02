import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateUploadSignature } from '@/lib/cloudinary'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const body = (await request.json()) as { folder?: string }
  if (!body.folder) {
    return NextResponse.json({ error: 'folder es requerido' }, { status: 400 })
  }
  return NextResponse.json(generateUploadSignature(body.folder))
}
