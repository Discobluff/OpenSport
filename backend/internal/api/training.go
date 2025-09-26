package api

import (
	"context"
	"net/http"
	"time"
	"strconv"

	"opensport/backend/internal/database"
	"opensport/backend/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateTraining(c *gin.Context) {
	var req models.CreateTrainingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		println(err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, _ := c.Get("user_id")
	creatorID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	sportID, err := primitive.ObjectIDFromHex(req.SportID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sport ID"})
		return
	}

	// Check if user is admin of the sport
	sportCollection := database.GetCollection("sports")
	var sport models.Sport
	err = sportCollection.FindOne(context.TODO(), bson.M{"_id": sportID}).Decode(&sport)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sport not found"})
		return
	}

	if sport.AdminID != creatorID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only sport admin can create trainings"})
		return
	}
	maxParticipants, err := strconv.Atoi(req.MaxParticipants)
	if err != nil {
		maxParticipants = 0
	}

	training := models.Training{
		SportID:         sportID,
		Title:           req.Title,
		Description:     req.Description,
		Date:            req.Date,
		TimeStart:       req.TimeStart,
		TimeEnd:         req.TimeEnd,
		Location:        req.Location,
		MaxParticipants: maxParticipants,
		Participants:    []primitive.ObjectID{},
		CreatedBy:       creatorID,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	collection := database.GetCollection("trainings")
	result, err := collection.InsertOne(context.TODO(), training)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create training"})
		return
	}

	training.ID = result.InsertedID.(primitive.ObjectID)
	c.JSON(http.StatusCreated, gin.H{"training": training})
}

func GetTrainings(c *gin.Context) {
	sportID := c.Query("sport_id")
	filter := bson.M{}

	if sportID != "" {
		sportObjID, err := primitive.ObjectIDFromHex(sportID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sport ID"})
			return
		}
		filter["sport_id"] = sportObjID
	}

	collection := database.GetCollection("trainings")
	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch trainings"})
		return
	}
	defer cursor.Close(context.TODO())

	var trainings []models.Training
	if err := cursor.All(context.TODO(), &trainings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode trainings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"trainings": trainings})
}

func JoinTraining(c *gin.Context) {
	trainingID := c.Param("id")
	trainingObjID, err := primitive.ObjectIDFromHex(trainingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid training ID"})
		return
	}

	userID, _ := c.Get("user_id")
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetCollection("trainings")

	// Check if training exists and has capacity
	var training models.Training
	err = collection.FindOne(context.TODO(), bson.M{"_id": trainingObjID}).Decode(&training)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Training not found"})
		return
	}

	if training.MaxParticipants > 0 && len(training.Participants) >= training.MaxParticipants {
		c.JSON(http.StatusConflict, gin.H{"error": "Training is full"})
		return
	}

	// Add user to training participants
	_, err = collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": trainingObjID},
		bson.M{"$addToSet": bson.M{"participants": userObjID}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join training"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully joined training"})
}

func GetUserTrainings(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetCollection("trainings")
	cursor, err := collection.Find(context.TODO(), bson.M{"participants": userObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user trainings"})
		return
	}
	defer cursor.Close(context.TODO())

	var trainings []models.Training
	if err := cursor.All(context.TODO(), &trainings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode trainings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"trainings": trainings})
}
