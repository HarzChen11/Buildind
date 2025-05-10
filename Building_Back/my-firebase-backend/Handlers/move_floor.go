package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	firebase "my-firebase-backend/Firebase"

	"cloud.google.com/go/firestore"
)

// 移動使用者至新樓層
func HandleMoveFloor(w http.ResponseWriter, r *http.Request) {
	// 跨域設定（若你有全域處理則可以省略）
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "POST")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	var req struct {
		UserID string `json:"userId"`
		Floor  int    `json:"floor"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "無法解析請求", http.StatusBadRequest)
		return
	}

	_, err := firebase.FirestoreClient.Collection("Users").
		Doc(req.UserID).
		Update(context.Background(), []firestore.Update{
			{Path: "cCurrentFloor", Value: req.Floor},
		})

	if err != nil {
		http.Error(w, "更新樓層失敗", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message":"樓層已更新"}`))
}
