import type { UserRecord, PersonReference } from '../types/entities';

let userMap: Map<string, UserRecord> = new Map();

export function setUsers(users: UserRecord[]): void {
  userMap = new Map();
  for (const user of users) {
    if (user.autodesk_id) {
      userMap.set(user.autodesk_id, user);
    }
    if (user.id) {
      userMap.set(user.id, user);
    }
  }
}

export function resolvePersonId(id: string): PersonReference | null {
  if (!id) return null;
  const user = userMap.get(id);
  if (!user) return null;
  return {
    autodeskId: user.autodesk_id,
    name: user.name || `${user.first_name} ${user.last_name}`.trim(),
    email: user.email,
  };
}

export function resolvePersonName(id: string): string {
  const ref = resolvePersonId(id);
  return ref?.name || id;
}

export function getAllUsers(): UserRecord[] {
  const seen = new Set<string>();
  const result: UserRecord[] = [];
  for (const user of userMap.values()) {
    if (!seen.has(user.autodesk_id)) {
      seen.add(user.autodesk_id);
      result.push(user);
    }
  }
  return result;
}
