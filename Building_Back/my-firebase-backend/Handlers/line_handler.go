package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/MicahParks/keyfunc"
	"github.com/golang-jwt/jwt/v4"
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
	ID     string `json:"id"`
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
	Floor  int    `json:"floor"`
}

type LineProfile struct {
	UserID      string `json:"userId"`
	DisplayName string `json:"displayName"`
	PictureURL  string `json:"pictureUrl"`
}

// ✅ 驗證 LINE id_token（JWT）
func ParseAndValidateLineIDToken(idToken string) (jwt.MapClaims, error) {
	jwksURL := "https://api.line.me/oauth2/v2.1/certs"

	jwks, err := keyfunc.Get(jwksURL, keyfunc.Options{
		RefreshTimeout: 5 * time.Second,
	})
	if err != nil {
		return nil, fmt.Errorf("取得 LINE JWK 失敗: %w", err)
	}

	token, err := jwt.Parse(idToken, jwks.Keyfunc)
	if err != nil {
		return nil, fmt.Errorf("JWT 驗證失敗: %w", err)
	}
	if !token.Valid {
		return nil, fmt.Errorf("JWT 無效")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("JWT claims 格式錯誤")
	}
	return claims, nil
}

// ✅ 主 handler
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

	// Step 1：交換 token
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

	// Step 2：驗證 id_token（JWT）
	// _, err = ParseAndValidateLineIDToken(tokenRes.IDToken)
	// if err != nil {
	// 	fmt.Println("JWT 驗證錯誤：", err)
	// 	http.Error(w, fmt.Sprintf(`{"error": "id_token 驗證失敗: %v"}`, err), http.StatusUnauthorized)
	// 	return
	// }

	// Step 3：取得 LINE profile（含頭像）
	profileReq, _ := http.NewRequest("GET", "https://api.line.me/v2/profile", nil)
	profileReq.Header.Set("Authorization", "Bearer "+tokenRes.AccessToken)

	profileResp, err := http.DefaultClient.Do(profileReq)
	if err != nil || profileResp.StatusCode != 200 {
		http.Error(w, `{"error": "無法取得使用者資料"}`, http.StatusInternalServerError)
		return
	}
	defer profileResp.Body.Close()

	var lineProfile LineProfile
	if err := json.NewDecoder(profileResp.Body).Decode(&lineProfile); err != nil {
		http.Error(w, `{"error": "profile 解碼失敗"}`, http.StatusInternalServerError)
		return
	}

	fmt.Printf("✅ 取得使用者資料: %+v\n", lineProfile)

	// Step 4：嘗試註冊 Firestore
	userFloor := CreateUser(lineProfile.UserID, lineProfile.DisplayName, lineProfile.PictureURL)

	// Step 5：回傳給前端
	response := ProfileResponse{
		ID:     lineProfile.UserID,
		Name:   lineProfile.DisplayName,
		Avatar: lineProfile.PictureURL,
		Floor:  userFloor,
	}

	json.NewEncoder(w).Encode(response)

}
