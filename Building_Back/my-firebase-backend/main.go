package main

import (
	"fmt"
	"log"
	"net/http"

	firebase "my-firebase-backend/Firebase"
	handlers "my-firebase-backend/Handlers" // ✅ 指定別名 handlers
)

func withCORS(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 設定 CORS header
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// 預檢請求直接回傳
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		handler(w, r)
	}
}

func main() {
	firebase.InitFirebase()

	http.HandleFunc("/api/line-login", withCORS(handlers.HandleLineCallback))

	fmt.Println("🚀 後端啟動中：在 http://localhost:8080 等待 LINE 登入回傳")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
