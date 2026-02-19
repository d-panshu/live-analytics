const Stream = require("./models/stream.js")
let buffer=[];
let redisClient;

function injectRedis(client) {
  redisClient = client;
}

const batch_size = 500;
const flush_interval= 1000;

let pubClient;

function injectRedis(client, publisher) {
  redisClient = client;
  pubClient = publisher;
}


async function flushBuffer() {
  if (!buffer.length) return;

  const bulkOps = buffer.map(event => ({
    updateOne: {
      filter: { streamId: event.streamId },
      update: { $inc: { likes: 1 } },
      upsert: true
    }
  }));

  await Stream.bulkWrite(bulkOps);

  console.log(`Flushed ${buffer.length} events`);


  await redisClient.publish("stream-updates", "updated");

  buffer = [];
}


setInterval(flushBuffer, flush_interval);

function addToBuffer(event) {
  buffer.push(event);

  if (buffer.length >= batch_size) {
    flushBuffer();
  }
}

module.exports = { addToBuffer , injectRedis};