package auth

import (
	"net/http"
	"strings"
	"github.com/gin-gonic/gin"
)

func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// First try to get session from cookie
		sessionCookie, err := c.Cookie("session_id")
		if err == nil && sessionCookie != "" {
			session, exists := GetSession(sessionCookie)
			if exists {
				// Store user information in context
				c.Set("user_id", session.UserID.Hex())
				c.Set("username", session.Username)
				c.Set("email", session.Email)
				c.Set("role", session.Role)
				c.Next()
				return
			}
		}

		// Fall back to JWT token authentication
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header or session cookie required"})
			c.Abort()
			return
		}

		// Check if the header starts with "Bearer "
		const bearerPrefix = "Bearer "
		if !strings.HasPrefix(authHeader, bearerPrefix) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := authHeader[len(bearerPrefix):]
		claims, err := ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Store user information in context
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		
		c.Next()
	}
}

func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "Admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès Admin requis"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func LicensedOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || (role != "Licencié" && role != "Admin"){
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès licencié requis"})
			c.Abort()
			return
		}
		c.Next()
	}
}

// The adminSportChecker is a function which take in first argument the userID, and in the second argument, either the sportID or the trainingID
func AdminOfSportOnly(adminSportChecker AdminSportChecker) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if exists && role == "Admin" {
			c.Next()
			return
		}

		paramID := c.Param("id")
		if paramID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing training id"})
			c.Abort()
			return
		}

		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User non auth"})
			c.Abort()
			return
		}
		
		isAdmin, err := adminSportChecker(userID.(string), paramID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Serveur error"})
			c.Abort()
			return
		}

		if !isAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Sport admin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}