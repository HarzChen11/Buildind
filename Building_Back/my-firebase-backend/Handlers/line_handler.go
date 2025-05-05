// handlers/line_handler.go
package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

const (
	clientID     = "2007364290"
	clientSecret = "46f670d16986b637243c26710b6e5dcc"
	redirectURI  = "http://localhost:5173/callback"
)

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	IDToken     string `json:"id_token"`
}

type ProfileResponse struct {
	UserID      string `json:"userId"`
	DisplayName string `json:"displayName"`
	PictureURL  string `json:"pictureUrl"`
}

func HandleLineCallback(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var body struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Code == "" {
		http.Error(w, `{"error": "缺少 code"}`, http.StatusBadRequest)
		return
	}

	code := body.Code

	// Step 1: 拿 access token
	tokenURL := "https://api.line.me/oauth2/v2.1/token"
	data := fmt.Sprintf(
		"grant_type=authorization_code&code=%s&redirect_uri=%s&client_id=%s&client_secret=%s",
		code, redirectURI, clientID, clientSecret,
	)
	req, _ := http.NewRequest("POST", tokenURL, bytes.NewBufferString(data))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp.StatusCode != 200 {
		http.Error(w, `{"error": "LINE token 請求失敗"}`, http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var tokenRes TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenRes); err != nil {
		http.Error(w, `{"error": "token 解碼失敗"}`, http.StatusInternalServerError)
		return
	}

	// Step 2: 用 access_token 拿 profile
	profileReq, _ := http.NewRequest("GET", "https://api.line.me/v2/profile", nil)
	profileReq.Header.Set("Authorization", "Bearer "+tokenRes.AccessToken)

	profileResp, err := http.DefaultClient.Do(profileReq)
	if err != nil || profileResp.StatusCode != 200 {
		http.Error(w, `{"error": "無法取得使用者資料"}`, http.StatusInternalServerError)
		return
	}
	defer profileResp.Body.Close()

	var profile ProfileResponse
	if err := json.NewDecoder(profileResp.Body).Decode(&profile); err != nil {
		http.Error(w, `{"error": "profile 解碼失敗"}`, http.StatusInternalServerError)
		return
	}

	fmt.Printf("✅ 取得 LINE 使用者資料: %v\n", profile)

	// Step 3: 嘗試註冊
	CreateUser(profile.UserID, profile.DisplayName)

	// ✅ 回傳 JSON 給前端
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK) // 確保是 200 OK
	json.NewEncoder(w).Encode(map[string]string{
		"userId": profile.UserID,
		"name":   profile.DisplayName,
	})
}
