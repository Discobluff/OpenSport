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
	"go.mongodb.org/mongo-driver/mongo"
	"slices"
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
		AdminsID:    []primitive.ObjectID{adminID},
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

func SetMemberSport(c *gin.Context) {
	sportID := c.Param("id")
	sportObjID, err := primitive.ObjectIDFromHex(sportID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sport ID"})
		return
	}

	userID := c.Param("idUser")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetCollection("sports")
	_, err = collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": sportObjID},
		bson.M{
			"$pull":     bson.M{"admins_id": userObjID},
		},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove user from admin list"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Successfully removed user from admin list"})
}

type AdminService struct {
    collection *mongo.Collection
}


func NewAdminService() *AdminService {
	return &AdminService{
		collection: database.GetCollection("sports"),
	}
}

func IsUserAdminOfSportFromTrainingID(userID, trainingID string) (bool, error) {
	trainingObjID, err := primitive.ObjectIDFromHex(trainingID)
	if err != nil {
		return false, err
	}

	var training struct {
		SportID primitive.ObjectID `bson:"sport_id"`
	}

	trainingCollection := database.GetCollection("trainings")
	err = trainingCollection.FindOne(context.TODO(), bson.M{"_id": trainingObjID}).Decode(&training)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return false, nil
		}
		return false, err
	}

	sportObjID := training.SportID

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return false, err
	}

	var sport struct {
		AdminsID []primitive.ObjectID `bson:"admins_id"`
	}

	sportConnection := database.GetCollection("sports")
	err = sportConnection.FindOne(context.TODO(), bson.M{"_id": sportObjID}).Decode(&sport)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return false, nil
		}
		return false, err
	}

	if slices.Contains(sport.AdminsID, userObjID) {
			return true, nil
		}

	return false, nil
}

func IsUserAdminOfSportFromSportID(userID, sportID string) (bool, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return false, err
	}

	sportObjID, err := primitive.ObjectIDFromHex(sportID)
	if err != nil {
		return false, err
	}

	var sport struct {
		AdminsID []primitive.ObjectID `bson:"admins_id"`
	}

	sportConnection := database.GetCollection("sports")
	err = sportConnection.FindOne(context.TODO(), bson.M{"_id": sportObjID}).Decode(&sport)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return false, nil
		}
		return false, err
	}

	if slices.Contains(sport.AdminsID, userObjID) {
			return true, nil
		}

	return false, nil
}

func SetAdminSport(c *gin.Context) {
	sportID := c.Param("id")
	sportObjID, err := primitive.ObjectIDFromHex(sportID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sport ID"})
		return
	}

	userID := c.Param("idUser")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetCollection("sports")
	_, err = collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": sportObjID},
		bson.M{
			"$addToSet":     bson.M{"admins_id": userObjID},
		},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add user to admin list"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Successfully added user to admin list"})
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

func RemoveFromSport(c *gin.Context) {
	sportID := c.Param("id")
	sportObjID, err := primitive.ObjectIDFromHex(sportID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sport ID"})
		return
	}

	userID := c.Param("idUser")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	collection := database.GetCollection("sports")

	// Check if sport exists
	var sport models.Sport
	err = collection.FindOne(context.TODO(), bson.M{"_id": sportObjID}).Decode(&sport)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sport not found"})
		return
	}

	// Remove user from sport participants
	_, err = collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": sportObjID},
		bson.M{
			"$pull":     bson.M{"members": userObjID},
		},
	)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from sport"})
		return
	}

	//Remove from the member from the sports trainings
	trainingCollection := database.GetCollection("trainings")
	_, err = trainingCollection.UpdateMany(
		context.TODO(),
		bson.M{"sport_id": sportObjID},
		bson.M{"$pull": bson.M{"presents": userObjID, "absents": userObjID}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove member from sport trainings"})
		return
	}
	
	// Remove sport from user list
	collectionUser := database.GetCollection("users")
	_, err = collectionUser.UpdateOne(
		context.TODO(),
		bson.M{"_id": userObjID},
		bson.M{
			"$pull":     bson.M{"sports": sportObjID},
		},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove sport from user list"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Successfully removed user from sport"})
}

func LeaveSport(c *gin.Context) {
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
	collection := database.GetCollection("sports")

	// Check if sport exists
	var sport models.Sport
	err = collection.FindOne(context.TODO(), bson.M{"_id": sportObjID}).Decode(&sport)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sport not found"})
		return
	}

	// Remove user from sport participants
	_, err = collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": sportObjID},
		bson.M{
			"$pull":     bson.M{"members": userObjID},
		},
	)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove from sport"})
		return
	}

	//Remove from the member from the sports trainings
	trainingCollection := database.GetCollection("trainings")
	_, err = trainingCollection.UpdateMany(
		context.TODO(),
		bson.M{"sport_id": sportObjID},
		bson.M{"$pull": bson.M{"presents": userObjID, "absents": userObjID}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove member from sport trainings"})
		return
	}
	
	// Remove sport from user list
	collectionUser := database.GetCollection("users")
	_, err = collectionUser.UpdateOne(
		context.TODO(),
		bson.M{"_id": userObjID},
		bson.M{
			"$pull":     bson.M{"sports": sportObjID},
		},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove sport from user list"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Successfully removed user from sport"})
}

func EditSport(c *gin.Context) {
	var req struct {
		Name string `json:"name"`
		Description   string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}	

	sportID := c.Param("id")
	sportObjID, err := primitive.ObjectIDFromHex(sportID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sport ID"})
		return
	}
	
	collection := database.GetCollection("sports")
	update := bson.M{"$set": bson.M{"name": req.Name, "description": req.Description, "updated_at": time.Now()}}
	_, err = collection.UpdateOne(context.TODO(), bson.M{"_id": sportObjID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to edit sport"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sport edited successfully"})
}

func DeleteSport(c *gin.Context) {
	sportID := c.Param("id")
	sportObjID, err := primitive.ObjectIDFromHex(sportID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sport ID"})
		return
	}

	collection := database.GetCollection("sports")
	resultDelete, err := collection.DeleteOne(context.TODO(), bson.M{"_id": sportObjID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete sport"})
		return
	}

	if resultDelete.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sport not found"})
		return
	}

	// Delete the sport in the list of the players who joined it
	collection = database.GetCollection("users")
	collection.UpdateMany(context.TODO(), bson.M{"sports": sportObjID}, bson.M{"$pull": bson.M{"sports": sportObjID}})

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
	userID := c.Param("id")
	userObjID, err := primitive.ObjectIDFromHex(userID)
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