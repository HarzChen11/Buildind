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
		// 取得使用者專屬樓層
		floorRaw := docSnap.Data()["cFloor"]
		var floor int
		switch v := floorRaw.(type) {
		case int64:
			floor = int(v)
		case float64:
			floor = int(v)
		default:
			floor = 1
		}

		// ✅ 每次登入強制移回專屬樓層
		_, updateErr := docRef.Update(context.Background(), []firestore.Update{
			{Path: "cIsOnline", Value: true},
			{Path: "cCurrentFloor", Value: floor},
		})
		if updateErr != nil {
			log.Printf("⚠️ 更新 cIsOnline 或 cCurrentFloor 失敗: %v", updateErr)
		} else {
			fmt.Println("🔄 已標記舊使用者為線上狀態，並移回樓層：", floor)
		}

		return floor
	}

	if status.Code(err) != codes.NotFound {
		log.Fatalf("❌ 讀取資料錯誤: %v", err)
	}

	counterRef := firebase.FirestoreClient.Collection("Meta").Doc("UserCounter")

	var newFloor int
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
			"cID":           newID,
			"cName":         displayName,
			"cAvatar":       avatar,
			"cFloor":        newFloor,
			"cCurrentFloor": newFloor, // ✅ 新使用者初始也要設目前樓層
			"cCreateDT":     time.Now(),
			"cIsOnline":     true,
		}, firestore.MergeAll)

		return nil
	})

	if err != nil {
		log.Fatalf("❌ 註冊失敗: %v", err)
	}

	fmt.Println("✅ 成功註冊新用戶")
	return newFloor
}
