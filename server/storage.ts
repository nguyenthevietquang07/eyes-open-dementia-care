import { 
  type Reminder, 
  type InsertReminder, 
  type Label, 
  type InsertLabel 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getReminders(): Promise<Reminder[]>;
  getReminder(id: string): Promise<Reminder | undefined>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, data: Partial<Reminder>): Promise<Reminder | undefined>;
  deleteReminder(id: string): Promise<boolean>;

  getLabels(): Promise<Label[]>;
  getLabel(id: string): Promise<Label | undefined>;
  createLabel(label: InsertLabel): Promise<Label>;
  updateLabel(id: string, data: Partial<Label>): Promise<Label | undefined>;
  deleteLabel(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private reminders: Map<string, Reminder>;
  private labels: Map<string, Label>;

  constructor() {
    this.reminders = new Map();
    this.labels = new Map();
  }

  async getReminders(): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).sort(
      (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
  }

  async getReminder(id: string): Promise<Reminder | undefined> {
    return this.reminders.get(id);
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const id = randomUUID();
    const reminder: Reminder = {
      ...insertReminder,
      id,
      createdAt: new Date(),
    };
    this.reminders.set(id, reminder);
    return reminder;
  }

  async updateReminder(id: string, data: Partial<Reminder>): Promise<Reminder | undefined> {
    const reminder = this.reminders.get(id);
    if (!reminder) return undefined;

    const updated = { ...reminder, ...data };
    this.reminders.set(id, updated);
    return updated;
  }

  async deleteReminder(id: string): Promise<boolean> {
    return this.reminders.delete(id);
  }

  async getLabels(): Promise<Label[]> {
    return Array.from(this.labels.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getLabel(id: string): Promise<Label | undefined> {
    return this.labels.get(id);
  }

  async createLabel(insertLabel: InsertLabel): Promise<Label> {
    const id = randomUUID();
    const label: Label = {
      ...insertLabel,
      id,
      createdAt: new Date(),
      lastSeenAt: null,
    };
    this.labels.set(id, label);
    return label;
  }

  async updateLabel(id: string, data: Partial<Label>): Promise<Label | undefined> {
    const label = this.labels.get(id);
    if (!label) return undefined;

    const updated = { ...label, ...data };
    this.labels.set(id, updated);
    return updated;
  }

  async deleteLabel(id: string): Promise<boolean> {
    return this.labels.delete(id);
  }
}

export const storage = new MemStorage();
