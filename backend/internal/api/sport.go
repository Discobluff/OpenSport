package api

import (
	"context"
	"net/http"
	"time"

	"opensport/backend/internal/database"
	"opensport/backend/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateSport(c *gin.Context) {
	var req models.CreateSportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	adminID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	sport := models.Sport{
		Name:        req.Name,
		Description: req.Description,
		AdminID:     adminID,
		Members:     []primitive.ObjectID{adminID},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	collection := database.GetCollection("sports")
	result, err := collection.InsertOne(context.TODO(), sport)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sport"})
		return
	}

	sport.ID = result.InsertedID.(primitive.ObjectID)
	c.JSON(http.StatusCreated, gin.H{"sport": sport})
}

func GetSport(c *gin.Context) {
	sportID := c.Param("id")
	sportObjID, err := primitive.ObjectIDFromHex(sportID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sport ID"})
		return
	}	
	collection := database.GetCollection("sports")
	var sport models.Sport
	err = collection.FindOne(context.TODO(), bson.M{"_id": sportObjID}).Decode(&sport)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sport not found"})
		return
	}
	memberCollection := database.GetCollection("users")
	var members []map[string]interface{}
	for _, memberID := range sport.Members {
		var member struct {
			ID   primitive.ObjectID `bson:"_id"`
			Name string             `bson:"username"`
		}
		err := memberCollection.FindOne(context.TODO(), bson.M{"_id": memberID}).Decode(&member)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch member details"})
			return
		}
		members = append(members, map[string]interface{}{
			"id":   member.ID.Hex(),
			"name": member.Name,
		})
	}
	c.JSON(http.StatusOK, gin.H{"sport": sport, "members":members})
}

func GetSports(c *gin.Context) {
	collection := database.GetCollection("sports")
	cursor, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sports"})
		return
	}
	defer cursor.Close(context.TODO())

	var sports []models.Sport
	if err := cursor.All(context.TODO(), &sports); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode sports"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sports": sports})
}

func DeleteSport(c *gin.Context) {
	sportID := c.Param("id")
	sportObjID, err := primitive.ObjectIDFromHex(sportID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sport ID"})
		return
	}

	collection := database.GetCollection("sports")
	result, err := collection.DeleteOne(context.TODO(), bson.M{"_id": sportObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete sport"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sport not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sport deleted successfully"})
}

func JoinSport(c *gin.Context) {
	sportID := c.Param("id")
	sportObjID, err := primitive.ObjectIDFromHex(sportID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sport ID"})
		return
	}

	userID, _ := c.Get("user_id")
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Add user to sport members
	sportCollection := database.GetCollection("sports")
	_, err = sportCollection.UpdateOne(
		context.TODO(),
		bson.M{"_id": sportObjID},
		bson.M{"$addToSet": bson.M{"members": userObjID}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join sport"})
		return
	}

	// Add sport to user's sports
	userCollection := database.GetCollection("users")
	_, err = userCollection.UpdateOne(
		context.TODO(),
		bson.M{"_id": userObjID},
		bson.M{"$addToSet": bson.M{"sports": sportObjID}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user sports"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully joined sport"})
}

func GetUserSports(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetCollection("sports")
	cursor, err := collection.Find(context.TODO(), bson.M{"members": userObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user sports"})
		return
	}
	defer cursor.Close(context.TODO())

	var sports []models.Sport
	if err := cursor.All(context.TODO(), &sports); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode sports"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sports": sports})
}