const Stream = require("./models/stream.js")
let buffer=[];

const batch_size = 500;
const flush_interval= 1000;

async function flushBuffer(){
    if(!buffer.length) return;

    const bulkops= buffer.map(event=>({
        updateOne:
        {
            filter:{streamId:event.streamId},
            update:{$inc:{likes:1}},
            upsert: true

        }
    }));

    await Stream.bulkWrite(bulkops);

    console.log(`flushed ${buffer.length} events`);
    buffer=[];

}

setInterval(flushBuffer, flush_interval);

function addToBuffer(event) {
  buffer.push(event);

  if (buffer.length >= batch_size) {
    flushBuffer();
  }
}

module.exports = { addToBuffer };