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

func CreateUser(userId string, displayName string) {
	docRef := firebase.FirestoreClient.Collection("Users").Doc(userId)
	_, err := docRef.Get(context.Background())

	if err != nil {
		if status.Code(err) == codes.NotFound {
			// 流水號處理
			counterRef := firebase.FirestoreClient.Collection("Meta").Doc("UserCounter")
			err := firebase.FirestoreClient.RunTransaction(context.Background(), func(ctx context.Context, tx *firestore.Transaction) error {
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

				// 更新 counter
				tx.Set(counterRef, map[string]interface{}{
					"lastUserId": newID,
				}, firestore.MergeAll)

				// 寫入新用戶
				tx.Set(docRef, map[string]interface{}{
					"cID":       newID,
					"cName":     displayName,
					"cAvatar":   "🧍",
					"cFloor":    101,
					"cCreateDT": time.Now(),
				}, firestore.MergeAll)

				return nil
			})

			if err != nil {
				log.Fatalf("註冊失敗: %v", err)
			}
			fmt.Println("✅ 成功註冊新用戶")
		} else {
			log.Fatalf("❌ 讀取資料錯誤: %v", err)
		}
	} else {
		fmt.Println("⚠️ 使用者已註冊，跳過註冊流程")
	}
}
