package auth

import (
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Session struct {
	ID        string                 `json:"id"`
	UserID    primitive.ObjectID     `json:"user_id"`
	Username  string                 `json:"username"`
	Email     string                 `json:"email"`
	Role      string                 `json:"role"`
	CreatedAt time.Time             `json:"created_at"`
	ExpiresAt time.Time             `json:"expires_at"`
}

// In-memory session store - in production, you might want to use Redis or database
var sessionStore = make(map[string]*Session)
var sessionMutex = &sync.RWMutex{}

const sessionDuration = 7 * 24 * time.Hour // 7 days

func GenerateSessionID() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func CreateSession(userID primitive.ObjectID, username, email, role string) (*Session, error) {
	sessionID, err := GenerateSessionID()
	if err != nil {
		return nil, err
	}

	session := &Session{
		ID:        sessionID,
		UserID:    userID,
		Username:  username,
		Email:     email,
		Role:      role,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(sessionDuration),
	}

	sessionMutex.Lock()
	sessionStore[sessionID] = session
	sessionMutex.Unlock()

	return session, nil
}

func GetSession(sessionID string) (*Session, bool) {
	sessionMutex.RLock()
	session, exists := sessionStore[sessionID]
	sessionMutex.RUnlock()

	if !exists {
		return nil, false
	}

	// Check if session is expired
	if time.Now().After(session.ExpiresAt) {
		DeleteSession(sessionID)
		return nil, false
	}

	return session, true
}

func DeleteSession(sessionID string) {
	sessionMutex.Lock()
	delete(sessionStore, sessionID)
	sessionMutex.Unlock()
}

func CleanupExpiredSessions() {
	sessionMutex.Lock()
	defer sessionMutex.Unlock()

	now := time.Now()
	for id, session := range sessionStore {
		if now.After(session.ExpiresAt) {
			delete(sessionStore, id)
		}
	}
}

// Start a goroutine to clean up expired sessions periodically
func StartSessionCleanup() {
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		
		for {
			select {
			case <-ticker.C:
				CleanupExpiredSessions()
			}
		}
	}()
}