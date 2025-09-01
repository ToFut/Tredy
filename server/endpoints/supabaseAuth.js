const { reqBody, multiUserMode, makeJWT, userFromSession } = require("../utils/http");
const { User } = require("../models/user");
const { EventLogs } = require("../models/eventLogs");
const { getSupabaseUser } = require("../utils/supabase");
const { authConfig } = require("../utils/config/auth");

function supabaseAuthEndpoints(app) {
  if (!app) return;

  // Check if a token is valid
  app.post("/auth/check-token", async (request, response) => {
    try {
      const { token } = reqBody(request);
      
      if (!token) {
        return response.status(400).json({
          valid: false,
          error: "No token provided"
        });
      }

      // For now, we'll just check if the token exists
      // In a real implementation, you'd verify the JWT signature
      const isValid = token && token.length > 0;
      
      response.status(200).json({
        valid: isValid
      });
    } catch (e) {
      console.error("Error checking token:", e.message);
      response.status(500).json({
        valid: false,
        error: "Failed to check token"
      });
    }
  });

  // Authenticate with Supabase and sync/create local user
  app.post("/auth/supabase", async (request, response) => {
    try {
      // In development mode without Supabase, return dev user
      if (process.env.NODE_ENV === 'development' && !authConfig.supabase.enabled) {
        const devUser = authConfig.devUser;
        if (devUser) {
          const token = makeJWT(
            { 
              id: devUser.id, 
              username: devUser.username,
              role: devUser.role 
            },
            "30d"
          );
          
          return response.status(200).json({
            valid: true,
            user: devUser,
            token,
            message: "Development authentication successful"
          });
        }
      }
      
      const { supabaseToken, email, id } = reqBody(request);
      
      if (!id || !email) {
        return response.status(400).json({
          valid: false,
          error: "Invalid Supabase user data"
        });
      }

      // Create supabaseUser object from the provided data
      const supabaseUser = {
        id,
        email,
        user_metadata: {},
        app_metadata: { role: 'default' }
      };

      // Check if multi-user mode is enabled
      const isMultiUser = multiUserMode(response);
      if (!isMultiUser) {
        return response.status(401).json({
          valid: false,
          error: "Multi-user mode is not enabled"
        });
      }

      // Try to find existing user by Supabase ID
      let localUser = await User.getBySupabaseId(id);
      
      if (!localUser) {
        // Create new user from Supabase data
        const { user: newUser, error: createError } = await User.createFromSupabase(supabaseUser);
        
        if (createError) {
          console.error("Failed to create user from Supabase:", createError);
          return response.status(500).json({
            valid: false,
            error: createError
          });
        }
        
        localUser = newUser;
        
        // Log the new user creation
        await EventLogs.logEvent(
          "supabase_user_created",
          {
            supabase_id: supabaseUser.id,
            email: supabaseUser.email,
            local_user_id: localUser.id
          },
          localUser.id
        );
      } else {
        // Update existing user's last login
        await User.update(localUser.id, {
          lastUpdatedAt: new Date().toISOString()
        });
      }

      // Generate session token for the user
      const token = makeJWT(
        { 
          id: localUser.id, 
          username: localUser.username,
          role: localUser.role 
        },
        "30d"
      );

      // Log successful authentication
      await EventLogs.logEvent(
        "supabase_user_authenticated",
        {
          supabase_id: supabaseUser.id,
          local_user_id: localUser.id
        },
        localUser.id
      );

      response.status(200).json({
        valid: true,
        user: {
          id: localUser.id,
          username: localUser.username,
          email: localUser.email,
          role: localUser.role,
          supabaseId: localUser.supabaseId
        },
        token,
        message: "Authentication successful"
      });
    } catch (e) {
      console.error("Error authenticating with Supabase:", e.message);
      response.status(500).json({
        valid: false,
        error: "Authentication failed"
      });
    }
  });

  // Logout endpoint (handles both Supabase and local session cleanup)
  app.post("/auth/logout", async (request, response) => {
    try {
      const user = await userFromSession(request, response);
      
      if (user) {
        // Log the logout event
        await EventLogs.logEvent(
          "user_logout",
          {
            user_id: user.id,
            username: user.username,
            supabase_id: user.supabaseId
          },
          user.id
        );
        
        console.log(`[LOGOUT] User ${user.username} logged out successfully`);
      }
      
      response.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    } catch (e) {
      console.error("Error during logout:", e.message);
      response.status(200).json({
        success: true,
        message: "Logout completed"
      });
    }
  });
}

module.exports = { supabaseAuthEndpoints };