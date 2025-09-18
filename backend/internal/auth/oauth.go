package auth

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"os"
	"strings"
	"log"
	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var googleOAuthConfig *oauth2.Config

func InitOAuth() {
	err := godotenv.Load("../.env")
	if err != nil{
		log.Fatal("Erreur chargement .env:", err)
	}	
	googleOAuthConfig = &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		Scopes:       []string{"openid", "profile", "email"},
		Endpoint:     google.Endpoint,
	}
}

func GetGoogleOAuthURL(state string) string {
	return googleOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

func ExchangeCodeForToken(code string) (*oauth2.Token, error) {
	return googleOAuthConfig.Exchange(context.Background(), code)
}

func GetGoogleUserInfo(token *oauth2.Token) (map[string]interface{}, error) {
	client := googleOAuthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var userInfo map[string]interface{}
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, err
	}

	return userInfo, nil
}

func IsValidDomain(email string) bool {
	allowedDomain := os.Getenv("ALLOWED_EMAIL_DOMAIN")
	if allowedDomain == "" {
		return true // If no domain restriction is set, allow all
	}
	
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return false
	}
	
	domain := parts[1]
	return domain == allowedDomain
}