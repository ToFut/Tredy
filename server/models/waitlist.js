const { prisma } = require("../utils/prisma");

class Waitlist {
  static async add(email) {
    try {
      // Check if email already exists
      const existing = await prisma.waitlist.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existing) {
        return { success: false, error: "Email already on waitlist" };
      }

      // Add to waitlist
      const waitlistEntry = await prisma.waitlist.create({
        data: {
          email: email.toLowerCase(),
          joinedAt: new Date(),
        }
      });

      return { success: true, data: waitlistEntry };
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      return { success: false, error: "Failed to add to waitlist" };
    }
  }

  static async getAll() {
    try {
      const entries = await prisma.waitlist.findMany({
        orderBy: { joinedAt: 'desc' }
      });
      return { success: true, data: entries };
    } catch (error) {
      console.error("Error fetching waitlist:", error);
      return { success: false, error: "Failed to fetch waitlist" };
    }
  }

  static async getCount() {
    try {
      const count = await prisma.waitlist.count();
      return { success: true, count };
    } catch (error) {
      console.error("Error getting waitlist count:", error);
      return { success: false, error: "Failed to get waitlist count" };
    }
  }

  static async remove(email) {
    try {
      await prisma.waitlist.delete({
        where: { email: email.toLowerCase() }
      });
      return { success: true };
    } catch (error) {
      console.error("Error removing from waitlist:", error);
      return { success: false, error: "Failed to remove from waitlist" };
    }
  }
}

module.exports = { Waitlist };