import { revalidatePath as nextRevalidatePath } from 'next/cache'

export function safeRevalidatePath(path: string): void {
  try {
    nextRevalidatePath(path)
  } catch {
    // no-op outside of a Next.js request context (e.g. when called from tests)
  }
}
