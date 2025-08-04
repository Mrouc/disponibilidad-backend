import { type Group, type Member, type Availability, type InsertGroup, type InsertMember, type InsertAvailability, groups, members, availability } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Groups
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: string): Promise<Group | undefined>;
  
  // Members
  createMember(member: InsertMember): Promise<Member>;
  getGroupMembers(groupId: string): Promise<Member[]>;
  getMember(id: string): Promise<Member | undefined>;
  
  // Availability
  upsertAvailability(availability: InsertAvailability): Promise<Availability>;
  getGroupAvailability(groupId: string): Promise<Availability[]>;
  getMemberAvailability(groupId: string, memberId: string): Promise<Availability | undefined>;
}

// Initialize demo data in the database
async function initDemoData() {
  try {
    // Check if demo group already exists
    const existingGroup = await db.select().from(groups).where(eq(groups.id, "550e8400-e29b-41d4-a716-446655440000"));
    if (existingGroup.length > 0) {
      return; // Demo data already exists
    }

    const groupId = "550e8400-e29b-41d4-a716-446655440000";
    const creatorId = randomUUID();
    
    // Create demo group
    await db.insert(groups).values({
      id: groupId,
      name: "Team Building Weekend",
      description: "Find the best dates for our upcoming team building event",
      createdBy: creatorId,
      availabilityMode: "time_slots",
    });
    
    // Create demo members
    const demoMemberIds = [creatorId, randomUUID(), randomUUID(), randomUUID()];
    const demoMembersData = [
      {
        id: demoMemberIds[0],
        groupId,
        name: "John Doe",
        email: "john@example.com",
        isCreator: true,
      },
      {
        id: demoMemberIds[1],
        groupId,
        name: "Sarah Miller",
        email: "sarah@example.com",
        isCreator: false,
      },
      {
        id: demoMemberIds[2],
        groupId,
        name: "Mike Johnson",
        email: "mike@example.com",
        isCreator: false,
      },
      {
        id: demoMemberIds[3],
        groupId,
        name: "Anna Lee",
        email: "anna@example.com",
        isCreator: false,
      },
    ];
    
    await db.insert(members).values(demoMembersData);
    
    // Create demo availability
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const availabilityData = [];
    
    // John (creator)
    const johnDates = [
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-05`,
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-16`
    ];
    const johnTimeSlots: Record<string, string[]> = {};
    johnDates.forEach(date => { johnTimeSlots[date] = ["morning"]; });
    
    availabilityData.push({
      groupId,
      memberId: demoMemberIds[0],
      selectedDates: johnDates,
      timeSlots: johnTimeSlots,
    });

    // Sarah
    const sarahDates = [
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-02`,
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-09`,
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`,
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-14`,
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-21`,
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-28`
    ];
    const sarahTimeSlots: Record<string, string[]> = {};
    sarahDates.forEach(date => { sarahTimeSlots[date] = ["morning", "evening"]; });
    
    availabilityData.push({
      groupId,
      memberId: demoMemberIds[1],
      selectedDates: sarahDates,
      timeSlots: sarahTimeSlots,
    });

    // Mike
    const mikeDates = [
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-03`,
      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-11`
    ];
    const mikeTimeSlots: Record<string, string[]> = {};
    mikeDates.forEach(date => { mikeTimeSlots[date] = ["evening"]; });
    
    availabilityData.push({
      groupId,
      memberId: demoMemberIds[2],
      selectedDates: mikeDates,
      timeSlots: mikeTimeSlots,
    });

    // Anna has no availability yet (pending response)
    
    await db.insert(availability).values(availabilityData);
    
    console.log("Demo data initialized successfully");
  } catch (error) {
    console.error("Error initializing demo data:", error);
  }
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const [group] = await db
      .insert(groups)
      .values(insertGroup)
      .returning();
    return group;
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group || undefined;
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const [member] = await db
      .insert(members)
      .values(insertMember)
      .returning();
    return member;
  }

  async getGroupMembers(groupId: string): Promise<Member[]> {
    return await db.select().from(members).where(eq(members.groupId, groupId));
  }

  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async upsertAvailability(insertAvailability: InsertAvailability): Promise<Availability> {
    // Check if availability already exists
    const [existing] = await db
      .select()
      .from(availability)
      .where(and(
        eq(availability.memberId, insertAvailability.memberId),
        eq(availability.groupId, insertAvailability.groupId)
      ));

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(availability)
        .set({
          selectedDates: insertAvailability.selectedDates || [],
          timeSlots: insertAvailability.timeSlots || {},
          updatedAt: new Date(),
        })
        .where(eq(availability.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new
      const [created] = await db
        .insert(availability)
        .values(insertAvailability)
        .returning();
      return created;
    }
  }

  async getGroupAvailability(groupId: string): Promise<Availability[]> {
    return await db.select().from(availability).where(eq(availability.groupId, groupId));
  }

  async getMemberAvailability(groupId: string, memberId: string): Promise<Availability | undefined> {
    const [memberAvailability] = await db
      .select()
      .from(availability)
      .where(and(
        eq(availability.groupId, groupId),
        eq(availability.memberId, memberId)
      ));
    return memberAvailability || undefined;
  }
}

export const storage = new DatabaseStorage();

// Initialize demo data on startup
initDemoData();
