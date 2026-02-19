const {Kafka} = require ("kafkajs")
const mongoose = require("mongoose");
const {addToBuffer} = require("./batchProcessor")

const kafka= new Kafka({
    clientId: "live-analytics-consumer",
    brokers:["kafka:9092"]
});


const consumer = kafka.consumer({
    groupId : "engagement-group"
});

async function start(){
    await mongoose.connect("mongodb://mongo:27017/live-analytics");
    console.log("mongo connect consumer");

    await consumer.connect();
    await consumer.subscribe({
        topic: "engagement-events",
        fromBeginning: false
    });

    await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        addToBuffer(event);
      } catch (err) {
        console.error("Malformed event:", err.message);
      }
    }
  });

}

start();
