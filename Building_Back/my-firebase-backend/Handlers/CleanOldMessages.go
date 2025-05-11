package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	firebase "my-firebase-backend/Firebase"
)

// CleanExpiredMessages 是 HTTP handler，可直接被 API 路由呼叫
func CleanExpiredMessages(w http.ResponseWriter, r *http.Request) {
	go runCleanLogic() // 🧠 用 goroutine 執行，不阻塞前端
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("🧹 清理程序已啟動"))
}

// runCleanLogic 實際清除 48 小時前的訊息
func runCleanLogic() {
	ctx := context.Background()
	cutoff := time.Now().Add(-48 * time.Hour)

	chatRooms := []string{"Gym", "Library", "Cafe", "Cinema", "OUTSIDE", "Rooftop"}

	for _, room := range chatRooms {
		fmt.Printf("🧹 清理聊天室：%s\n", room)

		iter := firebase.FirestoreClient.
			Collection("ChatRooms").
			Doc(room).
			Collection("messages").
			Where("timestamp", "<", cutoff).
			Documents(ctx)

		batch := firebase.FirestoreClient.Batch()
		count := 0

		for {
			doc, err := iter.Next()
			if err != nil {
				break
			}
			batch.Delete(doc.Ref)
			count++
		}

		if count > 0 {
			_, err := batch.Commit(ctx)
			if err != nil {
				fmt.Printf("❌ 批次刪除 %s 失敗：%v\n", room, err)
			} else {
				fmt.Printf("✅ 已刪除 %d 筆過期訊息 from %s\n", count, room)
			}
		} else {
			fmt.Printf("⏱ %s 無過期訊息\n", room)
		}
	}
}
