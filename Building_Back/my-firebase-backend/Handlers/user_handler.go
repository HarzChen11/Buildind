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

func CreateUser(userId string, displayName string, avatar string) {
	docRef := firebase.FirestoreClient.Collection("Users").Doc(userId)
	_, err := docRef.Get(context.Background())

	if err != nil {
		if status.Code(err) == codes.NotFound {

			counterRef := firebase.FirestoreClient.Collection("Meta").Doc("UserCounter")

			err := firebase.FirestoreClient.RunTransaction(context.Background(), func(ctx context.Context, tx *firestore.Transaction) error {
				// 1️⃣ 查詢目前最大樓層
				usersIter := firebase.FirestoreClient.Collection("Users").Documents(ctx)
				defer usersIter.Stop()

				maxFloor := 100 // 初始最大樓層，您可以根據需求設置初值
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
				newFloor := maxFloor + 1

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

				// 3️⃣ 更新 lastUserId 和用戶資料
				tx.Update(counterRef, []firestore.Update{
					{Path: "lastUserId", Value: firestore.Increment(1)}, // 增加 1
				})

				// 註冊新用戶
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
			fmt.Println("✅ 成功註冊新用戶")

		} else {
			log.Fatalf("❌ 讀取資料錯誤: %v", err)
		}
	} else {
		fmt.Println("⚠️ 使用者已註冊，跳過註冊流程")
	}
}
