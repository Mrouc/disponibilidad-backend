import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertGroupSchema, insertMemberSchema, insertAvailabilitySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Groups
  app.post("/api/groups", async (req, res) => {
    try {
      const validatedData = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(validatedData);
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid group data" });
    }
  });

  app.get("/api/groups/:id", async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Members
  app.post("/api/groups/:groupId/members", async (req, res) => {
    try {
      const validatedData = insertMemberSchema.parse({
        ...req.body,
        groupId: req.params.groupId,
      });
      const member = await storage.createMember(validatedData);
      res.json(member);
    } catch (error) {
      res.status(400).json({ message: "Invalid member data" });
    }
  });

  app.get("/api/groups/:groupId/members", async (req, res) => {
    try {
      const members = await storage.getGroupMembers(req.params.groupId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Availability
  app.post("/api/groups/:groupId/availability", async (req, res) => {
    try {
      const validatedData = insertAvailabilitySchema.parse({
        ...req.body,
        groupId: req.params.groupId,
      });
      const availability = await storage.upsertAvailability(validatedData);
      
      // Broadcast to WebSocket clients
      broadcastToGroup(req.params.groupId, {
        type: "availability_updated",
        data: availability,
      });
      
      res.json(availability);
    } catch (error) {
      res.status(400).json({ message: "Invalid availability data" });
    }
  });

  app.get("/api/groups/:groupId/availability", async (req, res) => {
    try {
      const availability = await storage.getGroupAvailability(req.params.groupId);
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/groups/:groupId/availability/:memberId", async (req, res) => {
    try {
      const availability = await storage.getMemberAvailability(
        req.params.groupId,
        req.params.memberId
      );
      res.json(availability || { selectedDates: [] });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const groupConnections = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws) => {
    let currentGroupId: string | null = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join_group' && data.groupId) {
          // Leave previous group if any
          if (currentGroupId) {
            const groupSockets = groupConnections.get(currentGroupId);
            if (groupSockets) {
              groupSockets.delete(ws);
              if (groupSockets.size === 0) {
                groupConnections.delete(currentGroupId);
              }
            }
          }
          
          // Join new group
          currentGroupId = data.groupId;
          if (!groupConnections.has(currentGroupId)) {
            groupConnections.set(currentGroupId, new Set());
          }
          groupConnections.get(currentGroupId)!.add(ws);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (currentGroupId) {
        const groupSockets = groupConnections.get(currentGroupId);
        if (groupSockets) {
          groupSockets.delete(ws);
          if (groupSockets.size === 0) {
            groupConnections.delete(currentGroupId);
          }
        }
      }
    });
  });

  function broadcastToGroup(groupId: string, message: any) {
    const groupSockets = groupConnections.get(groupId);
    if (groupSockets) {
      const messageStr = JSON.stringify(message);
      groupSockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  }

  return httpServer;
}
