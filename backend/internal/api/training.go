package api

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"opensport/backend/internal/database"
	"opensport/backend/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
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

	// if !creatorID in sport.AdminsID {
	// 	c.JSON(http.StatusForbidden, gin.H{"error": "Only sport admin can create trainings"})
	// 	return
	// }
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
		Presents:        []primitive.ObjectID{},
		Absents:         []primitive.ObjectID{},
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

func DeleteTraining(c *gin.Context) {
	trainingID := c.Param("id")
	trainingObjID, err := primitive.ObjectIDFromHex(trainingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid training ID"})
		return
	}

	collection := database.GetCollection("trainings")
	resultDelete, err := collection.DeleteOne(context.TODO(), bson.M{"_id": trainingObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete training"})
		return
	}

	if resultDelete.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Training not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Training deleted successfully"})
}

func EditTraining(c *gin.Context) {
	var req struct {
		Title           string `json:"title"`
		Description     string `json:"description"`
		Date            string `json:"date"`
		Location        string `json:"location"`
		TimeStart       string `json:"time_start"`
		TimeEnd         string `json:"time_end"`
		MaxParticipants string `json:"max_participants"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	trainingID := c.Param("id")
	trainingObjID, err := primitive.ObjectIDFromHex(trainingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid training ID"})
		return
	}

	maxParticipants, err := strconv.Atoi(req.MaxParticipants)
	if err != nil {
		maxParticipants = 0
	}

	collection := database.GetCollection("trainings")
	update := bson.M{"$set": bson.M{"title": req.Title, "description": req.Description, "date":req.Date, "time_start":req.TimeStart, "time_end":req.TimeEnd, "location":req.Location, "max_participants":maxParticipants, "updated_at": time.Now()}}
	_, err = collection.UpdateOne(context.TODO(), bson.M{"_id": trainingObjID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to edit training"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Training edited successfully"})
}

func GetTraining(c *gin.Context) {
	trainingID := c.Param("id")
	trainingObjID, err := primitive.ObjectIDFromHex(trainingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid training ID"})
		return
	}
	collection := database.GetCollection("trainings")
	var training models.Training
	err = collection.FindOne(context.TODO(), bson.M{"_id": trainingObjID}).Decode(&training)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Training not found"})
		return
	}
	userCollection := database.GetCollection("users")
	var usersPresents []models.User
	if len(training.Presents) > 0 {
		cursor, err := userCollection.Find(context.TODO(), bson.M{"_id": bson.M{"$in": training.Presents}})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user details"})
			return
		}
		defer cursor.Close(context.TODO())

		if err := cursor.All(context.TODO(), &usersPresents); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode user details"})
			return
		}
	}

	var usersAbsents []models.User
	if len(training.Absents) > 0 {
		cursor, err := userCollection.Find(context.TODO(), bson.M{"_id": bson.M{"$in": training.Absents}})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user details"})
			return
		}
		defer cursor.Close(context.TODO())

		if err := cursor.All(context.TODO(), &usersAbsents); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode user details"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"training": training, "presents": usersPresents, "absents": usersAbsents})
}

func GetTrainings(c *gin.Context) {
	sportID := c.Param("id")
	filter := bson.M{}

	if sportID != "" {
		sportObjID, err := primitive.ObjectIDFromHex(sportID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sport ID"})
			println("a")
			return
		}
		filter["sport_id"] = sportObjID
	}

	collection := database.GetCollection("trainings")
	opts := options.Find().SetSort(bson.D{{Key: "date", Value: -1}}) // Sort by date in descending order
	cursor, err := collection.Find(context.TODO(), filter, opts)
	if err != nil {
		println("b")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch trainings"})
		return
	}
	defer cursor.Close(context.TODO())

	var trainings []models.Training
	if err := cursor.All(context.TODO(), &trainings); err != nil {
		println("c",err)
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

	if training.MaxParticipants > 0 && len(training.Presents) >= training.MaxParticipants {
		c.JSON(http.StatusConflict, gin.H{"error": "Training is full"})
		return
	}

	// Add user to training participants
	_, err = collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": trainingObjID},
		bson.M{
			"$addToSet": bson.M{"presents": userObjID},
			"$pull":     bson.M{"absents": userObjID},
		},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join training"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully joined training"})
}

func RemoveFromTraining(c *gin.Context) {
	trainingID := c.Param("id")
	trainingObjID, err := primitive.ObjectIDFromHex(trainingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid training ID"})
		return
	}

	userID := c.Param("idUser")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetCollection("trainings")

	// Check if training exists
	var training models.Training
	err = collection.FindOne(context.TODO(), bson.M{"_id": trainingObjID}).Decode(&training)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Training not found"})
		return
	}

	// Remove user from training participants
	_, err = collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": trainingObjID},
		bson.M{
			"$addToSet": bson.M{"absents": userObjID},
			"$pull":     bson.M{"presents": userObjID},
		},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to leave training"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully left training"})
}

func LeaveTraining(c *gin.Context) {
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

	// Remove user from training participants
	_, err = collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": trainingObjID},
		bson.M{
			"$addToSet": bson.M{"absents": userObjID},
			"$pull":     bson.M{"presents": userObjID},
		},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to leave training"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully left training"})
}

func GetUserTrainings(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userObjID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetCollection("trainings")
	cursor, err := collection.Find(context.TODO(), bson.M{"presents": userObjID})
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
