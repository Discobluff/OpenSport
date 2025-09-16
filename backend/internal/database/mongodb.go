package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Database struct {
	Client *mongo.Client
	DB     *mongo.Database
}

var DB *Database

func Connect() error {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "opensport"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(mongoURI)

    clientOpts.SetAuth(options.Credential{
        Username:   "admin",
        Password:   "password123",
        AuthSource: "admin",
    })

	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping the database
	if err := client.Ping(ctx, nil); err != nil {
		return fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	database := client.Database(dbName)
	
	DB = &Database{
		Client: client,
		DB:     database,
	}

	log.Printf("Connected to MongoDB database: %s", dbName)
	return nil
}

func Disconnect() error {
	if DB != nil && DB.Client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		return DB.Client.Disconnect(ctx)
	}
	return nil
}

func GetCollection(name string) *mongo.Collection {
	return DB.DB.Collection(name)
}