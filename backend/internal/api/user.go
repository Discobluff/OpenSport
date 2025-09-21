package api

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"opensport/backend/internal/auth"
	"opensport/backend/internal/database"
	"opensport/backend/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func LoginUser(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	collection := database.GetCollection("users")
	var user models.User
	err := collection.FindOne(context.TODO(), bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, user.Username, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

func GetUsers(c *gin.Context){
	collection := database.GetCollection("users")
	var users []models.User

	filter := bson.M{}
	if role := c.Query("role"); role != "" {
		filter["role"] = role
	}

	if name := c.Query("name"); name != "" {
		filter["username"] = bson.M{"$regex": name, "$options": "i"}
	}

	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	defer cursor.Close(context.TODO())

	if err = cursor.All(context.TODO(), &users); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

func ChangeRole(c *gin.Context){
	var req struct {
		UserID string `json:"user_id"`
		Role   string `json:"role"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	objID, err := primitive.ObjectIDFromHex(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetCollection("users")
	update := bson.M{"$set": bson.M{"role": req.Role, "updated_at": time.Now()}}
	_, err = collection.UpdateOne(context.TODO(), bson.M{"_id": objID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User role updated successfully"})
}

func GetProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")
	objID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetCollection("users")
	var user models.User
	err = collection.FindOne(context.TODO(), bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if user was authenticated via session cookie (no Authorization header)
	authHeader := c.GetHeader("Authorization")
	sessionCookie, sessionErr := c.Cookie("session_id")
	
	// If no Authorization header but valid session cookie, generate JWT token for frontend compatibility
	if authHeader == "" && sessionErr == nil && sessionCookie != "" {
		username, _ := c.Get("username")
		email, _ := c.Get("email") 
		role, _ := c.Get("role")
		
		jwtToken, err := auth.GenerateToken(user.ID, username.(string), email.(string), role.(string))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"user": user,
			"token": jwtToken,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

func GoogleOAuthLogin(c *gin.Context) {
	// Generate random state parameter
	state := make([]byte, 16)
	rand.Read(state)
	stateString := hex.EncodeToString(state)
	
	// Store state in session or cookie for validation
	c.SetCookie("oauth_state", stateString, 600, "/", "", false, true) // 10 minutes
	
	url := auth.GetGoogleOAuthURL(stateString)
	c.JSON(http.StatusOK, gin.H{"url": url})
}

func GoogleOAuthCallback(c *gin.Context) {
	// Verify state parameter
	stateCookie, err := c.Cookie("oauth_state")
	if err != nil || stateCookie != c.Query("state") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state parameter"})
		return
	}
	
	// Clear the state cookie
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)
	
	// Exchange code for token
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No authorization code provided"})
		return
	}
	
	token, err := auth.ExchangeCodeForToken(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange code for token"})
		return
	}
	
	// Get user info from Google
	userInfo, err := auth.GetGoogleUserInfo(token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}
	
	email, ok := userInfo["email"].(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to get email from Google"})
		return
	}
	
	// Check if email domain is allowed
	if !auth.IsValidDomain(email) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email domain not allowed"})
		return
	}
	
	googleID, ok := userInfo["id"].(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to get Google ID"})
		return
	}
	
	name, _ := userInfo["name"].(string)
	picture, _ := userInfo["picture"].(string)
	
	// Check if user exists
	collection := database.GetCollection("users")
	var user models.User
	err = collection.FindOne(context.TODO(), bson.M{
		"$or": []bson.M{
			{"email": email},
			{"google_id": googleID},
		},
	}).Decode(&user)
	
	if err != nil {
		// User doesn't exist, create new user
		user = models.User{
			Username:  name,
			Email:     email,
			GoogleID:  googleID,
			Picture:   picture,
			Role:      "Non licencié",
			Sports:    []primitive.ObjectID{},
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		
		result, err := collection.InsertOne(context.TODO(), user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
		
		user.ID = result.InsertedID.(primitive.ObjectID)
	} else {
		// User exists, update their info
		user.Username = name
		user.Picture = picture
		user.UpdatedAt = time.Now()
		
		_, err = collection.UpdateOne(
			context.TODO(),
			bson.M{"_id": user.ID},
			bson.M{"$set": bson.M{
				"username":   user.Username,
				"picture":    user.Picture,
				"updated_at": user.UpdatedAt,
			}},
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
			return
		}
	}
	
	// Create session
	session, err := auth.CreateSession(user.ID, user.Username, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}
	
	// Set session cookie
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("session_id", session.ID, int(time.Hour*24*7/time.Second), "/", "", false, true) // 7 days
	
	// Also generate JWT token for backward compatibility
	jwtToken, err := auth.GenerateToken(user.ID, user.Username, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"token": jwtToken,
		"user":  user,
	})
}

func LogoutUser(c *gin.Context) {
	// Get session ID from cookie
	sessionCookie, err := c.Cookie("session_id")
	if err == nil && sessionCookie != "" {
		auth.DeleteSession(sessionCookie)
	}
	
	// Clear the session cookie
	c.SetCookie("session_id", "", -1, "/", "", false, true)
	
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}