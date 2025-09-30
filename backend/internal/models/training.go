package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

type Training struct {
	ID              primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	SportID         primitive.ObjectID   `bson:"sport_id" json:"sport_id"`
	Title           string               `bson:"title" json:"title"`
	Description     string               `bson:"description" json:"description"`
	Date            string               `bson:"date" json:"date"`
	TimeStart       string               `bson:"time_start" json:"time_start"`
	TimeEnd         string               `bson:"time_end" json:"time_end"`
	Location        string               `bson:"location" json:"location"`
	MaxParticipants int               `bson:"max_participants" json:"max_participants"`
	Presents        []primitive.ObjectID `bson:"presents" json:"presents"`
	Absents         []primitive.ObjectID `bson:"absents" json:"absents"`
	CreatedBy       primitive.ObjectID   `bson:"created_by" json:"created_by"`
	CreatedAt       time.Time            `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time            `bson:"updated_at" json:"updated_at"`
}

type CreateTrainingRequest struct {
	SportID         string    `json:"sport_id" binding:"required"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	Date        	string    `json:"date" binding:"required"`
	TimeStart		string	  `json:"time_start" binding:"required"`
	TimeEnd			string	  `json:"time_end" binding:"required"`
	Location        string    `json:"location" binding:"required"`
	MaxParticipants string    `json:"max_participants"`
}
