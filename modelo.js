// De 104 para 32
const {
  default: makeWASocket,
  useSingleFileAuthState,
  DisconnectReason
} = require('./Baileys/lib/index');
const fs = require("fs-extra");
const pino = require("pino");
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
    /** pino logger */
    logger: pino({
      level: 'warn'
    }),
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

  sock.ev.on('connection.update', (update) => {
    const {
      connection,
      lastDisconnect
    } = update
    if (connection === 'close') {
      if (fs.existsSync('./wabasemdConnection.json')) {
        fs.unlinkSync('./wabasemdConnection.json');
      }
      lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut ?
        startSock() :
        console.log('+ connection closed');
    }
    console.log('+ connection update', update);
  });

  sock.ev.on('creds.update', saveState);

  return sock
}

startSock();