const {Kafka} = require ("kafkajs")
const mongoose = require("mongoose");
const {addToBuffer} = require("./batchProcessor")
const {createClient} = require('redis');


const kafka= new Kafka({
    clientId: "live-analytics-consumer",
    brokers:["kafka:9092"],
    retry:{
        initialRetryTime: 3000,
        retries: 10
    }
});

const consumer = kafka.consumer({
    groupId : "engagement-group"
});

const dlqProducer = kafka.producer();

async function connectDLQProducer() {
  await dlqProducer.connect();
  console.log("DLQ Producer Connected");
}

const redisClient = createClient({
    url:"redis://redis:6379"
});

redisClient.on("error", err => console.error("Redis Error:", err));

async function connectRedis() {
  await redisClient.connect();
  console.log("Redis Connected (Consumer)");
}

async function start(){
    await mongoose.connect("mongodb://mongo:27017/live-analytics");
    console.log("mongo connect consumer");

    await consumer.connect();
    await consumer.subscribe({
        topic: "engagement-events",
        fromBeginning: false
    });
    await connectRedis();
    await connectDLQProducer();



    await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());

        const redisKey =`event:${event.eventId}`;


        const isNew = await redisClient.set(redisKey, "1", {
            NX: true,
            EX: 3600   
        });

        if (!isNew) {
            console.log("Duplicate event skipped:", event.eventId);
            return;
        }

        addToBuffer(event);

      
        } catch (err) {
            console.error("Malformed event:", err.message);
            try {
                await dlqProducer.send({
                    topic: "engagement-events-dlq",
                    messages: [{
                        value: message.value.toString(),
                        headers: { 
                            error: err.message,
                            originalTopic: "engagement-events"
                        }
                    }]
                });
                console.log("Sent malformed message to DLQ");
            } catch (dlqErr) {
                console.error("Failed to send to DLQ:", dlqErr.message);
            }
        }
    }
  });

}




start();
process.on("SIGTERM", async () => {
  console.log("Shutting down consumer...");
  await consumer.disconnect();
  await dlqProducer.disconnect();
  await redisClient.disconnect();
  await mongoose.disconnect();
  process.exit(0);
});
