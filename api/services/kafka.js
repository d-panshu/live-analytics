
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId:"live-analytics-api",
    brokers:["kafka:9092"],
    retry:{
        initialRetryTime: 3000,
        retries:10
    },
    connectionTimeout: 10000,
    authenticationTimeout: 10000,
    reauthenticationTimeout: 10000,
});

const producer = kafka.producer({
    allowAutoTopicCreation: false,
    idempotent:true,
    maxInFlightRequests:1
});


async function connectProducer(){
    await producer.connect();
    console.log("kafka producer connected");

}

async function disconnectProducer(){
    await producer.disconnect();
    console.log("kafka prodcuer disconnect")
}

module.exports = {
  producer,
  connectProducer,
  disconnectProducer
};