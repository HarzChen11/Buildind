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

var assignedFloor int

// 回傳樓層到前端
func CreateUser(userId string, displayName string, avatar string) int {
	docRef := firebase.FirestoreClient.Collection("Users").Doc(userId)

	// 先嘗試取得該用戶是否已存在
	docSnap, err := docRef.Get(context.Background())
	if err == nil {
		fmt.Println("⚠️ 使用者已註冊，跳過註冊流程")
		if floorVal, ok := docSnap.Data()["cFloor"].(int64); ok {
			return int(floorVal)
		}
		return 0 // 若 cFloor 欄位不存在
	}

	// 如果是非 NotFound 錯誤，就報錯
	if status.Code(err) != codes.NotFound {
		log.Fatalf("❌ 讀取資料錯誤: %v", err)
	}

	// ⬇️ 尚未註冊，進行註冊程序
	counterRef := firebase.FirestoreClient.Collection("Meta").Doc("UserCounter")

	var newFloor int

	err = firebase.FirestoreClient.RunTransaction(context.Background(), func(ctx context.Context, tx *firestore.Transaction) error {
		// 1️⃣ 查詢目前最大樓層
		usersIter := firebase.FirestoreClient.Collection("Users").Documents(ctx)
		defer usersIter.Stop()

		maxFloor := 100
		for {
			doc, err := usersIter.Next()
			if err != nil {
				break
			}
			if floor, ok := doc.Data()["cFloor"].(int64); ok {
				if int(floor) > maxFloor {
					maxFloor = int(floor)
				}
			}
		}
		newFloor = maxFloor + 1

		// 2️⃣ 查詢 lastUserId
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

		// 3️⃣ 更新 UserCounter & 建立新用戶
		tx.Update(counterRef, []firestore.Update{
			{Path: "lastUserId", Value: firestore.Increment(1)},
		})

		tx.Set(docRef, map[string]interface{}{
			"cID":       newID,
			"cName":     displayName,
			"cAvatar":   avatar,
			"cFloor":    newFloor,
			"cCreateDT": time.Now(),
		}, firestore.MergeAll)

		return nil
	})

	if err != nil {
		log.Fatalf("❌ 註冊失敗: %v", err)
	}

	fmt.Printf("✅ 成功註冊新用戶，指派樓層：%d\n", newFloor)
	return newFloor
}
