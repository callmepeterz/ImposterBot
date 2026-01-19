const net = require("node:net");

function writeVarInt(value) {
  const bytes = [];
  while (true) {
    let temp = value & 0x7f;
    value >>>= 7;
    if (value !== 0) {
      bytes.push(temp | 0x80);
    } else {
      bytes.push(temp);
      break;
    }
  }
  return Buffer.from(bytes);
}

function buildHandshake(host, port, protocol = -1, state = 1) {
  const addr = Buffer.from(host, "utf8");

  const body = Buffer.concat([
    writeVarInt(0),      
    writeVarInt(protocol),
    writeVarInt(addr.length),
    addr,
    Buffer.from([(port >> 8) & 0xff, port & 0xff]),
    writeVarInt(state)   
  ]);

  return Buffer.concat([writeVarInt(body.length), body]);
}

function buildStatusRequest() {
  return Buffer.concat([writeVarInt(1), writeVarInt(0)]);
}

async function getServerStatus(host, port = 25565) {
  return new Promise((resolve, reject) => {
    let buffer = Buffer.alloc(0);
    const socket = net.createConnection({ host, port });
    socket.setTimeout(40000);

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Timeout — server likely asleep"));
    });

    socket.on("connect", async () => {
      try {
        socket.write(buildHandshake(host, port));
        socket.write(buildStatusRequest());

      } catch (e) {
        socket.destroy();
        reject(e);
      }
    });
     socket.on("data", chunk => {
        buffer = Buffer.concat([buffer, chunk]);

        try {
        let offset = 0;
        let length = 0;
        let shift = 0;
        let byte;

        do {
            byte = buffer[offset++];
            length |= (byte & 0x7f) << shift;
            shift += 7;
        } while (byte & 0x80);

        if (buffer.length < offset + length) return;

        shift = 0;
        let packetId = 0;

        do {
            byte = buffer[offset++];
            packetId |= (byte & 0x7f) << shift;
            shift += 7;
        } while (byte & 0x80);

        socket.end(); 

        } catch (e) {

        }
    });
    socket.on("end", ()=> {
        resolve(JSON.parse(buffer.toString("utf-8").slice(5)));
    })

    socket.on("error", reject);
  });
}

module.exports = { getServerStatus };