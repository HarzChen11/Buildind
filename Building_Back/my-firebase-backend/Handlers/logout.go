package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	firebase "my-firebase-backend/Firebase"

	"cloud.google.com/go/firestore"
)

// HandleLogout 接收 sendBeacon 傳來的 userId，標記使用者為離線
func HandleLogout(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID string `json:"userId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	_, err := firebase.FirestoreClient.Collection("Users").
		Doc(req.UserID).
		Update(context.Background(), []firestore.Update{
			{Path: "cIsOnline", Value: false},
		})

	if err != nil {
		http.Error(w, "Failed to update status", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
