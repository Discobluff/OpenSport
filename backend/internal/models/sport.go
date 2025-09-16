package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Sport struct {
	ID          primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Name        string               `bson:"name" json:"name"`
	Description string               `bson:"description" json:"description"`
	AdminID     primitive.ObjectID   `bson:"admin_id" json:"admin_id"`
	Members     []primitive.ObjectID `bson:"members" json:"members"`
	CreatedAt   time.Time            `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time            `bson:"updated_at" json:"updated_at"`
}

type CreateSportRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}