package main

import (
	"log"
	"os"

	"opensport/backend/internal/api"
	"opensport/backend/internal/auth"
	"opensport/backend/internal/database"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize auth
	auth.Init()
	auth.InitOAuth()
	auth.StartSessionCleanup()

	// Connect to database
	if err := database.Connect(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.Disconnect()

	// Initialize Gin router
	r := gin.Default()

	// Get the auth functions to know if the user is the admin of the sport, either with trainingID or sportID in the route parameter
	var adminSportCheckerTrainingID auth.AdminSportChecker = api.IsUserAdminOfSportFromTrainingID
	var adminSportCheckerSportID auth.AdminSportChecker = api.IsUserAdminOfSportFromSportID

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Public routes
	r.POST("/api/auth/login", api.LoginUser)
	r.GET("/api/auth/google", api.GoogleOAuthLogin)
	r.GET("/api/auth/google/callback", api.GoogleOAuthCallback)
	r.POST("/api/auth/logout", api.LogoutUser)

	// Protected routes for logged users or admin only
	protected := r.Group("/api")
	protected.Use(auth.JWTAuthMiddleware())
	{
		// User routes
		protected.GET("/profile", api.GetProfile)
		protected.GET("/user/sports", api.GetUserSports)
		protected.GET("/user/trainings", api.GetUserTrainings)
		// Admin routes
		protected.GET("/users", auth.AdminOnly(), api.GetUsers)
		protected.POST("/users/:id/delete", auth.AdminOnly(), api.DeleteUser)
		protected.POST("/role", auth.AdminOnly(), api.ChangeRole)
		
		// Sport routes
		protected.GET("/sports", api.GetSports)
		// Licensed
		protected.POST("/sports/:id/join", auth.LicensedOnly(), api.JoinSport)
		// Member of the sport
		protected.GET("/sports/:id", auth.LicensedOnly(), api.GetSport)
		// Admin routes
		protected.POST("/sports", auth.AdminOnly(), api.CreateSport)
		protected.POST("/sports/:id/delete", auth.AdminOnly(), api.DeleteSport)
		protected.POST("/sports/:id/edit", auth.AdminOfSportOnly(adminSportCheckerSportID), api.EditSport)
		protected.POST("/sports/:id/remove/:idUser",  auth.AdminOfSportOnly(adminSportCheckerSportID), api.RemoveFromSport)
		protected.POST("/sports/:id/admin/:idUser",  auth.AdminOnly(), api.SetAdminSport)
		protected.POST("/sports/:id/member/:idUser",  auth.AdminOnly(), api.SetMemberSport)
		protected.GET("/sports/:id/trainings", api.GetTrainings)
		protected.POST("/sports/:id/trainings", auth.AdminOfSportOnly(adminSportCheckerSportID), api.CreateTraining)
		
		// Training routes
		protected.GET("/trainings/:id", api.GetTraining)
		protected.POST("/trainings/:id/join", auth.LicensedOnly(), api.JoinTraining)
		protected.POST("/trainings/:id/leave", api.LeaveTraining)
		protected.POST("/trainings/:id/delete", auth.AdminOfSportOnly(adminSportCheckerTrainingID), api.DeleteTraining)
		protected.POST("/trainings/:id/edit",auth.AdminOfSportOnly(adminSportCheckerTrainingID), api.EditTraining)
		protected.POST("/trainings/:id/remove/:idUser", auth.AdminOfSportOnly(adminSportCheckerTrainingID), api.RemoveFromTraining)
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}