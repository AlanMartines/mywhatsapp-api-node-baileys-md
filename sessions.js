//
// ConfiguraÃ§Ã£o dos mÃ³dulos
const config = require('./config.global');
const fs = require("fs-extra");
const QRCode = require('qrcode');
const qrcodeterminal = require('qrcode-terminal');
const moment = require("moment");
const P = require("pino");
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
} = require('./Baileys/lib/index');
const BaileysMd = require('./ingine/baileys-md');
//
// ------------------------------------------------------------------------------------------------------- //
//
async function saudacao() {
  //
  var data = new Date();
  var hr = data.getHours();
  //
  if (hr >= 0 && hr < 12) {
    var saudacao = "Bom dia";
    //
  } else if (hr >= 12 && hr < 18) {
    var saudacao = "Boa tarde";
    //
  } else if (hr >= 18 && hr < 23) {
    var saudacao = "Boa noite";
    //
  } else {
    var saudacao = "Boa madrugada";
    //
  }
  return saudacao;
}
//
async function osplatform() {
  //
  var opsys = process.platform;
  if (opsys == "darwin") {
    opsys = "MacOS";
  } else if (opsys == "win32" || opsys == "win64") {
    opsys = "Windows";
  } else if (opsys == "linux") {
    opsys = "Linux";
  }
  console.log("- Sistema operacional", opsys) // I don't know what linux is.
  //console.log("-", os.type());
  //console.log("-", os.release());
  //console.log("-", os.platform());
  //
  return opsys;
}
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
    const conn = require('./config/dbConnection').promise();
    const resUpdate = await conn.execute(sql, values);
    if (resUpdate) {
      console.log('- Status atualizado');
    } else {
      console.log('- Status nÃ£o atualizado');
    }
  }
  //
}
//
// ------------------------------------------------------------------------------------------------------- //
//
async function deletaToken(filePath) {
  //
  const cacheExists = await fs.pathExists(filePath);
  console.log('- O arquivo Ã©: ' + cacheExists);
  console.log('- Path: ' + filePath);
  if (cacheExists) {
    fs.remove(filePath);
    console.log('- O arquivo foi removido: ' + cacheExists);
  }
}
//
// ------------------------------------------------------------------------------------------------------- //
//
async function gerateThumbnail(fileBuffer, mimetype, saveFilename) {
  //
  /*
  var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-'));
  var filePath = path.join(folderName, saveFilename);
  fs.writeFileSync(filePath, Buffer.toString('base64'), 'base64');
  console.log("- File", filePath);
	*/
  //
  switch (mimetype) {
    case 'image/gif':
    case 'video/gif':
    case 'image/jpeg':
    case 'image/png':
    case 'image/webp':
      //
      //
      let options = {
        width: 250,
        height: 250,
        responseType: 'base64',
        jpegOptions: {
          force: true,
          quality: 90
        }
      }
      //
      try {
        var thumbnail = await Base64BufferThumbnail(fileBuffer, options);
        //console.log("Base64BufferThumbnail", thumbnail);
      } catch (err) {
        console.error(err);
        var thumbnail = '';
      }
      //
      break;
    case 'video/mp4':
      //
      var thumbnail = '';
      //
      break;
    case 'audio/mp4':
    case 'audio/ogg; codecs=opus':
      //
      var thumbnail = '';
      //
      break;
    case 'application/pdf':
      //
      const pdf2picOptions = {
        format: "jpeg",
        width: 250,
        height: 250,
        density: 100
      }
      try {
        //
        const pageNumber = 1;
        const convert = fromBase64(fileBuffer.toString('base64'), pdf2picOptions);
        //const convert = fromBuffer(fileBuffer, pdf2picOptions);
        const pageOutput = await convert(pageNumber, true);
        var thumbnail = Buffer.from(pageOutput.base64, 'base64');
      } catch (err) {
        console.error(err);
        var thumbnail = '';
      }
      //
      break;
    default:
      //
      var thumbnail = '';
      //
  }
  //
  return thumbnail;
}
//
// ------------------------------------------------------------------------------------------------------- //
//
module.exports = class Sessions {
  //
  static async getStatusApi(sessionName) {
    Sessions.sessions = Sessions.sessions || [];

    var session = Sessions.getSession(sessionName);
    return session;
  } //getStatus
  //
  static async ApiStatus(SessionName) {
    console.log("- Status");
    var session = Sessions.getSession(SessionName);

    if (session) { //sÃ³ adiciona se nÃ£o existir
      if (session.state == "CONNECTED") {
        return {
          result: "info",
          SessionName: SessionName,
          state: session.state,
          status: session.status,
          message: "Sistema iniciado e disponivel para uso"
        };
      } else if (session.state == "STARTING") {
        return {
          result: "info",
          SessionName: SessionName,
          state: session.state,
          status: session.status,
          message: "Sistema iniciando e indisponivel para uso"
        };
      } else if (session.state == "QRCODE") {
        return {
          result: "warning",
          SessionName: SessionName,
          state: session.state,
          status: session.status,
          message: "Sistema aguardando leitura do QR-Code"
        };
      } else if (session.state == "CLOSED") {
        return {
          result: "info",
          SessionName: SessionName,
          state: session.state,
          status: session.status,
          message: "SessÃ£o fechada"
        };
      } else {
        return {
          result: "warning",
          SessionName: SessionName,
          state: session.state,
          status: session.status,
          message: "Sistema iniciado e indisponivel para uso"
        };
      }
    } else {
      return {
        result: 'error',
        SessionName: SessionName,
        state: 'NOTFOUND',
        status: 'notLogged',
        message: 'Sistema Off-line'
      };
    }
  } //status
  //
  // ------------------------------------------------------------------------------------------------------- //
  //
  static async Start(SessionName, AuthorizationToken) {
    Sessions.sessions = Sessions.sessions || []; //start array

    var session = Sessions.getSession(SessionName, AuthorizationToken);

    if (session == false) {
      //create new session
      //
      session = await Sessions.addSesssion(SessionName, AuthorizationToken);
    } else if (["CLOSED"].includes(session.state) || ["DISCONNECTED"].includes(session.state)) {
      //restart session
      console.log("- State: CLOSED");
      session.state = "CLOSED";
      session.status = "notLogged";
      session.qrcode = null;
      session.qrcodedata = null;
      session.attempts = 0;
      session.message = "Sistema iniciando e indisponivel para uso";
      session.prossesid = null;
      session.blocklist = null;
      session.browserSessionToken = null;
      //
      console.log('- Nome da sessÃ£o:', session.name);
      console.log('- State do sistema:', session.state);
      console.log('- Status da sessÃ£o:', session.status);
      //
      session.client = Sessions.initSession(SessionName, AuthorizationToken);
      Sessions.setup(SessionName, AuthorizationToken);
    } else {
      console.log('- Nome da sessÃ£o:', session.name);
      console.log('- State do sistema:', session.state);
      console.log('- Status da sessÃ£o:', session.status);
    }
    //
    await updateStateDb(session.state, session.status, session.AuthorizationToken);
    //
    return session;
  } //start
  //
  // ------------------------------------------------------------------------------------------------------- //
  //
  static async addSesssion(SessionName, AuthorizationToken) {
    console.log("- Adicionando sessÃ£o");
    var newSession = {
      AuthorizationToken: AuthorizationToken,
      name: SessionName,
      processid: null,
      qrcode: null,
      qrcodedata: null,
      client: false,
      result: null,
      tokenPatch: null,
      state: 'STARTING',
      status: 'notLogged',
      message: 'Sistema iniciando e indisponivel para uso',
      attempts: 0,
      blocklist: null,
      browserSessionToken: null
    }
    Sessions.sessions.push(newSession);
    console.log("- Nova sessÃ£o: " + newSession.state);

    //setup session
    newSession.client = Sessions.initSession(SessionName);
    Sessions.setup(SessionName);

    return newSession;
  } //addSession
  //
  // ------------------------------------------------------------------------------------------------//
  //
  static getSession(SessionName) {
    var foundSession = false;
    if (Sessions.sessions)
      Sessions.sessions.forEach(session => {
        if (SessionName == session.name) {
          foundSession = session;
        }
      });
    return foundSession;
  } //getSession
  //
  // ------------------------------------------------------------------------------------------------//
  //
  static getSessions() {
    if (Sessions.sessions) {
      return Sessions.sessions;
    } else {
      return [];
    }
  } //getSessions
  //
  // ------------------------------------------------------------------------------------------------------- //
  //
  static async initSession(SessionName) {
    console.log("- Iniciando sessÃ£o");
    var session = Sessions.getSession(SessionName);
    //
    /*
        â•”â•â•—â”Œâ”€â”â”Œâ”¬â”â”¬â”Œâ”€â”â”Œâ”â”Œâ”Œâ”€â”â”¬    â•”â•â•—â”¬â”€â”â”Œâ”€â”â”Œâ”€â”â”Œâ”¬â”â”Œâ”€â”  â•”â•â•—â”Œâ”€â”â”¬â”€â”â”Œâ”€â”â”Œâ”¬â”â”Œâ”€â”â”Œâ”¬â”â”Œâ”€â”â”¬â”€â”â”Œâ”€â”
        â•‘ â•‘â”œâ”€â”˜ â”‚ â”‚â”‚ â”‚â”‚â”‚â”‚â”œâ”€â”¤â”‚    â•‘  â”œâ”¬â”˜â”œâ”¤ â”œâ”€â”¤ â”‚ â”œâ”¤   â• â•â•â”œâ”€â”¤â”œâ”¬â”˜â”œâ”€â”¤â”‚â”‚â”‚â”œâ”¤  â”‚ â”œâ”¤ â”œâ”¬â”˜â””â”€â”
        â•šâ•â•â”´   â”´ â”´â””â”€â”˜â”˜â””â”˜â”´ â”´â”´â”€â”˜  â•šâ•â•â”´â””â”€â””â”€â”˜â”´ â”´ â”´ â””â”€â”˜  â•©  â”´ â”´â”´â””â”€â”´ â”´â”´ â”´â””â”€â”˜ â”´ â””â”€â”˜â”´â””â”€â””â”€â”˜
     */
    //
    console.log("- SaudaÃ§Ã£o:", await saudacao());
    //
    console.log('- Nome da sessÃ£o:', SessionName);
    //
    console.log('- Folder Token:', session.tokenPatch);
    //
    console.log("- AuthorizationToken:", session.AuthorizationToken);
    //
    //-------------------------------------------------------------------------------------------------------------------------------------//
    //
    session.tokenPatch = config.TOKENSPATCH_LINUX;
    //
    let client = undefined
    /*
        const loadState = () => {
          let state = undefined;
          try {
            const value = JSON.parse(
              fs.readFileSync(`${session.tokenPatch }/${SessionName}.data.json`, {
                encoding: 'utf-8'
              }),
              BufferJSON.reviver
            );
            state = {
              creds: value.creds,
              keys: initInMemoryKeyStore(value.keys)
            };
          } catch {}
          return state;
        };

        const saveState = (state) => {
          state = state || client.authState;
          fs.writeFileSync(`${session.tokenPatch }/${SessionName}.data.json`,
            JSON.stringify(state, BufferJSON.replacer, 2)
          );
        };
    		*/
    //
    const {
      state,
      saveState
    } = useSingleFileAuthState(`${session.tokenPatch }/${SessionName}.data.json`);
    //
    // https://github.com/adiwajshing/Baileys/issues/751
    //
    const startSock = () => {
      const client = makeWASocket({
        /** provide an auth state object to maintain the auth state */
        auth: state,
        /** Fails the connection if the connection times out in this time interval or no data is received */
        connectTimeoutMs: 5000,
        /** ping-pong interval for WS connection */
        keepAliveIntervalMs: 30000,
        /** proxy agent */
        agent: undefined,
        /** pino logger */
        logger: P({
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

      //
      client.ev.on('creds.update', saveState);
      //
      return client
    }
    client = startSock()
    //
    let attempts = 0;
    //
    client.ev.on('connection.update', async (conn) => {
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
        console.log('- NÃºmero de tentativas de ler o qr-code:', attempts);
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
        if (fs.existsSync(`${session.tokenPatch }/${SessionName}.data.json`)) {
          fs.unlinkSync(`${session.tokenPatch }/${SessionName}.data.json`);
        }
        //
        session.state = "CLOSED";
        session.status = 'CLOSED';
        session.client = false;
        session.qrcodedata = null;
        session.message = "SessÃ£o fechada";
        //
        await Sessions.Start(SessionName.trim());
        //
        // reconnect if not logged out
        if ((lastDisconnect.error).output.statusCode !== DisconnectReason.loggedOut) {
          client = startSock()
        } else {
          console.log('- Connection closed')
        }
      } else {

      }
      //console.log('- Connection update\n', conn);
      console.log('- Connection update');
    });
    //
    return client;
  } //initSession
  //
  // ------------------------------------------------------------------------------------------------//
  //
  /*
    â•”â•â•—â”Œâ”€â”â”Œâ”¬â”â”Œâ”¬â”â”¬â”Œâ”â”Œâ”Œâ”€â”  â”Œâ”€â”â”Œâ”¬â”â”Œâ”€â”â”¬â”€â”â”Œâ”¬â”â”Œâ”€â”â”Œâ”¬â”
    â•‘ â•¦â”œâ”¤  â”‚  â”‚ â”‚â”‚â”‚â”‚â”‚ â”¬  â””â”€â” â”‚ â”œâ”€â”¤â”œâ”¬â”˜ â”‚ â”œâ”¤  â”‚â”‚
    â•šâ•â•â””â”€â”˜ â”´  â”´ â”´â”˜â””â”˜â””â”€â”˜  â””â”€â”˜ â”´ â”´ â”´â”´â””â”€ â”´ â””â”€â”˜â”€â”´â”˜
  */
  //
  static async setup(SessionName) {
    console.log("- Sinstema iniciando");
    var session = Sessions.getSession(SessionName);
    await session.client.then(async (client) => {
      //
      client.ev.on('new.message', (mek) => {
        console.log(mek)
      });
      //
      client.ev.on('messages.upsert', m => {
        console.log('replying to', m.messages[0].key.remoteJid)
      });
      //
      client.ev.on('chats.delete', async e => {
        console.log(e)
      });
      //
      client.ev.on('presence.update', (presences) => {
        console.log('Presence: ', presences);
      });
      //
      client.ev.on('groups.update', (group) => {
        // Teste 1 - Alterei o nome do grupo e caiu aqui, onde o subject Ã© o novo nome
        console.log('Grupo update: ', group);
      });
      //
      client.ev.on('group-participants.update', (group) => {
        switch (group.action) {
          case 'add':
            console.log('Participante(s) adicionado(s): ', group.participants);
            break;

          case 'remove':
            console.log('Participante(s) removido(s): ', group.participants);
            break;

          case 'promote':
            console.log('Participante(s) promovido(s) a admin: ', group.participants);
            break;

          case 'demote':
            console.log('Participante(s) despromovido(s) de admin: ', group.participants);
            break;

          default:
            console.log('AÃ§Ã£o nÃ£o tratada');
            break;
        }
      });
      //
    });
  } //setup
  //
  // ------------------------------------------------------------------------------------------------//
  //
  static async State(SessionName) {
    console.log("- State");
    var session = Sessions.getSession(SessionName);
    var getState = await session.client.then(async client => {
      try {
        return client.state;
      } catch (error) {
        //console.log("- Erro ao fechar sessÃ£o:", error.message);
        //
        return {
          result: "error",
          state: session.state,
          status: session.status,
          message: "Erro ao obter state"
        };
        //
      }
    });
    return getState;;
  };
  //
  // ------------------------------------------------------------------------------------------------//
  //
  static async closeSession(SessionName) {
    console.log("- Fechando sessÃ£o");
    var session = Sessions.getSession(SessionName);
    var closeSession = await session.client.then(async client => {
      try {
        await client.close();
        //console.log("Result: ", result); //return object success
        //
        session.state = "CLOSED";
        session.status = 'CLOSED';
        console.log("- SessÃ£o fechada");
        //
        var returnClosed = {
          result: "success",
          state: session.state,
          status: session.status,
          message: "SessÃ£o fechada com sucesso"
        };
        //
        await updateStateDb(session.state, session.status, session.AuthorizationToken);
        //
        return returnClosed;
        //
      } catch (error) {
        //console.log("- Erro ao fechar sessÃ£o:", error);
        //
        return {
          result: "error",
          state: session.state,
          status: session.status,
          message: "Erro ao fechar sessÃ£o"
        };
        //
      };
    });
    //
    //await deletaToken(session.tokenPatch + "/" + SessionName + ".data.json");
    //
    await updateStateDb(session.state, session.status, session.AuthorizationToken);
    //
    return closeSession;
  } //closeSession
  //
  // ------------------------------------------------------------------------------------------------//
  //
  static async logoutSession(SessionName) {
    console.log("- Fechando sessÃ£o");
    var session = Sessions.getSession(SessionName);
    var LogoutSession = await session.client.then(async client => {
      try {
        await client.logout();
        //
        //await client.clearAuthInfo();
        //await client.close();
        //
        session.state = "DISCONNECTED";
        session.status = 'CLOSED';
        console.log("- SessÃ£o desconetada");
        //
        var returnLogout = {
          result: "success",
          state: session.state,
          status: session.status,
          message: "SessÃ£o desconetada"
        };
        //
        await deletaToken(`${session.tokenPatch}/${SessionName}.data.json`);
        //
        await updateStateDb(session.state, session.status, session.AuthorizationToken);
        //
        return returnLogout;
        //
      } catch (error) {
        //console.log("- Erro ao desconetar sessÃ£o:", error);
        //
        return {
          result: "error",
          state: session.state,
          status: session.status,
          message: "Erro ao desconetar sessÃ£o"
        };
        //
      };
    });
    //
    await updateStateDb(session.state, session.status, session.AuthorizationToken);
    //
    return LogoutSession;
  } //LogoutSession
  //
  //
  // ------------------------------------------------------------------------------------------------------- //
  //
  /*
  â•”â•— â”Œâ”€â”â”Œâ”€â”â”¬â”Œâ”€â”  â•”â•â•—â”¬ â”¬â”Œâ”â”Œâ”Œâ”€â”â”Œâ”¬â”â”¬â”Œâ”€â”â”Œâ”â”Œâ”Œâ”€â”  â”¬ â”¬â”Œâ”€â”â”Œâ”€â”â”Œâ”€â”â”Œâ”€â”
  â• â•©â•—â”œâ”€â”¤â””â”€â”â”‚â”‚    â• â•£ â”‚ â”‚â”‚â”‚â”‚â”‚   â”‚ â”‚â”‚ â”‚â”‚â”‚â”‚â””â”€â”  â”‚ â”‚â””â”€â”â”œâ”€â”¤â”‚ â”¬â”œâ”¤ 
  â•šâ•â•â”´ â”´â””â”€â”˜â”´â””â”€â”˜  â•š  â””â”€â”˜â”˜â””â”˜â””â”€â”˜ â”´ â”´â””â”€â”˜â”˜â””â”˜â””â”€â”˜  â””â”€â”˜â””â”€â”˜â”´ â”´â””â”€â”˜â””â”€â”˜
  */
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Enviar Contato
  static async sendContactVcard(
    SessionName, number, contact, namecontact
  ) {
    console.log("- Enviando contato.");
    //
    var session = Sessions.getSession(SessionName);
    var sendResult = await session.client.then(async client => {
      // Send contact
      const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
        +
        'VERSION:3.0\n' +
        'FN:' + namecontact + '\n' // full name
        +
        'ORG:Home;\n' // the organization of the contact
        +
        'TEL;type=CELL;type=VOICE;waid=' + contact + ':+' + contact + '\n' // WhatsApp ID + phone number
        +
        'END:VCARD'
      //
      return await client.sendMessage(number, {
        displayname: namecontact,
        vcard: vcard
      }, MessageType.contact).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Contato enviado com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao enviar contato"
        };
        //
      });
    });
    return sendResult;
  } //sendContactVcard

  //
  // ------------------------------------------------------------------------------------------------//
  //
  //Enviar Texto
  static async sendText(
    SessionName, number, msg
  ) {
    console.log("- Enviando menssagem de texto.");
    var session = Sessions.getSession(SessionName);
    var sendResult = await session.client.then(async client => {
      // send a simple text!
      return await client.sendMessage(number, {
        text: msg
      }).then((result) => {
        //console.log("Result: ", result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "group": number,
          "message": "Menssagem enviada com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error("Error when sending: ", erro); //return object error
        return {
          "erro": true,
          "status": 404,
          "group": number,
          "message": "Erro ao enviar menssagem"
        };
        //
      });
    });
    return sendResult;
  } //sendText
  //
  // ------------------------------------------------------------------------------------------------//
  //
  //Enviar localizaÃ§Ã£o
  static async sendLocation(
    SessionName,
    number,
    lat,
    long,
    caption
  ) {
    console.log("- Enviando localizaÃ§Ã£o.");
    var session = Sessions.getSession(SessionName);
    var sendResult = await session.client.then(async client => {
      //
      var options = {
        caption: caption,
        detectLinks: true
      };
      //
      return await client.sendMessage(number, {
        degreesLatitude: lat,
        degreesLongitude: long
      }, MessageType.location, options).then((result) => {
        //console.log("Result: ", result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "LocalizaÃ§Ã£o enviada com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error("Error when sending: ", erro); //return object error
        //return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
        //return (erro);
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao enviar localizaÃ§Ã£o."
        };
        //
      });
    });
    return sendResult;
  } //sendLocation
  //
  // ------------------------------------------------------------------------------------------------//
  //
  //Enviar links com preview
  static async sendLinkPreview(
    SessionName, number, link, caption
  ) {
    console.log("- Enviando link.");
    var session = Sessions.getSession(SessionName);
    var sendResult = await session.client.then(async client => {
      //
      var options = {
        caption: caption,
        detectLinks: true
      };
      //
      return await client.sendMessage(number, link, MessageType.text, options).then((result) => {
        //console.log("Result: ", result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Link enviada com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error("Error when sending: ", erro); //return object error
        //return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
        //return (erro);
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao enviar link."
        };
        //
      });
    });
    return sendResult;
  } //sendLinkPreview
  //
  // ------------------------------------------------------------------------------------------------//
  //
  //Enviar Imagem
  static async sendImage(
    SessionName, number, buffer, mimetype, filename, caption
  ) {
    console.log("- Enviando menssagem com imagem.");
    var session = Sessions.getSession(SessionName);
    var resultsendImage = await session.client.then(async (client) => {
      //
      var options = {
        mimetype: mimetype,
        caption: caption,
        filename: filename
      };
      //
      return await client.sendMessage(number, buffer, MessageType.image, options).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Menssagem enviada com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //return (erro);
        //
        return {
          "erro": true,
          "status": 404,

          "text": "error",
          "message": "Erro ao enviar menssagem"
        };
        //
      });
    });
    return resultsendImage;
  } //sendImage
  //
  // ------------------------------------------------------------------------------------------------//
  //
  //Enviar arquivo
  static async sendFile(
    SessionName,
    number,
    buffer,
    mimetype,
    originalname,
    fileExtension,
    caption
  ) {
    console.log("- Enviando arquivo", fileExtension);
    var session = Sessions.getSession(SessionName);
    var resultsendImage = await session.client.then(async (client) => {
      //
      let jpegBase64 = await gerateThumbnail(buffer, mimetype, originalname);
      //
      var options = {
        caption: caption,
        thumbnail: jpegBase64,
        mimetype: mimetype,
        filename: originalname,
        detectLinks: true,
        PreviewType: 1
      };
      //
      return await client.sendMessage(number, buffer, MessageType.document, options).then((result) => {
        //console.log('Result: ', result); //return object success
        //return (result);
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Arquivo enviado com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //return (erro);
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao enviar arquivo"
        };
        //
      });
    });
    return resultsendImage;
  } //sendFile
  //
  // ------------------------------------------------------------------------------------------------//
  //
  /*
  â•¦â•â•—â”Œâ”€â”â”Œâ”¬â”â”¬â”€â”â”¬â”Œâ”€â”â”¬  â”¬â”¬â”Œâ”â”Œâ”Œâ”€â”  â•”â•¦â•—â”Œâ”€â”â”Œâ”¬â”â”Œâ”€â”                
  â• â•¦â•â”œâ”¤  â”‚ â”œâ”¬â”˜â”‚â”œâ”¤ â””â”â”Œâ”˜â”‚â”‚â”‚â”‚â”‚ â”¬   â•‘â•‘â”œâ”€â”¤ â”‚ â”œâ”€â”¤                
  â•©â•šâ•â””â”€â”˜ â”´ â”´â””â”€â”´â””â”€â”˜ â””â”˜ â”´â”˜â””â”˜â””â”€â”˜  â•â•©â•â”´ â”´ â”´ â”´ â”´                
  */
  //
  // Recuperar contatos
  static async getAllContacts(
    SessionName
  ) {
    console.log("- Obtendo todos os contatos!");
    //
    var session = Sessions.getSession(SessionName);
    var resultgetAllContacts = await session.client.then(async client => {
      try {
        var result = client.contacts;
        //console.log('Result: ', result); //return object success
        //
        /*
        //
        await forEach(result, async (resultAllContacts) => {
          var tableName = resultAllContacts.jid;
          console.log(tableName);
        });
        //
				*/
        /*
				var getChatGroupNewMsg = [];

        await forEach(result, async (resultAllContacts) => {
          //
          //if (resultAllContacts.isMyContact === true || resultAllContacts.isMyContact === false && resultAllContacts.isUser === true) {
          //
          getChatGroupNewMsg.push({
            "user": resultAllContacts.jid,            "name": resultAllContacts.name,            "shortName": resultAllContacts.short,            "pushname": resultAllContacts.notify,            "formattedName": resultAllContacts.vname,            "isMyContact": resultAllContacts.verify,            "isWAContact": '',            "isBusiness": ''
          });
          //}
          //
        });
				*/
        //
        return result;
        //
      } catch (erro) {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao recuperar contatos"
        };
        //
      };
      //
    });
    //
    return resultgetAllContacts;
  } //getAllContacts
  //
  // ------------------------------------------------------------------------------------------------//
  //
  /*
    // Recuperar chats
    static async getAllChats(
      SessionName
    ) {
      console.log("- Obtendo todos os chats");
      //
      var session = Sessions.getSession(SessionName);
      var resultgetAllChats = await session.client.then(async client => {
        let chatArray = []
        try {
          const Chats = await client.loadChats();
          let allChats = Chats.chats
          for (let i = 0; i < allChats.length; i++) {
            let count = 1;
            let id = count + i;
            let newDate = moment.unix(allChats[i].t).format('DD/MM/YYYY HH:MM:ss');
            let messagesBody = allChats[i].messages;
            let LastMessage = JSON.parse(JSON.stringify(messagesBody));
            let LengthMessages = LastMessage.length - 1;
            let MessagePresence = null;
            let Name = null;
            let phonePP = allChats[i].jid.replace('@s.whatsapp.net', '');
            if (allChats[i].name) Name = allChats[i].name;
            else Name = allChats[i].jid.replace('@s.whatsapp.net', '');

            if (LastMessage[LengthMessages].message) MessagePresence = LastMessage[LengthMessages].message.conversation;
            else MessagePresence = 'NÃ£o foi possÃ­vel carregar as mensagens anteriores';
            let PPIMAGE = null;
            try {
              PPIMAGE = await client.getProfilePicture(`${phonePP}@c.us`);
            } catch (e) {
              PPIMAGE = 'https://upload.wikimedia.org/wikipedia/en/e/ee/Unknown-person.gif';
            }
            
            chatArray = [...chatArray, {
              chatId: id,              time: newDate,              phone: allChats[i].jid.replace('@s.whatsapp.net', ''),              title: Name,              image: PPIMAGE,              lastchat: MessagePresence
            }]
  					
            //
            chatArray.push({
              "user": allChats[i].jid.replace('@s.whatsapp.net', ''),              "name": Name,              "formattedName": Name
            });
            //
          }
          return chatArray;
          //
        } catch (erro) {
          //console.error('Error when sending: ', erro); //return object error
          //
          return {
            "erro": true,            "status": 404,            "message": "Erro ao recuperar grupos"
          };
          //
        };
        //
      });
      //
      return resultgetAllChats;
    } //getAllChats
  	*/
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Recuperar grupos
  static async getAllGroups(
    SessionName
  ) {
    console.log("- Obtendo todos os grupos");
    //
    var session = Sessions.getSession(SessionName);
    var resultgetAllGroups = await session.client.then(async client => {
      let chatArray = [];
      try {
        const Chats = await client.loadChats();
        let allChats = Chats.chats;
        for (let i = 0; i < allChats.length; i++) {
          let count = 1;
          let id = count + i;
          let newDate = moment.unix(allChats[i].t).format('DD/MM/YYYY HH:MM:ss');
          let messagesBody = allChats[i].messages;
          let LastMessage = JSON.parse(JSON.stringify(messagesBody));
          let LengthMessages = LastMessage.length - 1;
          let MessagePresence = null;
          let Name = null;
          let phonePP = allChats[i].jid.replace('@s.whatsapp.net', '');
          if (allChats[i].name) {
            Name = allChats[i].name;
          } else {
            Name = allChats[i].jid.replace('@s.whatsapp.net', '');
          }
          //
          // if (LastMessage[LengthMessages].message) MessagePresence = LastMessage[LengthMessages].message.conversation;
          //else MessagePresence = 'NÃ£o foi possÃ­vel carregar as mensagens anteriores'
          let PPIMAGE = null;
          try {
            PPIMAGE = await client.getProfilePicture(`${phonePP}@c.us`);
          } catch (e) {
            PPIMAGE = 'https://upload.wikimedia.org/wikipedia/en/e/ee/Unknown-person.gif';
          }
          if (allChats[i].jid.includes('@g.us')) {
            /*
            chatArray = [
              ...chatArray,              {
                chatId: id,                time: newDate,                phone: allChats[i].jid.replace('@s.whatsapp.net', ''),                title: Name,                image: PPIMAGE,              },            ]
						*/
            //
            chatArray.push({
              "user": allChats[i].jid.replace('@g.us', ''),
              "name": Name,
              "formattedName": Name
            });
            //
          }
        }
        return chatArray;
        //
      } catch (erro) {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao recuperar grupos"
        };
        //
      };
      //
    });
    //
    return resultgetAllGroups;
  } //getAllGroups
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Returns browser session token
  static async getSessionTokenBrowser(SessionName) {
    console.log("- Obtendo  Session Token Browser.");
    var session = Sessions.getSession(SessionName);
    var resultgetSessionTokenBrowser = await session.client.then(async client => {
      try {
        //const result = JSON.parse(fs.readFileSync(`${session.tokenPatch}/${SessionName}.data.json`, 'utf8'));
        //const result = session.browserSessionToken.replace(/\r?\n?\t|\r|\r|\n/g, '');
        const result = session.browserSessionToken;
        //console.log('Result: ', result); //return object success
        return result;
      } catch (erro) {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao recuperar token browser"
        };
        //
      };
    });
    return resultgetSessionTokenBrowser;
  } //getSessionTokenBrowser
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Chama sua lista de contatos bloqueados
  static async getBlockList(SessionName) {
    console.log("- getBlockList");
    var session = Sessions.getSession(SessionName);
    var resultgetBlockList = await session.client.then(async client => {
      try {
        var result = session.blocklist;
        //console.log('Result: ', result); //return object success
        return result;
      } catch (erro) {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao recuperar lista de contatos bloqueados"
        };
        //
      };
    });
    return resultgetBlockList;
  } //getBlockList
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Recuperar status de contato
  static async getStatus(
    SessionName, number
  ) {
    console.log("- Obtendo status!");
    var session = Sessions.getSession(SessionName);
    var resultgetStatus = await session.client.then(async client => {
      return await client.getStatus(number).then((result) => {
        //console.log('Result: ', result); //return object success
        return result;
      }).catch((erro) => {
        //console.error('Error when sending:\n', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao recuperar status de contato"
        };
        //
      });
    });
    return resultgetStatus;
  } //getStatus
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Recuperar status de contato
  static async getNumberProfile(
    SessionName, number
  ) {
    console.log("- Obtendo status!");
    var session = Sessions.getSession(SessionName);
    var resultgetNumberProfile = await session.client.then(async client => {
      return await client.getNumberProfile(number).then((result) => {
        //console.log('Result: ', result); //return object success
        return result;
      }).catch((erro) => {
        //console.error('Error when sending:\n', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao recuperar profile"
        };
        //
      });
    });
    return resultgetNumberProfile;
  } //getStatus
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Obter a foto do perfil do servidor
  static async getProfilePicFromServer(
    SessionName, number
  ) {
    console.log("- Obtendo a foto do perfil do servidor!");
    var session = Sessions.getSession(SessionName);
    var resultgetProfilePicFromServer = await session.client.then(async client => {
      return await client.getProfilePicture(number).then((result) => {
        //console.log('Result: ', result); //return object success
        return {
          "url": result
        };
      }).catch((erro) => {
        //console.error('Error when sending:\n', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao obtendo a foto do perfil no servidor"
        };
        //
      });
    });
    return resultgetProfilePicFromServer;
  } //getProfilePicFromServer
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Verificar o status do nÃºmero
  static async checkNumberStatus(
    SessionName, number
  ) {
    console.log("- canReceiveMessage");
    var session = Sessions.getSession(SessionName);
    var resultcheckNumberStatus = await session.client.then(async client => {
      //
      return await client.onWhatsApp(number).then((result) => {
        console.log('Result: ', result); //return object success
        //
        if (result.exists) {
          //
          return {
            "erro": false,
            "status": 200,
            "number": result.jid,
            "message": "O nÃºmero informado pode receber mensagens via whatsapp"
          };
          //
        } else if (!result.exists) {
          //
          return {
            "erro": true,
            "status": 404,
            "number": result.jid,
            "message": "O nÃºmero informado nÃ£o pode receber mensagens via whatsapp"
          };
          //
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "message": "Erro ao verificar nÃºmero informado"
          };
          //
        }
      }).catch((erro) => {
        //console.error('Error when sending:\n', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao verificar nÃºmero informado"
        };
        //
      });
    });
    return resultcheckNumberStatus;
  } //checkNumberStatus
  //
  // ------------------------------------------------------------------------------------------------//
  //
  /*
  â•”â•â•—â”¬â”€â”â”Œâ”€â”â”¬ â”¬â”Œâ”€â”  â•”â•â•—â”¬ â”¬â”Œâ”â”Œâ”Œâ”€â”â”Œâ”¬â”â”¬â”Œâ”€â”â”Œâ”â”Œâ”Œâ”€â”               
  â•‘ â•¦â”œâ”¬â”˜â”‚ â”‚â”‚ â”‚â”œâ”€â”˜  â• â•£ â”‚ â”‚â”‚â”‚â”‚â”‚   â”‚ â”‚â”‚ â”‚â”‚â”‚â”‚â””â”€â”               
  â•šâ•â•â”´â””â”€â””â”€â”˜â””â”€â”˜â”´    â•š  â””â”€â”˜â”˜â””â”˜â””â”€â”˜ â”´ â”´â””â”€â”˜â”˜â””â”˜â””â”€â”˜               
  */
  //
  // Deixar o grupo
  static async leaveGroup(
    SessionName, groupId
  ) {
    console.log("- leaveGroup");
    var session = Sessions.getSession(SessionName);
    var resultleaveGroup = await session.client.then(async client => {
      return await client.groupLeave(groupId).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        if (result.status == 200 || result.status == 207) {
          return {
            "erro": false,
            "status": 200,
            "groupId": groupId,
            "message": "Grupo deixado com sucesso"
          };
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "groupId": groupId,
            "message": "Erro ao deixar o grupo"
          };
          //
        }
        //
      }).catch((erro) => {
        // console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "groupId": groupId,
          "message": "Erro ao deixar o grupo"
        };
        //
      });
    });
    return resultleaveGroup;
  } //leaveGroup
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Obtenha membros do grupo
  static async getGroupMembers(
    SessionName, groupId
  ) {
    console.log("- getGroupMembers");
    var session = Sessions.getSession(SessionName);
    var resultgetGroupMembers = await session.client.then(async client => {
      return await client.groupMetadata(groupId).then(async (result) => {
        //console.log('Result: ', result); //return object success
        //
        var participants = [];
        //
        await forEach(result.participants, async (resultAllContacts) => {
          //
          if (resultAllContacts.isSuperAdmin == false) {
            //
            participants.push({
              "user": resultAllContacts.id.replace('@c.us', ''),
              "name": resultAllContacts.name,
              "shortName": resultAllContacts.short,
              "pushname": resultAllContacts.notify,
              "formattedName": resultAllContacts.formattedName
            });
            //
          }
          //
        });
        //
        return participants;
        //
      }).catch((erro) => {
        //console.error('Error when sending:\n', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "groupId": groupId,
          "message": "Erro ao obter membros do grupo"
        };
        //
      });
    });
    return resultgetGroupMembers;
  } //getGroupMembers
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Obter IDs de membros do grupo
  static async getGroupMembersIds(
    SessionName, groupId
  ) {
    console.log("- getGroupMembersIds");
    var session = Sessions.getSession(SessionName);
    var resultgetGroupMembersIds = await session.client.then(async client => {
      return await client.groupMetadata(groupId).then(async (result) => {
        //console.log('Result: ', result); //return object success
        //
        var participants = [];
        //
        await forEach(result.participants, async (resultAllContacts) => {
          //
          if (resultAllContacts.isSuperAdmin == false) {
            //
            participants.push({
              "server": resultAllContacts.id.split('@')[1],
              "user": resultAllContacts.id.split('@')[0],
              "_serialized": resultAllContacts.id
            });
            //
          }
          //
        });
        //
        return participants;
        //
      }).catch((erro) => {
        console.error('Error when sending:\n', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "groupId": groupId,
          "message": "Erro ao obter membros do grupo"
        };
        //
      });
    });
    return resultgetGroupMembersIds;
  } //getGroupMembersIds
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Gerar link de url de convite de grupo
  static async getGroupInviteLink(
    SessionName, groupId
  ) {
    console.log("- getGroupInviteLink");
    var session = Sessions.getSession(SessionName);
    var resultgetGroupInviteLink = await session.client.then(async client => {
      return await client.groupInviteCode(groupId).then((result) => {
        //console.log('Result: ', result); //return object success
        var url = "https://chat.whatsapp.com/"
        //
        var resultInvite = {
          "erro": false,
          "status": 200,
          "groupcode": result,
          "groupurl": url + result,
          "message": "Link de convite do grupo obtido com sucesso"
        };
        //
        //
        return resultInvite;
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "groupId": groupId,
          "message": "Erro ao obter link de convite de grupo"
        };
        //
      });
    });
    return resultgetGroupInviteLink;
  } //getGroupInviteLink
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Criar grupo (tÃ­tulo, participantes a adicionar)
  static async createGroup(
    SessionName, title, contactlistValid, contactlistInvalid
  ) {
    console.log("- createGroup");
    var session = Sessions.getSession(SessionName);
    var resultgetGroupInviteLink = await session.client.then(async client => {
      return await client.groupCreate(title, contactlistValid).then(async (result) => {
        //console.log('Result: ', result); //return object success
        //
        if (result.status == 200 || result.status == 207) {
          // await client.groupUpdateDescription(result.gid, title);
          return {
            "erro": false,
            "status": 200,
            "title": title,
            "gid": result.gid.replace('@g.us', ''),
            "contactlistValid": contactlistValid,
            "contactlistInvalid": contactlistInvalid,
            "message": "Grupo criado com a lista de contatos validos"
          };
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "title": title,
            "gid": null,
            "contactlistValid": contactlistValid,
            "contactlistInvalid": contactlistInvalid,
            "message": "Erro ao criar grupo"
          };
          //
        }
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "title": title,
          "gid": null,
          "contactlistValid": contactlistValid,
          "contactlistInvalid": contactlistInvalid,
          "message": "Erro ao criar grupo"
        };
        //
      });
    });
    return resultgetGroupInviteLink;
  } //createGroup
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Criar grupo (tÃ­tulo, participantes a adicionar)
  static async deleteChat(
    SessionName,
    Id
  ) {
    console.log("- deleteChat");
    var session = Sessions.getSession(SessionName);
    var resultdeleteChat = await session.client.then(async client => {
      return await client.deleteChat(Id).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        if (result.status == 200 || result.status == 207) {
          return {
            "erro": false,
            "status": 200,
            "message": "Grupo apagado com sucesso"
          };
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "message": "Erro ao apagar grupo"
          };
          //
        }
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao apagar grupo"
        };
        //
      });
    });
    return resultdeleteChat;
  } //deleteChat
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Remove participante
  static async removeParticipant(
    SessionName, groupId, phonefull
  ) {
    console.log("- removeParticipant");
    var session = Sessions.getSession(SessionName);
    var resultremoveParticipant = await session.client.then(async client => {
      return await client.groupRemove(groupId, phonefull).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        if (result.status == 200 || result.status == 207) {
          return {
            "erro": false,
            "status": 200,
            "number": phonefull,
            "message": "Participante removido com sucesso"
          };
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "number": phonefull,
            "message": "Erro ao remover participante"
          };
          //
        }
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "number": phonefull,
          "message": "Erro ao remover participante"
        };
        //
      });
    });
    return resultremoveParticipant;
  } //removeParticipant
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Adicionar participante
  static async addParticipant(
    SessionName, groupId, phonefull
  ) {
    console.log("- addParticipant");
    var session = Sessions.getSession(SessionName);
    var resultaddParticipant = await session.client.then(async client => {
      return await client.groupAdd(groupId, phonefull).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        if (result.status == 200 || result.status == 207) {
          return {
            "erro": false,
            "status": 200,
            "number": phonefull,
            "message": "Participante adicionado com sucesso"
          };
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "number": phonefull,
            "message": "Erro ao adicionar participante"
          };
          //
        }
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "number": phonefull,
          "message": "Erro ao adicionar participante"
        };
        //
      });
    });
    return resultaddParticipant;
  } //addParticipant
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Promote participant (Give admin privileges)
  static async promoteParticipant(
    SessionName, groupId, contactlistValid
  ) {
    console.log("- promoteParticipant");
    var session = Sessions.getSession(SessionName);
    var resultpromoteParticipant = await session.client.then(async client => {
      return await client.groupMakeAdmin(groupId, contactlistValid).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        if (result.status == 200 || result.status == 207) {
          return {
            "erro": false,
            "status": result.status,
            "number": contactlistValid,
            "message": "Participante promovido a administrador"
          };
        } else {
          //
          return {
            "erro": true,
            "status": result.status,
            "number": contactlistValid,
            "message": "Erro ao promover participante a administrador"
          };
          //
        }
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "number": contactlistValid,
          "message": "Erro ao promover participante a administrador"
        };
        //
      });
    });
    return resultpromoteParticipant;
  } //promoteParticipant
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Depromote participant (Give admin privileges)
  static async demoteParticipant(
    SessionName, groupId, phonefull
  ) {
    console.log("- demoteParticipant");
    var session = Sessions.getSession(SessionName);
    var resultdemoteParticipant = await session.client.then(async client => {
      return await client.groupDemoteAdmin(groupId, phonefull).then((result) => {
        //console.log('Result: ', demoteParticipant); //return object success
        //
        if (result.status == 200 || result.status == 207) {
          return {
            "erro": false,
            "status": result.status,
            "number": phonefull,
            "message": "Participante removido de administrador"
          };
        } else {
          //
          return {
            "erro": true,
            "status": result.status,
            "number": phonefull,
            "message": "Erro ao remover participante de administrador"
          };
          //
        }
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "number": phonefull,
          "message": "Erro ao remover participante de administrador"
        };
        //
      });
    });
    return resultdemoteParticipant;
  } //demoteParticipant
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Retorna o status do grupo, jid, descriÃ§Ã£o do link de convite
  static async getGroupInfoFromInviteLink(
    SessionName, InviteCode
  ) {
    console.log("- Obtendo chats!");
    var session = Sessions.getSession(SessionName);
    var resultgetGroupInfoFromInviteLink = await session.client.then(async client => {
      return await client.getGroupInfoFromInviteLink(InviteCode).then((result) => {
        //console.log('Result: ', result); //return object success
        return result;
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao obter link de convite"
        };
        //
      });
    });
    return resultgetGroupInfoFromInviteLink;
  } //getGroupInfoFromInviteLink
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Junte-se a um grupo usando o cÃ³digo de convite do grupo
  static async joinGroup(
    SessionName, InviteCode
  ) {
    console.log("- joinGroup");
    var session = Sessions.getSession(SessionName);
    var resultjoinGroup = await session.client.then(async client => {
      return await client.acceptInvite(InviteCode).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        if (result.status == 200 || result.status == 207) {
          return {
            "erro": false,
            "status": 200,
            "message": "Convite para grupo aceito com suceso"
          };
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "message": "Erro ao aceitar convite para grupo"
          };
          //
        }
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao entra no grupo via convite"
        };
        //
      });
    });
    return resultjoinGroup;
  } //joinGroup
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Junte-se a um grupo usando o cÃ³digo de convite do grupo
  static async onlyAdminsMessagesGroup(
    SessionName,
    groupId
  ) {
    console.log("- onlyAdminsMessagesGroup");
    var session = Sessions.getSession(SessionName);
    var onlyAdminsMessagesGroup = await session.client.then(async client => {
      return await client.groupSettingChange(groupId, GroupSettingChange.messageSend, true).then((result) => {
        //console.log('- Result: ', result); //return object success
        //
        if (result.status == 200 || result.status == 207) {
          return {
            "erro": false,
            "status": 200,
            "message": "Apenas mensagens de admins"
          };
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "message": "Erro ao habilitar apenas mensagens de admins"
          };
          //
        }
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao habilitar apenas mensagens de admins"
        };
        //
      });
    });
    return onlyAdminsMessagesGroup;
  } //onlyAdminsMessagesGroup
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Junte-se a um grupo usando o cÃ³digo de convite do grupo
  static async everyoneModifySettingsGroup(
    SessionName,
    groupId,
    change
  ) {
    console.log("- everyoneModifySettingsGroup");
    var session = Sessions.getSession(SessionName);
    var everyoneModifySettingsGroup = await session.client.then(async client => {
      return await client.groupSettingChange(groupId, GroupSettingChange.settingsChange, change).then((result) => {
        //console.log('- Result: ', result); //return object success
        //
        if (result.status == 200 || result.status == 207) {
          if (change) {
            return {
              "erro": false,
              "status": 200,
              "message": "Todos modificam as configuraÃ§Ãµes do grupo"
            };
          } else {
            return {
              "erro": false,
              "status": 200,
              "message": "Somente admins podem modificar as configuraÃ§Ãµes do grupo"
            };
          }
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "message": "Erro ao habilitar as configuraÃ§Ãµes do grupo"
          };
          //
        }
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao habilitar as configuraÃ§Ãµes do grupo"
        };
        //
      });
    });
    return everyoneModifySettingsGroup;
  } //everyoneModifySettingsGroup
  //
  // ------------------------------------------------------------------------------------------------//
  //
  /*
  â•”â•â•—â”¬â”€â”â”Œâ”€â”â”Œâ”€â”â”¬â”¬  â”Œâ”€â”  â•”â•â•—â”¬ â”¬â”Œâ”â”Œâ”Œâ”€â”â”Œâ”¬â”â”¬â”Œâ”€â”â”Œâ”â”Œâ”Œâ”€â”           
  â• â•â•â”œâ”¬â”˜â”‚ â”‚â”œâ”¤ â”‚â”‚  â”œâ”¤   â• â•£ â”‚ â”‚â”‚â”‚â”‚â”‚   â”‚ â”‚â”‚ â”‚â”‚â”‚â”‚â””â”€â”           
  â•©  â”´â””â”€â””â”€â”˜â””  â”´â”´â”€â”˜â””â”€â”˜  â•š  â””â”€â”˜â”˜â””â”˜â””â”€â”˜ â”´ â”´â””â”€â”˜â”˜â””â”˜â””â”€â”˜           
  */
  //
  // Set client status
  static async setProfileStatus(
    SessionName, ProfileStatus
  ) {
    console.log("- setProfileStatus");
    var session = Sessions.getSession(SessionName);
    var resultsetProfileStatus = await session.client.then(async client => {
      return await client.setProfileStatus(ProfileStatus).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Profile status alterado com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //return erro;
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao alterar profile status."
        };
        //
      });
    });
    return resultsetProfileStatus;
  } //setProfileStatus
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Set client profile name
  static async setProfileName(
    SessionName, ProfileName
  ) {
    console.log("- setProfileName");
    var session = Sessions.getSession(SessionName);
    var resultsetProfileName = await session.client.then(async client => {
      return await client.updateProfileName(ProfileName).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Profile name alterado com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //return erro;
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao alterar profile name."
        };
        //
      });
    });
    return resultsetProfileName;
  } //setProfileName
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Set client profile photo
  static async setProfilePic(
    SessionName, path
  ) {
    console.log("- setProfilePic");
    var session = Sessions.getSession(SessionName);
    var resultsetProfilePic = await session.client.then(async client => {
      return await client.setProfilePic(path).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Profile pic alterado com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao alterar profile pic."
        };
        //
      });
    });
    return resultsetProfilePic;
  } //setProfilePic
  //
  // ------------------------------------------------------------------------------------------------//
  //
  /*
  â•”â•¦â•—â”Œâ”€â”â”¬  â”¬â”¬â”Œâ”€â”â”Œâ”€â”  â•”â•â•—â”¬ â”¬â”Œâ”â”Œâ”Œâ”€â”â”Œâ”¬â”â”¬â”Œâ”€â”â”Œâ”â”Œâ”Œâ”€â”             
   â•‘â•‘â”œâ”¤ â””â”â”Œâ”˜â”‚â”‚  â”œâ”¤   â• â•£ â”‚ â”‚â”‚â”‚â”‚â”‚   â”‚ â”‚â”‚ â”‚â”‚â”‚â”‚â””â”€â”             
  â•â•©â•â””â”€â”˜ â””â”˜ â”´â””â”€â”˜â””â”€â”˜  â•š  â””â”€â”˜â”˜â””â”˜â””â”€â”˜ â”´ â”´â””â”€â”˜â”˜â””â”˜â””â”€â”˜             
  */
  //
  // Delete the Service Worker
  static async killServiceWorker(SessionName) {
    console.log("- killServiceWorker");
    var session = Sessions.getSession(SessionName);
    var resultkillServiceWorker = await session.client.then(async client => {
      return await client.killServiceWorker().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "ServiÃ§o parado com sucesso.",
          "killService": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao parar serviÃ§o."
        };
        //
      });
    });
    return resultkillServiceWorker;
  } //killServiceWorker
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Load the service again
  static async restartService(SessionName) {
    console.log("- restartService");
    var session = Sessions.getSession(SessionName);
    var resultrestartService = await session.client.then(async client => {
      return await client.restartService().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "ServiÃ§o reiniciado com sucesso.",
          "restartService": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao reiniciar serviÃ§o."
        };
        //
      });
    });
    return resultrestartService;
  } //restartService
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Get device info
  static async getHostDevice(SessionName) {
    console.log("- getHostDevice");
    var session = Sessions.getSession(SessionName);
    var resultgetHostDevice = await session.client.then(async client => {
      return await client.getHostDevice().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Dados do dispositivo obtido com sucesso",
          "HostDevice": {
            "user": result.wid.user,
            "connected": result.connected,
            "isResponse": result.isResponse,
            "battery": result.battery,
            "plugged": result.plugged,
            "locales": result.locales,
            "is24h": result.is24h,
            "device_manufacturer": result.phone.device_manufacturer,
            "platform": result.platform,
            "os_version": result.phone.os_version,
            "wa_version": result.phone.wa_version,
            "pushname": result.pushname
          }
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao obter dados do dispositivo"
        };
        //
      });
    });
    return resultgetHostDevice;
  } //getHostDevice
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Get connection state
  static async getConnectionState(SessionName) {
    console.log("- getConnectionState");
    var session = Sessions.getSession(SessionName);
    var resultisConnected = await session.client.then(async client => {
      return await client.getConnectionState().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Estado do dispositivo obtido com sucesso",
          "ConnectionState": result

        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao obter o estado da conexÃ£o"
        };
        //
      });
    });
    return resultisConnected;
  } //getConnectionState
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Get battery level
  static async getBatteryLevel(SessionName) {
    console.log("- getBatteryLevel");
    var session = Sessions.getSession(SessionName);
    var resultgetBatteryLevel = await session.client.then(async client => {
      return await client.getBatteryLevel().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Nivel da bateria obtido com sucesso",
          "BatteryLevel": result

        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao obter o nivel da bateria"
        };
        //
      });
    });
    return resultgetBatteryLevel;
  } //getBatteryLevel
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Is Connected
  static async isConnected(SessionName) {
    console.log("- isConnected");
    var session = Sessions.getSession(SessionName);
    var resultisConnected = await session.client.then(async client => {
      return await client.isConnected().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Estatus obtido com sucesso",
          "Connected": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao obter estatus"
        };
        //
      });
    });
    return resultisConnected;
  } //isConnected
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Obter versÃ£o do WhatsappWeb
  static async getWAVersion(SessionName) {
    console.log("- getWAVersion");
    var session = Sessions.getSession(SessionName);
    var resultgetWAVersion = await session.client.then(async client => {
      return await client.getWAVersion().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "VersÃ£o do WhatsappWeb obtido com sucesso",
          "WAVersion": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao obter versÃ£o do WhatsappWeb"
        };
        //
      });
    });
    return resultgetWAVersion;
  } //getWAVersion
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Inicia a verificaÃ§Ã£o de conexÃ£o do telefone
  static async startPhoneWatchdog(SessionName, interval) {
    console.log("- startPhoneWatchdog");
    var session = Sessions.getSession(SessionName);
    var resultgetWAVersion = await session.client.then(async client => {
      return await client.startPhoneWatchdog(interval).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "VerificaÃ§Ã£o de conexÃ£o do telefone iniciada com sucesso",
          "PhoneWatchdog": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao inicia a verificaÃ§Ã£o de conexÃ£o do telefone"
        };
        //
      });
    });
    return resultgetWAVersion;
  } //startPhoneWatchdog
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Para a verificaÃ§Ã£o de conexÃ£o do telefone
  static async stopPhoneWatchdog(SessionName) {
    console.log("- stopPhoneWatchdog");
    var session = Sessions.getSession(SessionName);
    var resultgetWAVersion = await session.client.then(async client => {
      return await client.stopPhoneWatchdog().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "VerificaÃ§Ã£o de conexÃ£o parada iniciada com sucesso",
          "PhoneWatchdog": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao parar a verificaÃ§Ã£o de conexÃ£o do telefone"
        };
        //
      });
    });
    return resultgetWAVersion;
  } //getWAVersion
  //
  // ------------------------------------------------------------------------------------------------//
  //
  /*
  â•”â•¦â•—â”Œâ”€â”â”Œâ”€â”â”Œâ”¬â”â”Œâ”€â”â”Œâ”€â”  â”Œâ”¬â”â”Œâ”€â”  â•¦â•â•—â”Œâ”€â”â”Œâ”¬â”â”Œâ”€â”â”Œâ”€â”
   â•‘ â”œâ”¤ â””â”€â” â”‚ â”œâ”¤ â””â”€â”   â”‚â”‚â”œâ”¤   â• â•¦â•â”‚ â”‚ â”‚ â”œâ”€â”¤â””â”€â”
   â•© â””â”€â”˜â””â”€â”˜ â”´ â””â”€â”˜â””â”€â”˜  â”€â”´â”˜â””â”€â”˜  â•©â•šâ•â””â”€â”˜ â”´ â”´ â”´â””â”€â”˜
   */
  //
  // ------------------------------------------------------------------------------------------------//
  //
  static async RotaTeste() {
    //console.log('Result: ', result); //return object success
    //
    var result = {
      "556792373218@s.whatsapp.net": {
        "jid": "556792373218@s.whatsapp.net",
        "notify": "Juciane Medeiros",
        "name": "Juci/Maianne",
        "short": "Juci/Maianne"
      },
      "556791400941@s.whatsapp.net": {
        "jid": "556791400941@s.whatsapp.net",
        "name": "Paulinho / Garagem FlÃ¡vio",
        "short": "Paulinho /"
      },
      "554396030588@s.whatsapp.net": {
        "jid": "554396030588@s.whatsapp.net",
        "notify": "Gabriel Milhorini"
      }
    };
    //
    console.log(result[1]);
    //
    var getChatGroupNewMsg = [];
    //
    await forEach(result, async (resultAllContacts) => {
      //
      getChatGroupNewMsg.push({
        "user": resultAllContacts.jid,
        "name": resultAllContacts.name,
        "shortName": resultAllContacts.short,
        "pushname": resultAllContacts.notify,
        "formattedName": resultAllContacts.vname,
        "isMyContact": resultAllContacts.verify
      });
      //
    });
    //
    return getChatGroupNewMsg;
    //
  } //RotaTeste
  //
  // ------------------------------------------------------------------------------------------------//
  //
}