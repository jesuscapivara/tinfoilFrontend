import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, downloadHistory, gameCache, InsertDownloadHistory, InsertGameCache } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ═══════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPendingUsers() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(users).where(eq(users.isApproved, false)).orderBy(desc(users.createdAt));
  } catch (error) {
    console.error("[Database] Error fetching pending users:", error);
    return [];
  }
}

export async function approveUser(id: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(users).set({ isApproved: true }).where(eq(users.id, id));
    return await getUserById(id);
  } catch (error) {
    console.error("[Database] Error approving user:", error);
    return null;
  }
}

export async function updateUserTinfoilCredentials(id: number, tinfoilUser: string, tinfoilPass: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(users).set({ tinfoilUser, tinfoilPass }).where(eq(users.id, id));
    return await getUserById(id);
  } catch (error) {
    console.error("[Database] Error updating tinfoil credentials:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════
// DOWNLOAD HISTORY
// ═══════════════════════════════════════════════

export async function saveDownloadHistory(data: InsertDownloadHistory) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(downloadHistory).values(data);
    console.log(`[DB] 📥 Download saved: ${data.name}`);
    return result;
  } catch (error) {
    console.error("[Database] Error saving download:", error);
    return null;
  }
}

export async function getDownloadHistory(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(downloadHistory).orderBy(desc(downloadHistory.completedAt)).limit(limit);
  } catch (error) {
    console.error("[Database] Error fetching download history:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════
// GAME CACHE
// ═══════════════════════════════════════════════

export async function addOrUpdateGame(gameData: InsertGameCache) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(gameCache).values(gameData).onDuplicateKeyUpdate({
      set: gameData,
    });
    console.log(`[DB] 🎯 Game indexed: ${gameData.name}`);
    return true;
  } catch (error) {
    console.error("[Database] Error indexing game:", error);
    return false;
  }
}

export async function getGameCache() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(gameCache).orderBy(desc(gameCache.indexedAt));
  } catch (error) {
    console.error("[Database] Error fetching game cache:", error);
    return [];
  }
}

export async function checkGameExists(filename: string, titleId?: string, version?: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    // Check by filename first
    const byFilename = await db.select().from(gameCache).where(eq(gameCache.filename, filename)).limit(1);
    if (byFilename.length > 0) {
      return { type: "filename", found: byFilename[0] };
    }

    // Check by titleId and version if provided
    if (titleId && version !== undefined) {
      const byId = await db.select().from(gameCache)
        .where(eq(gameCache.titleId, titleId))
        .limit(1);
      if (byId.length > 0 && byId[0].version === version) {
        return { type: "logic", found: byId[0] };
      }
    }

    return null;
  } catch (error) {
    console.error("[Database] Error checking game exists:", error);
    return null;
  }
}
