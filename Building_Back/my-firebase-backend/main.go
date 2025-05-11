package main

import (
	"fmt"
	"log"
	"net/http"

	firebase "my-firebase-backend/Firebase"
	handlers "my-firebase-backend/Handlers"

	"github.com/gorilla/mux"
)

func withCORS(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 設定 CORS header
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		handler(w, r)
	}
}

func main() {
	firebase.InitFirebase()

	r := mux.NewRouter()

	// 路由註冊
	r.HandleFunc("/api/line-login", withCORS(handlers.HandleLineCallback)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/floors", withCORS(handlers.GetUserFloorsHandler)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/users", withCORS(handlers.GetOnlineUsers)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/move-floor", withCORS(handlers.HandleMoveFloor)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/init-chatrooms", withCORS(handlers.InitChatRoomsHandler)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/logout", withCORS(handlers.HandleLogout)).Methods("POST", "OPTIONS")

	fmt.Println("🚀 後端啟動中：在 http://localhost:8080 等待 LINE 登入回傳")
	log.Fatal(http.ListenAndServe(":8080", r))
}
