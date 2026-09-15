export async function getDb(): Promise<never> {
  throw new Error('SQLite layer has been removed. Use Supabase repository instead.')
}

export async function run(): Promise<void> {
  throw new Error('SQLite layer has been removed. Use Supabase repository instead.')
}

export async function query<T>(): Promise<T[]> {
  throw new Error('SQLite layer has been removed. Use Supabase repository instead.')
}

