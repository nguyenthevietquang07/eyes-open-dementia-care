import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import {
  insertLabelSchema,
  insertReminderSchema,
  loginUserSchema,
  registerUserSchema,
} from "@shared/schema";
import { z } from "zod";
import { clearSessionCookie, hashPassword, publicUser, requireUser, setSessionCookie, verifyPassword } from "./auth";
import { storage, type IStorage } from "./storage";

const reminderPatchSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    scheduledFor: z.coerce.date().optional(),
    completed: z.boolean().optional(),
  })
  .strict();

const labelPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    imageData: z.string().min(1).optional(),
    category: z.enum(["person", "object"]).optional(),
    detectedObjects: z.array(z.string()).nullable().optional(),
    lastSeenAt: z.coerce.date().nullable().optional(),
  })
  .strict();

function formatZodError(error: z.ZodError) {
  return error.errors.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

function userId(req: Request) {
  if (!req.user) throw new Error("Authenticated user missing from request");
  return req.user.id;
}

export async function registerRoutes(app: Express, activeStorage: IStorage = storage): Promise<Server> {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerUserSchema.parse(req.body);
      const existingUser = await activeStorage.getUserByEmail(data.email);
      if (existingUser) {
        res.status(409).json({ error: "An account already exists for this email." });
        return;
      }

      const user = await activeStorage.createUser({
        email: data.email,
        displayName: data.displayName,
        passwordHash: await hashPassword(data.password),
      });
      setSessionCookie(res, user.id);
      res.status(201).json(publicUser(user));
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid registration data", details: formatZodError(error) });
        return;
      }
      console.error("Registration failed:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginUserSchema.parse(req.body);
      const user = await activeStorage.getUserByEmail(data.email);
      if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      setSessionCookie(res, user.id);
      res.json(publicUser(user));
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid login data", details: formatZodError(error) });
        return;
      }
      console.error("Login failed:", error);
      res.status(500).json({ error: "Failed to sign in" });
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    clearSessionCookie(res);
    res.status(204).send();
  });

  app.get("/api/auth/me", requireUser(activeStorage), (req, res) => {
    res.json(req.user);
  });

  app.get("/api/reminders", requireUser(activeStorage), async (req, res) => {
    try {
      const reminders = await activeStorage.getReminders(userId(req));
      res.json(reminders);
    } catch (error) {
      console.error("Fetch reminders failed:", error);
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", requireUser(activeStorage), async (req, res) => {
    try {
      const data = insertReminderSchema.parse(req.body);
      const reminder = await activeStorage.createReminder(userId(req), data);
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid reminder data", details: formatZodError(error) });
        return;
      }
      console.error("Create reminder failed:", error);
      res.status(500).json({ error: "Failed to create reminder" });
    }
  });

  app.patch("/api/reminders/:id", requireUser(activeStorage), async (req, res) => {
    try {
      const data = reminderPatchSchema.parse(req.body);
      const reminder = await activeStorage.updateReminder(userId(req), req.params.id, data);
      if (!reminder) {
        res.status(404).json({ error: "Reminder not found" });
        return;
      }
      res.json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid reminder update", details: formatZodError(error) });
        return;
      }
      console.error("Update reminder failed:", error);
      res.status(500).json({ error: "Failed to update reminder" });
    }
  });

  app.delete("/api/reminders/:id", requireUser(activeStorage), async (req, res) => {
    try {
      const deleted = await activeStorage.deleteReminder(userId(req), req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Reminder not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete reminder failed:", error);
      res.status(500).json({ error: "Failed to delete reminder" });
    }
  });

  app.get("/api/labels", requireUser(activeStorage), async (req, res) => {
    try {
      const labels = await activeStorage.getLabels(userId(req));
      res.json(labels);
    } catch (error) {
      console.error("Fetch labels failed:", error);
      res.status(500).json({ error: "Failed to fetch labels" });
    }
  });

  app.post("/api/labels", requireUser(activeStorage), async (req, res) => {
    try {
      const data = insertLabelSchema.parse(req.body);
      const label = await activeStorage.createLabel(userId(req), data);
      res.status(201).json(label);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid label data", details: formatZodError(error) });
        return;
      }
      console.error("Create label failed:", error);
      res.status(500).json({ error: "Failed to create label" });
    }
  });

  app.patch("/api/labels/:id", requireUser(activeStorage), async (req, res) => {
    try {
      const data = labelPatchSchema.parse(req.body);
      const label = await activeStorage.updateLabel(userId(req), req.params.id, data);
      if (!label) {
        res.status(404).json({ error: "Label not found" });
        return;
      }
      res.json(label);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid label update", details: formatZodError(error) });
        return;
      }
      console.error("Update label failed:", error);
      res.status(500).json({ error: "Failed to update label" });
    }
  });

  app.delete("/api/labels/:id", requireUser(activeStorage), async (req, res) => {
    try {
      const deleted = await activeStorage.deleteLabel(userId(req), req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Label not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete label failed:", error);
      res.status(500).json({ error: "Failed to delete label" });
    }
  });

  return createServer(app);
}
