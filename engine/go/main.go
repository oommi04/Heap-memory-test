package main

import (
    "fmt"
	"time"
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

type Award struct {
	Wins *int32              `bson:"wins,omitempty"`
	Nominations *int32 `bson:"nominations,omitempty"`
	Text       *string             `bson:"text,omitempty"`
}

 
type Movies struct {
	ID            primitive.ObjectID `bson:"_id,omitempty"`
	Plot          *string             `bson:"plot,omitempty"`
	Runtime       *int32              `bson:"runtime,omitempty"`
	Title 		  *string             `bson:"title,omitempty"`
	Lastupdated   *string             `bson:"lastupdated,omitempty"`
}

func main() {
	fmt.Println("connect mongo")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	fmt.Println("connect mongo")
	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://mongo-db:27017"))
	fmt.Println("connect mongo success")

	var datas []Movies
	collection := client.Database("sample_mflix").Collection("movies")
	fmt.Println("startquery")
	cur, err := collection.Find(ctx, bson.D{})
	fmt.Println("get cursor")


	if err != nil { fmt.Println(err) }
	defer cur.Close(ctx)
	if err = cur.All(ctx, &datas); err != nil {
		fmt.Println(err)
	}
	fmt.Println("query success")

	fmt.Println("length: ", len(datas))
	fmt.Println("data.1: ", datas[0])
}
