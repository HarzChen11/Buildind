package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	firebase "my-firebase-backend/Firebase"
)

// 對應樓層與聊天室名稱
var floorLabels = map[int]string{
	1: "OUTSIDE",
	2: "Library",
	3: "Cafe",
	4: "Cinema",
	5: "Gym",
	6: "Rooftop",
	//下個樓層自己命名
}

func InitChatRoomsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	for floor, label := range floorLabels {
		docRef := firebase.FirestoreClient.Collection("ChatRooms").Doc(label)
		docSnap, err := docRef.Get(ctx)

		if err == nil && docSnap.Exists() {
			fmt.Printf("✅ 已存在：%s\n", label)
			continue
		}

		_, err = docRef.Create(ctx, map[string]interface{}{
			"floor":     floor,
			"roomName":  fmt.Sprintf("%s Chat Room", label),
			"createdAt": time.Now(),
		})

		if err != nil {
			fmt.Printf("❌ 建立 %s 失敗：%v\n", label, err)
		} else {
			fmt.Printf("✅ 已建立：%s\n", label)
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("聊天室初始化完成 ✅"))
}
