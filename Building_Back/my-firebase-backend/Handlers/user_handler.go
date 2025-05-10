package handlers

import (
	"context"
	"fmt"
	"log"
	"time"

	firebase "my-firebase-backend/Firebase"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// 回傳樓層到前端
// ✅ 完整安全寫法（不依賴全域變數）
func CreateUser(userId string, displayName string, avatar string) int {
	docRef := firebase.FirestoreClient.Collection("Users").Doc(userId)
	docSnap, err := docRef.Get(context.Background())

	if err == nil && docSnap.Exists() {
		_, updateErr := docRef.Update(context.Background(), []firestore.Update{
			{Path: "cIsOnline", Value: true},
		})
		if updateErr != nil {
			log.Printf("⚠️ 更新 cIsOnline 失敗: %v", updateErr)
		} else {
			fmt.Println("🔄 已標記舊使用者為線上狀態")
		}

		if floor, ok := docSnap.Data()["cFloor"].(int64); ok {
			fmt.Println("⚠️ 使用者已註冊，樓層為：", floor)
			return int(floor)
		}
		fmt.Println("⚠️ 使用者已註冊，但未找到樓層資訊，預設回傳 1")
		return 1
	}

	if status.Code(err) != codes.NotFound {
		log.Fatalf("❌ 讀取資料錯誤: %v", err)
	}

	counterRef := firebase.FirestoreClient.Collection("Meta").Doc("UserCounter")

	var newFloor int // 🔁 用區域變數來儲存分配的樓層
	err = firebase.FirestoreClient.RunTransaction(context.Background(), func(ctx context.Context, tx *firestore.Transaction) error {
		usersIter := firebase.FirestoreClient.Collection("Users").Documents(ctx)
		defer usersIter.Stop()

		maxFloor := 100
		for {
			doc, err := usersIter.Next()
			if err != nil {
				break
			}
			if floor, ok := doc.Data()["cFloor"].(int64); ok && int(floor) > maxFloor {
				maxFloor = int(floor)
			}
		}
		newFloor = maxFloor + 1

		counterDoc, err := tx.Get(counterRef)
		if err != nil && status.Code(err) != codes.NotFound {
			return err
		}

		lastID := 0
		if counterDoc.Exists() {
			val, ok := counterDoc.Data()["lastUserId"].(int64)
			if ok {
				lastID = int(val)
			}
		}
		newID := lastID + 1

		tx.Update(counterRef, []firestore.Update{
			{Path: "lastUserId", Value: firestore.Increment(1)},
		})
		tx.Set(docRef, map[string]interface{}{
			"cID":       newID,
			"cName":     displayName,
			"cAvatar":   avatar,
			"cFloor":    newFloor,
			"cCreateDT": time.Now(),
			"cIsOnline": true,
		}, firestore.MergeAll)

		return nil
	})

	if err != nil {
		log.Fatalf("❌ 註冊失敗: %v", err)
	}

	fmt.Println("✅ 成功註冊新用戶")
	return newFloor // ✅ 回傳區域變數
}
