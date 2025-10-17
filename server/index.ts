import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { initializeDatabase } from "./initialize-database";

//CONSTANTS


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Remove direct static file access to uploads for security
// app.use('/public', express.static('public')); // REMOVED for security
// Only serve non-upload public files (like favicon, etc.)
app.use('/public', (req, res, next) => {
  // Block direct access to secure uploads (yearbooks only - memories are freely accessible)
  if (req.path.includes('/uploads/yearbooks/') || req.path.includes('/uploads/accreditation/')) {
    return res.status(403).json({ 
      message: 'Direct access to secure content is not allowed. Please use secure image endpoints.' 
    });
  }
  // Allow other public files including memories
  express.static('public')(req, res, next);
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});


app.get("/api/alumni-badges/:userId", async (req, res) => {
  const { userId } = req.params;
  const badges = await storage.getAlumniBadgesByUser(userId);
  res.json(badges);
});





(async () => {
  // Initialize database tables and default data
  await initializeDatabase();
  
  // Background job: Clean up expired upload code notifications every 30 minutes
  const cleanupExpiredNotifications = async () => {
    try {
      const allNotifications = await storage.getAllNotifications();
      const now = new Date();
      
      let deletedCount = 0;
      for (const notification of allNotifications) {
        if (notification.type === 'upload_code_created' && notification.expiresAt) {
          const expiryDate = new Date(notification.expiresAt);
          if (expiryDate < now) {
            await storage.deleteNotification(notification.id);
            deletedCount++;
          }
        }
      }
      
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} expired upload code notifications`);
      }
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  };
  
  // Run cleanup immediately on startup
  await cleanupExpiredNotifications();
  
  // Schedule cleanup every 30 minutes
  setInterval(cleanupExpiredNotifications, 30 * 60 * 1000);
  
  // Background job: Clean up expired test accounts every hour
  const cleanupExpiredTestAccounts = async () => {
    try {
      const now = new Date();
      
      // Find all expired test accounts using storage methods
      const allUsers = await storage.getAllUsers();
      const expiredUsers = allUsers.filter(user => 
        user.testAccountExpiresAt && new Date(user.testAccountExpiresAt) < now
      );
      
      let deletedCount = 0;
      for (const user of expiredUsers) {
        try {
          // Get the user's school if they're a school account
          if (user.userType === 'school' && user.schoolId) {
            const school = await storage.getSchool(user.schoolId);
            if (school) {
              // Delete yearbooks associated with this school
              // Note: deleteYearbook method not implemented in storage
              // const yearbooks = await storage.getYearbooksBySchool(school.id);
              // for (const yearbook of yearbooks) {
              //   await storage.deleteYearbook(yearbook.id);
              // }
              
              // Delete the school (if there's a delete method)
              await storage.deleteSchool(school.id);
            }
          }
          
          // Delete login activity
          // Note: deleteLoginActivitiesByUser method not implemented in storage
          // await storage.deleteLoginActivitiesByUser(user.id);
          
          // Delete the user
          await storage.deleteUser(user.id);
          
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting expired test account ${user.username}:`, error);
        }
      }
      
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} expired test accounts`);
      }
    } catch (error) {
      console.error('Error cleaning up expired test accounts:', error);
    }
  };
  
  // Run cleanup immediately on startup
  await cleanupExpiredTestAccounts();
  
  // Schedule cleanup every hour (3600000ms)
  setInterval(cleanupExpiredTestAccounts, 60 * 60 * 1000);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const nodeEnv = process.env.NODE_ENV || "development";
  if (nodeEnv === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
