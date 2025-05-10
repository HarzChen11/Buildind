package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	firebase "my-firebase-backend/Firebase"

	"google.golang.org/api/iterator"
)

type OnlineUser struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Avatar       string `json:"avatar"`
	Floor        int    `json:"floor"`
	IsOnline     bool   `json:"isOnline"`
	CurrentFloor int    `json:"currentFloor"`
}

// 取得所有使用者清單（包含線上狀態與當前樓層）
func GetOnlineUsers(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	iter := firebase.FirestoreClient.Collection("Users").Documents(ctx)
	defer iter.Stop()

	var users []OnlineUser

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			http.Error(w, `{"error":"取得使用者資料失敗"}`, http.StatusInternalServerError)
			return
		}

		data := doc.Data()

		// 解析基本欄位
		name, _ := data["cName"].(string)
		avatar, _ := data["cAvatar"].(string)
		isOnline, _ := data["cIsOnline"].(bool)

		// 樓層：cFloor（固定樓層）
		floorInt := 0
		if v, ok := data["cFloor"]; ok {
			switch vv := v.(type) {
			case int64:
				floorInt = int(vv)
			case float64:
				floorInt = int(vv)
			}
		}

		// 當前樓層：cCurrentFloor（可變動）
		currentFloor := floorInt
		if v, ok := data["cCurrentFloor"]; ok {
			switch vv := v.(type) {
			case int64:
				currentFloor = int(vv)
			case float64:
				currentFloor = int(vv)
			}
		}

		// 組裝資料
		users = append(users, OnlineUser{
			ID:           doc.Ref.ID,
			Name:         name,
			Avatar:       avatar,
			Floor:        floorInt,
			IsOnline:     isOnline,
			CurrentFloor: currentFloor,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}
