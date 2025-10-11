import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReminderSchema, insertLabelSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.get('/api/reminders', async (req, res) => {
    try {
      const reminders = await storage.getReminders();
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reminders' });
    }
  });

  app.post('/api/reminders', async (req, res) => {
    try {
      const data = insertReminderSchema.parse(req.body);
      const reminder = await storage.createReminder(data);
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid reminder data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create reminder' });
      }
    }
  });

  app.patch('/api/reminders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const reminder = await storage.updateReminder(id, req.body);
      if (!reminder) {
        res.status(404).json({ error: 'Reminder not found' });
        return;
      }
      res.json(reminder);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update reminder' });
    }
  });

  app.delete('/api/reminders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteReminder(id);
      if (!deleted) {
        res.status(404).json({ error: 'Reminder not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete reminder' });
    }
  });

  app.get('/api/labels', async (req, res) => {
    try {
      const labels = await storage.getLabels();
      res.json(labels);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch labels' });
    }
  });

  app.post('/api/labels', async (req, res) => {
    try {
      const data = insertLabelSchema.parse(req.body);
      const label = await storage.createLabel(data);
      res.status(201).json(label);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid label data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create label' });
      }
    }
  });

  app.patch('/api/labels/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const label = await storage.updateLabel(id, req.body);
      if (!label) {
        res.status(404).json({ error: 'Label not found' });
        return;
      }
      res.json(label);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update label' });
    }
  });

  app.delete('/api/labels/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteLabel(id);
      if (!deleted) {
        res.status(404).json({ error: 'Label not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete label' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
