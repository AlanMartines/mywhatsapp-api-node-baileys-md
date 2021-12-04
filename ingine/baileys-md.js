//
// Configuração dos módulos
const config = require('../config.global');
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
  MiscMessageGenerationOptions,
  MessageOptions,
  Mimetype,
  downloadContentFromMessage
} = require('../Baileys/lib/index');
const Sessions = require("../sessions.js");
//
// ------------------------------------------------------------------------------------------------------- //
//
async function updateStateDb(state, status, AuthorizationToken) {
  //
  const date_now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  console.log("- Date:", date_now);
  //
  //
  const sql = "UPDATE tokens SET state=?, status=?, lastactivit=? WHERE token=?";
  const values = [state, status, date_now, AuthorizationToken];
  //
  if (parseInt(config.VALIDATE_MYSQL) == true) {
    const conn = require('../config/dbConnection').promise();
    const resUpdate = await conn.execute(sql, values);
    if (resUpdate) {
      console.log('- Status atualizado');
    } else {
      console.log('- Status não atualizado');
    }
  }
  //
}
//
// ------------------------------------------------------------------------------------------------------- //
//
module.exports = class startSocket {
  //
  static async startSock(SessionName, tokenPatch) {
    //
    var session = Sessions.getSession(SessionName);
    //
    const {
      state,
      saveState
    } = useSingleFileAuthState(`${tokenPatch}/${SessionName}.data.json`)
    //
    const startSock = async () => {
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
          level: 'info'
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
          isNewLogin,
          qr,
          receivedPendingNotifications
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
        if (connection === 'connecting') {

        } else if (connection === 'open') {
          //
          session.state = "CONNECTED";
          session.status = 'isLogged';
          session.qrcodedata = null;
          session.message = 'Sistema iniciando e disponivel para uso';
          //
          await updateStateDb(session.state, session.status, session.AuthorizationToken);
          //
        }
        if (connection === 'close') {
          if (fs.existsSync(`${tokenPatch}/${SessionName}.data.json`)) {
            fs.unlinkSync(`${tokenPatch}/${SessionName}.data.json`);
          }
          //
          session.state = "CLOSED";
          session.status = 'CLOSED';
          session.client = false;
          session.qrcodedata = null;
          session.message = "Sessão fechada";
          //
          client.clearAuthInfo();
          //
          await Sessions.Start(SessionName.trim());
          //
          // reconnect if not logged out
          if (lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
            startSock();
          } else {
            console.log('- Connection closed')
          }
        } else {

        }
        //console.log('- Connection update\n', conn);
        console.log('- Connection update');
      });
      //
      //
      sock.ev.on('creds.update', saveState);
      //
      return sock
    }
    return await startSock();
  }
}