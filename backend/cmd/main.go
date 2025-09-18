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
	r.GET("/api/sports", api.GetSports)
	r.GET("/api/trainings", api.GetTrainings)

	// Protected routes
	protected := r.Group("/api")
	protected.Use(auth.JWTAuthMiddleware())
	{
		// User routes
		protected.GET("/profile", api.GetProfile)
		protected.GET("/user/sports", api.GetUserSports)
		protected.GET("/user/trainings", api.GetUserTrainings)
		
		// Sport routes
		protected.POST("/sports", api.CreateSport)
		protected.POST("/sports/:id/join", api.JoinSport)
		
		// Training routes
		protected.POST("/trainings", api.CreateTraining)
		protected.POST("/trainings/:id/join", api.JoinTraining)
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