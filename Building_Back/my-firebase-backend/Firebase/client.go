package firebase

import (
	"context"
	"log"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

var FirestoreClient *firestore.Client

func InitFirebase() {
	_ = godotenv.Load()
	opt := option.WithCredentialsFile("/Users/harz/Desktop/Buildind/Building_Back/my-firebase-backend/Secrets/buildind-fab23-firebase-adminsdk-fbsvc-9e2a0009ec.json")
	app, err := firebase.NewApp(context.Background(), &firebase.Config{
		ProjectID: "buildind-fab23",
	}, opt)
	if err != nil {
		log.Fatalf("初始化 Firebase App 失敗: %v", err)
	}

	client, err := app.Firestore(context.Background())
	if err != nil {
		log.Fatalf("初始化 Firestore 失敗: %v", err)
	}

	FirestoreClient = client
}
