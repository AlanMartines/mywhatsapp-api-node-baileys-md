// De 104 para 32
const {
  default: makeWASocket,
  useSingleFileAuthState,
  DisconnectReason
} = require('./Baileys/lib/index');
const fs = require("fs-extra");
const {
  state,
  saveState
} = useSingleFileAuthState('./wabasemdConnection.json')

const startSock = () => {
  const sock = makeWASocket({
    /** provide an auth state object to maintain the auth state */
    auth: state,
    /** Fails the connection if the connection times out in this time interval or no data is received */
    connectTimeoutMs: 5000,
    /** ping-pong interval for WS connection */
    keepAliveIntervalMs: 30000,
    /** proxy agent */
    agent: undefined,
    /** version to connect with */
    //version: [2, 2142, 12],
    /** override browser config */
    browser: ['My-WhatsApp', "Safari", "3.0"],
    /** agent used for fetch requests -- uploading/downloading media */
    fetchAgent: undefined,
    /** should the QR be printed in the terminal */
    printQRInTerminal: true
    //
  });

  sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0]
    if (!msg.key.fromMe && m.type === 'notify') {
      console.log('+ respondendo: ', msg.key.remoteJid)
      await sock.sendReadReceipt(msg.key.remoteJid, msg.key.participant, [msg.key.id])
      await sock.sendMessage(msg.key.remoteJid, {
        text: 'Opa! WABaseMD funcionando!'
      });
    }
  });

  sock.ev.on('connection.update', (update) => {
    const {
      connection,
      lastDisconnect
    } = update
    if (connection === 'close') {
      lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut ?
        startSock() :
        console.log('+ connection closed');
      if (fs.existsSync(`./wabasemdConnection.json`)) {
        fs.unlinkSync(`./wabasemdConnection.json`);
      }
      startSock();
    }
    console.log('+ connection update', update);
  });

  sock.ev.on('creds.update', saveState);

  return sock
}

startSock();