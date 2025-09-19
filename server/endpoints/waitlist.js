const { Waitlist } = require("../models/waitlist");

function waitlistEndpoints(app) {
  if (!app) return;

  // Add email to waitlist
  app.post("/api/waitlist", async (request, response) => {
    try {
      const { email } = request.body;

      if (!email || !email.includes("@")) {
        return response.status(400).json({
          error: "Please provide a valid email address",
        });
      }

      const result = await Waitlist.add(email);

      if (result.success) {
        response.status(200).json({
          success: true,
          message: "Successfully added to waitlist",
          data: result.data,
        });
      } else {
        response.status(400).json({
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Waitlist endpoint error:", error);
      response.status(500).json({
        error: "Internal server error",
      });
    }
  });

  // Get waitlist count (public endpoint)
  app.get("/api/waitlist/count", async (request, response) => {
    try {
      const result = await Waitlist.getCount();

      if (result.success) {
        response.status(200).json({
          count: result.count,
        });
      } else {
        response.status(500).json({
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Waitlist count endpoint error:", error);
      response.status(500).json({
        error: "Internal server error",
      });
    }
  });

  // Admin endpoint to get all waitlist entries
  app.get("/api/admin/waitlist", async (request, response) => {
    try {
      // Add authentication check here if needed
      const result = await Waitlist.getAll();

      if (result.success) {
        response.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        response.status(500).json({
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Admin waitlist endpoint error:", error);
      response.status(500).json({
        error: "Internal server error",
      });
    }
  });

  // Admin endpoint to remove email from waitlist
  app.delete("/api/admin/waitlist/:email", async (request, response) => {
    try {
      const { email } = request.params;

      const result = await Waitlist.remove(email);

      if (result.success) {
        response.status(200).json({
          success: true,
          message: "Email removed from waitlist",
        });
      } else {
        response.status(400).json({
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Remove waitlist endpoint error:", error);
      response.status(500).json({
        error: "Internal server error",
      });
    }
  });
}

module.exports = { waitlistEndpoints };
