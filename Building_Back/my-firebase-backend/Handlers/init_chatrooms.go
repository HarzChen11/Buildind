package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	firebase "my-firebase-backend/Firebase"
)

// GET /api/init-chatrooms
func InitChatRoomsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	for floor := 1; floor <= 6; floor++ {
		docID := fmt.Sprintf("room_%d", floor)
		docRef := firebase.FirestoreClient.Collection("ChatRooms").Doc(docID)
		docSnap, err := docRef.Get(ctx)

		if err == nil && docSnap.Exists() {
			fmt.Printf("✅ 已存在：%s\n", docID)
			continue
		}

		_, err = docRef.Create(ctx, map[string]interface{}{
			"floor":        floor,
			"roomName":     fmt.Sprintf("Floor %d Chat Room", floor),
			"createdAt":    time.Now(),
			"participants": []interface{}{},
			"messages":     []interface{}{},
		})

		if err != nil {
			fmt.Printf("❌ 建立 %s 失敗：%v\n", docID, err)
		} else {
			fmt.Printf("✅ 已建立：%s\n", docID)
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("初始化完成"))
}
