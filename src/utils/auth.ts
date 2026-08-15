import { dbGet, dbSet, migrateFromLocalStorage } from './db'

export type StoredUser = {
  id: number
  name: string
  login: string
  password: string
  role: 'admin' | 'moderador' | 'user'
}

const USERS_KEY = 'users'

// Usuário criado automaticamente se nenhum outro existir, para o primeiro
// acesso ao sistema não ficar travado (a página de Usuários exige estar
// logado como admin, então alguém precisa conseguir entrar antes de existir
// qualquer usuário cadastrado).
const DEFAULT_ADMIN: StoredUser = { id: 1, name: 'Administrador', login: 'admin', password: 'admin', role: 'admin' }

export async function getUsers(): Promise<StoredUser[]> {
  await migrateFromLocalStorage()
  return (await dbGet(USERS_KEY)) || []
}

export async function saveUsers(users: StoredUser[]) {
  await dbSet(USERS_KEY, users)
}

export async function ensureDefaultAdmin() {
  const users = await getUsers()
  if (users.length === 0) {
    await saveUsers([DEFAULT_ADMIN])
  }
}

export async function findUserByCredentials(login: string, password: string): Promise<StoredUser | null> {
  const users = await getUsers()
  return users.find(u => u.login === login && u.password === password) || null
}
