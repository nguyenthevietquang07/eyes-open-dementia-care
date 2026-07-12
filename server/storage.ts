import {
  type InsertLabel,
  type InsertReminder,
  type Label,
  type Reminder,
  type User,
} from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

export type CreateUserInput = Pick<User, "email" | "passwordHash" | "displayName">;

export interface IStorage {
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: CreateUserInput): Promise<User>;

  getReminders(userId: string): Promise<Reminder[]>;
  getReminder(userId: string, id: string): Promise<Reminder | undefined>;
  createReminder(userId: string, reminder: InsertReminder): Promise<Reminder>;
  updateReminder(userId: string, id: string, data: Partial<Reminder>): Promise<Reminder | undefined>;
  deleteReminder(userId: string, id: string): Promise<boolean>;

  getLabels(userId: string): Promise<Label[]>;
  getLabel(userId: string, id: string): Promise<Label | undefined>;
  createLabel(userId: string, label: InsertLabel): Promise<Label>;
  updateLabel(userId: string, id: string, data: Partial<Label>): Promise<Label | undefined>;
  deleteLabel(userId: string, id: string): Promise<boolean>;
}

type PersistedState = {
  users?: User[];
  reminders?: Reminder[];
  labels?: Label[];
};

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private reminders = new Map<string, Reminder>();
  private labels = new Map<string, Label>();
  private readonly dataPath: string | null;

  constructor(options: { persist?: boolean; dataPath?: string } = {}) {
    const persist = options.persist ?? process.env.NODE_ENV !== "test";
    this.dataPath = persist
      ? options.dataPath ?? path.resolve(process.cwd(), ".local", "eyes-open-data.json")
      : null;
    this.load();
  }

  private load() {
    if (!this.dataPath || !fs.existsSync(this.dataPath)) return;

    try {
      const raw = JSON.parse(fs.readFileSync(this.dataPath, "utf-8")) as PersistedState;

      for (const user of raw.users ?? []) {
        this.users.set(user.id, {
          ...user,
          createdAt: new Date(user.createdAt),
        });
      }

      for (const reminder of raw.reminders ?? []) {
        if (!reminder.userId) continue;
        this.reminders.set(reminder.id, {
          ...reminder,
          scheduledFor: new Date(reminder.scheduledFor),
          createdAt: new Date(reminder.createdAt),
        });
      }

      for (const label of raw.labels ?? []) {
        if (!label.userId) continue;
        this.labels.set(label.id, {
          ...label,
          lastSeenAt: label.lastSeenAt ? new Date(label.lastSeenAt) : null,
          createdAt: new Date(label.createdAt),
        });
      }
    } catch (error) {
      console.warn("Could not load local Eyes Open data store:", error);
    }
  }

  private persist() {
    if (!this.dataPath) return;

    fs.mkdirSync(path.dirname(this.dataPath), { recursive: true });
    fs.writeFileSync(
      this.dataPath,
      JSON.stringify(
        {
          users: Array.from(this.users.values()),
          reminders: Array.from(this.reminders.values()),
          labels: Array.from(this.labels.values()),
        },
        null,
        2,
      ),
      "utf-8",
    );
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const user: User = {
      ...input,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    this.persist();
    return user;
  }

  async getReminders(userId: string): Promise<Reminder[]> {
    return Array.from(this.reminders.values())
      .filter((reminder) => reminder.userId === userId)
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  }

  async getReminder(userId: string, id: string): Promise<Reminder | undefined> {
    const reminder = this.reminders.get(id);
    return reminder?.userId === userId ? reminder : undefined;
  }

  async createReminder(userId: string, insertReminder: InsertReminder): Promise<Reminder> {
    const id = randomUUID();
    const reminder: Reminder = {
      ...insertReminder,
      id,
      userId,
      description: insertReminder.description ?? null,
      completed: insertReminder.completed ?? false,
      createdAt: new Date(),
    };
    this.reminders.set(id, reminder);
    this.persist();
    return reminder;
  }

  async updateReminder(userId: string, id: string, data: Partial<Reminder>): Promise<Reminder | undefined> {
    const reminder = await this.getReminder(userId, id);
    if (!reminder) return undefined;

    const updated = {
      ...reminder,
      title: data.title ?? reminder.title,
      description: data.description ?? reminder.description,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : reminder.scheduledFor,
      completed: data.completed ?? reminder.completed,
    };
    this.reminders.set(id, updated);
    this.persist();
    return updated;
  }

  async deleteReminder(userId: string, id: string): Promise<boolean> {
    const reminder = await this.getReminder(userId, id);
    if (!reminder) return false;
    const deleted = this.reminders.delete(id);
    if (deleted) this.persist();
    return deleted;
  }

  async getLabels(userId: string): Promise<Label[]> {
    return Array.from(this.labels.values())
      .filter((label) => label.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getLabel(userId: string, id: string): Promise<Label | undefined> {
    const label = this.labels.get(id);
    return label?.userId === userId ? label : undefined;
  }

  async createLabel(userId: string, insertLabel: InsertLabel): Promise<Label> {
    const id = randomUUID();
    const label: Label = {
      ...insertLabel,
      id,
      userId,
      detectedObjects: insertLabel.detectedObjects ?? null,
      createdAt: new Date(),
      lastSeenAt: null,
    };
    this.labels.set(id, label);
    this.persist();
    return label;
  }

  async updateLabel(userId: string, id: string, data: Partial<Label>): Promise<Label | undefined> {
    const label = await this.getLabel(userId, id);
    if (!label) return undefined;

    const updated = {
      ...label,
      name: data.name ?? label.name,
      imageData: data.imageData ?? label.imageData,
      category: data.category ?? label.category,
      detectedObjects: data.detectedObjects ?? label.detectedObjects,
      lastSeenAt: data.lastSeenAt ? new Date(data.lastSeenAt) : label.lastSeenAt,
    };
    this.labels.set(id, updated);
    this.persist();
    return updated;
  }

  async deleteLabel(userId: string, id: string): Promise<boolean> {
    const label = await this.getLabel(userId, id);
    if (!label) return false;
    const deleted = this.labels.delete(id);
    if (deleted) this.persist();
    return deleted;
  }
}

function mapUser(row: QueryResultRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    createdAt: row.created_at,
  };
}

function mapReminder(row: QueryResultRow): Reminder {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    scheduledFor: row.scheduled_for,
    completed: row.completed,
    createdAt: row.created_at,
  };
}

function mapLabel(row: QueryResultRow): Label {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    imageData: row.image_data,
    category: row.category,
    detectedObjects: row.detected_objects,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
  };
}

export class PostgresStorage implements IStorage {
  private readonly pool: Pool;
  private readonly ready: Promise<void>;

  constructor(connectionString = process.env.DATABASE_URL) {
    if (!connectionString) {
      throw new Error("DATABASE_URL is required for PostgresStorage");
    }

    this.pool = new Pool({ connectionString });
    this.ready = this.ensureSchema();
  }

  private async ensureSchema() {
    await this.pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        display_name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title text NOT NULL,
        description text,
        scheduled_for timestamptz NOT NULL,
        completed boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS labels (
        id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name text NOT NULL,
        image_data text NOT NULL,
        category text NOT NULL,
        detected_objects text[],
        last_seen_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await this.pool.query("CREATE INDEX IF NOT EXISTS idx_reminders_user_schedule ON reminders(user_id, scheduled_for)");
    await this.pool.query("CREATE INDEX IF NOT EXISTS idx_labels_user_created ON labels(user_id, created_at DESC)");
  }

  private async query<T extends QueryResultRow>(
    text: string,
    params: unknown[] = [],
    client?: PoolClient,
  ) {
    await this.ready;
    return client ? client.query<T>(text, params) : this.pool.query<T>(text, params);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await this.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] ? mapUser(result.rows[0]) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] ? mapUser(result.rows[0]) : undefined;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const result = await this.query(
      `
        INSERT INTO users (email, password_hash, display_name)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [input.email, input.passwordHash, input.displayName],
    );
    return mapUser(result.rows[0]);
  }

  async getReminders(userId: string): Promise<Reminder[]> {
    const result = await this.query(
      "SELECT * FROM reminders WHERE user_id = $1 ORDER BY scheduled_for ASC",
      [userId],
    );
    return result.rows.map(mapReminder);
  }

  async getReminder(userId: string, id: string): Promise<Reminder | undefined> {
    const result = await this.query("SELECT * FROM reminders WHERE user_id = $1 AND id = $2", [userId, id]);
    return result.rows[0] ? mapReminder(result.rows[0]) : undefined;
  }

  async createReminder(userId: string, reminder: InsertReminder): Promise<Reminder> {
    const result = await this.query(
      `
        INSERT INTO reminders (user_id, title, description, scheduled_for, completed)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        userId,
        reminder.title,
        reminder.description ?? null,
        reminder.scheduledFor,
        reminder.completed ?? false,
      ],
    );
    return mapReminder(result.rows[0]);
  }

  async updateReminder(userId: string, id: string, data: Partial<Reminder>): Promise<Reminder | undefined> {
    const existing = await this.getReminder(userId, id);
    if (!existing) return undefined;

    const result = await this.query(
      `
        UPDATE reminders
        SET title = $3,
            description = $4,
            scheduled_for = $5,
            completed = $6
        WHERE user_id = $1 AND id = $2
        RETURNING *
      `,
      [
        userId,
        id,
        data.title ?? existing.title,
        data.description ?? existing.description,
        data.scheduledFor ? new Date(data.scheduledFor) : existing.scheduledFor,
        data.completed ?? existing.completed,
      ],
    );
    return result.rows[0] ? mapReminder(result.rows[0]) : undefined;
  }

  async deleteReminder(userId: string, id: string): Promise<boolean> {
    const result = await this.query("DELETE FROM reminders WHERE user_id = $1 AND id = $2", [userId, id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getLabels(userId: string): Promise<Label[]> {
    const result = await this.query("SELECT * FROM labels WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    return result.rows.map(mapLabel);
  }

  async getLabel(userId: string, id: string): Promise<Label | undefined> {
    const result = await this.query("SELECT * FROM labels WHERE user_id = $1 AND id = $2", [userId, id]);
    return result.rows[0] ? mapLabel(result.rows[0]) : undefined;
  }

  async createLabel(userId: string, label: InsertLabel): Promise<Label> {
    const result = await this.query(
      `
        INSERT INTO labels (user_id, name, image_data, category, detected_objects)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [userId, label.name, label.imageData, label.category, label.detectedObjects ?? null],
    );
    return mapLabel(result.rows[0]);
  }

  async updateLabel(userId: string, id: string, data: Partial<Label>): Promise<Label | undefined> {
    const existing = await this.getLabel(userId, id);
    if (!existing) return undefined;

    const result = await this.query(
      `
        UPDATE labels
        SET name = $3,
            image_data = $4,
            category = $5,
            detected_objects = $6,
            last_seen_at = $7
        WHERE user_id = $1 AND id = $2
        RETURNING *
      `,
      [
        userId,
        id,
        data.name ?? existing.name,
        data.imageData ?? existing.imageData,
        data.category ?? existing.category,
        data.detectedObjects ?? existing.detectedObjects,
        data.lastSeenAt ? new Date(data.lastSeenAt) : existing.lastSeenAt,
      ],
    );
    return result.rows[0] ? mapLabel(result.rows[0]) : undefined;
  }

  async deleteLabel(userId: string, id: string): Promise<boolean> {
    const result = await this.query("DELETE FROM labels WHERE user_id = $1 AND id = $2", [userId, id]);
    return (result.rowCount ?? 0) > 0;
  }
}

function createStorage(): IStorage {
  if (process.env.EYES_OPEN_STORAGE === "memory" || !process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
      console.warn("DATABASE_URL is not set; using memory storage. Set DATABASE_URL for production persistence.");
    }
    return new MemStorage();
  }

  return new PostgresStorage();
}

export const storage = createStorage();
