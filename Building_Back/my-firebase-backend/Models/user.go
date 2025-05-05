package models

import "time"

type User struct {
	CName     string    `firestore:"cName"`
	CAvatar   string    `firestore:"cAvatar"`
	CFloor    int       `firestore:"cFloor"`
	CCreateDT time.Time `firestore:"cCreateDT"`
	CCLight   bool      `firestore:"cCLight"`
}
