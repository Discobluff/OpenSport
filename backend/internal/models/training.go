package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Training struct {
	ID          primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	SportID     primitive.ObjectID   `bson:"sport_id" json:"sport_id"`
	Title       string               `bson:"title" json:"title"`
	Description string               `bson:"description" json:"description"`
	DateTime    time.Time            `bson:"date_time" json:"date_time"`
	Duration    int                  `bson:"duration" json:"duration"` // duration in minutes
	Location    string               `bson:"location" json:"location"`
	MaxParticipants int              `bson:"max_participants" json:"max_participants"`
	Participants []primitive.ObjectID `bson:"participants" json:"participants"`
	CreatedBy   primitive.ObjectID   `bson:"created_by" json:"created_by"`
	CreatedAt   time.Time            `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time            `bson:"updated_at" json:"updated_at"`
}

type CreateTrainingRequest struct {
	SportID         string    `json:"sport_id" binding:"required"`
	Title           string    `json:"title" binding:"required"`
	Description     string    `json:"description"`
	DateTime        time.Time `json:"date_time" binding:"required"`
	Duration        int       `json:"duration" binding:"required"`
	Location        string    `json:"location" binding:"required"`
	MaxParticipants int       `json:"max_participants"`
}