package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	firebase "my-firebase-backend/Firebase"

	"cloud.google.com/go/firestore"
)

// HandlePing 定期接收前端回報使用者仍在線
func HandlePing(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID string `json:"userId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == "" {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	_, err := firebase.FirestoreClient.Collection("Users").
		Doc(req.UserID).
		Update(context.Background(), []firestore.Update{
			{Path: "cIsOnline", Value: true},
		})
	if err != nil {
		http.Error(w, "Failed to update", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
