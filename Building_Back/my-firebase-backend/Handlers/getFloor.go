package handlers

import (
	"context"
	"encoding/json"
	firebase "my-firebase-backend/Firebase"
	"net/http"

	"google.golang.org/api/iterator"
)

// Floor 結構對應前端需要的格式
type Floor struct {
	FloorNumber   int    `json:"floorNumber"`
	Label         string `json:"label"`
	IsPublicSpace bool   `json:"isPublicSpace"`
}

func GetUserFloorsHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	iter := firebase.FirestoreClient.Collection("Users").Documents(ctx)

	var floors []Floor

	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			http.Error(w, "取得資料失敗", http.StatusInternalServerError)
			return
		}

		data := doc.Data()

		// 安全型轉換（避免型別錯誤 panic）
		floorNumRaw, ok1 := data["cFloor"].(int64)
		nameRaw, ok2 := data["cName"].(string)

		if !ok1 || !ok2 {
			continue // 若資料不完整就跳過
		}

		floor := Floor{
			FloorNumber:   int(floorNumRaw),
			Label:         nameRaw,
			IsPublicSpace: false,
		}
		floors = append(floors, floor)
	}

	// 回傳 JSON 結果
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(floors)
}
