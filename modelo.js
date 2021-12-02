//
// Configuração dos módulos
const config = require('./config.global');
const fs = require("fs-extra");
const QRCode = require('qrcode');
const qrcodeterminal = require('qrcode-terminal');
const moment = require("moment");
const pino = require("pino");
const Base64BufferThumbnail = require('base64-buffer-thumbnail');
const {
  fromPath,
  fromBuffer,
  fromBase64
} = require('pdf2pic');
const {
  forEach
} = require('p-iteration');
const {
  default: makeWASocket,
  WASocket,
  AuthenticationState,
  BufferJSON,
  initInMemoryKeyStore,
  WAMessage,
  Contact,
  SocketConfig,
  useSingleFileAuthState,
  DisconnectReason,
  BaileysEventMap,
  GroupMetadata,
  AnyMessageContent,
  MessageType,
  MiscMessageGenerationOptions
} = require('./Baileys/lib/index');
//
// ------------------------------------------------------------------------------------------------------- //
//
const {
  state,
  saveState
} = useSingleFileAuthState('./wabasemdConnection.json')
//
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
  //
  let attempts = 0;
  //
  sock.ev.on('connection.update', async (conn) => {
    const {
      connection,
      lastDisconnect,
      qr
    } = conn;
    if (qr) { // if the 'qr' property is available on 'conn'
      console.log('- QR Generated');
      //
      var readQRCode = await QRCode.toDataURL(qr);
      var qrCode = readQRCode.replace('data:image/png;base64,', '');
      //
      attempts++;
      //
      console.log('- Número de tentativas de ler o qr-code:', attempts);
      console.log("- Captura do QR-Code");
      //
    }
    if (connection === 'close') {
      if (fs.existsSync('./wabasemdConnection.json')) {
        fs.unlinkSync('./wabasemdConnection.json');
      }
      lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut ?
        startSock() :
        console.log('- Connection closed');
      startSock();
    }
    console.log('- Connection update');
  });
  //
  //
  sock.ev.on('auth-state.update', async () => {
    console.log(`credentials updated!`);
    const infoSession = client.authState;
    await fs.writeFileSync('./wabasemdConnection.json', JSON.stringify(infoSession, BufferJSON.replacer, 2), );
  });
  //
  //
  sock.ev.on('creds.update', saveState);
  //
  return sock
}

const client = startSock();