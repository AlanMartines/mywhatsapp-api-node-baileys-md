//
// Configuração dos módulos
const config = require('./config.global');
const os = require("os");
const fs = require("fs-extra");
const qr = require("qr-image");
const moment = require("moment");
const {
  forEach
} = require('p-iteration');
const axios = require('axios');
const makeWASocket, {
  WASocket,
  AuthenticationState,
  DisconnectReason,
  AnyMessageContent,
  BufferJSON,
  initInMemoryKeyStore,
  delay
} = require('@adiwajshing/baileys-md');
const {
  WAConnection,
  MessageType,
  Presence,
  MessageOptions,
  Mimetype,
  WALocationMessage,
  WA_MESSAGE_STUB_TYPES,
  ReconnectMode,
  ProxyAgent,
  waChatKey,
} = require('@adiwajshing/baileys-md');
const io = require("socket.io-client"),
  ioClient = io.connect("http://" + config.HOST + ":" + config.PORT);
const {
  cache
} = require('sharp');
const con = require("./config/dbConnection");
//require('dotenv/config');
/*
require("dotenv").config({
  path: "./.env"
});
*/
//
// ------------------------------------------------------------------------------------------------------- //
//
async function DataHora() {
  //
  let date_ob = new Date();

  // Data atual
  // Ajuste 0 antes da data de um dígito
  let date = ("0" + date_ob.getDate()).slice(-2);

  // Mês atual
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  // Ano atual
  let year = date_ob.getFullYear();

  // Hora atual
  let hours = date_ob.getHours();

  // Minuto atual
  let minutes = date_ob.getMinutes();

  // Segundo atual
  let seconds = date_ob.getSeconds();

  // Imprime a data no formato AAAA-MM-DD
  console.log(year + "-" + month + "-" + date);

  // Imprime a data no formato DD/MM/YYYY
  console.log(date + "/" + month + "/" + year);

  // Imprime data e hora no formato AAAA-MM-DD HH:MM:SS
  console.log(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);

  // Imprime data e hora no formato DD/MM/YYYY HH:MM:SS
  console.log(date + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds);

  // Imprime a hora no formato HH:MM:SS
  console.log(hours + ":" + minutes + ":" + seconds);
  //
  return date + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
}
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
    var saudacao = "---";
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
async function updateStateDb(state, status, session_venom) {
  //
  const date_now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  console.log("- Date:", date_now);
  //
  //
  const sql = "UPDATE tokens SET state=?, status=?, lastactivit=? WHERE token=?";
  const values = [state, status, date_now, session_venom];
  //
  if (parseInt(config.VALIDATE_MYSQL) == true) {
    const conn = require('./config/dbConnection').promise();
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
async function deletaToken(filePath) {
  //
  const cacheExists = await fs.pathExists(filePath);
  console.log('- O arquivo é: ' + cacheExists);
  console.log('- Path: ' + filePath);
  if (cacheExists) {
    fs.remove(filePath);
    console.log('- O arquivo foi removido: ' + cacheExists);
  }
}
//
module.exports = class Sessions {
  //
  static async getStatusApi(sessionName, options = []) {
    Sessions.options = Sessions.options || options;
    Sessions.sessions = Sessions.sessions || [];

    var session = Sessions.getSession(sessionName);
    return session;
  } //getStatus
  //
  static async ApiStatus(SessionName) {
    console.log("- Status");
    var session = Sessions.getSession(SessionName);

    if (session) { //só adiciona se não existir
      if (session.state == "CONNECTED") {
        return {
          result: "info",
          SessionName: SessionName,
          state: session.state,
          status: session.status,
          qrcode: session.qrcodedata,
          message: "Sistema iniciado e disponivel para uso"
        };
      } else if (session.state == "STARTING") {
        return {
          result: "info",
          SessionName: SessionName,
          state: session.state,
          status: session.status,
          qrcode: session.qrcodedata,
          message: "Sistema iniciando e indisponivel para uso"
        };
      } else if (session.state == "QRCODE") {
        return {
          result: "warning",
          SessionName: SessionName,
          state: session.state,
          status: session.status,
          qrcode: session.qrcodedata,
          message: "Sistema aguardando leitura do QR-Code"
        };
      } else if (session.state == "CLOSED") {
        return {
          result: "info",
          SessionName: SessionName,
          state: session.state,
          status: session.status,
          qrcode: session.qrcodedata,
          message: "Sessão fechada"
        };
      } else {
        return {
          result: "warning",
          SessionName: SessionName,
          state: session.state,
          status: session.status,
          qrcode: session.qrcodedata,
          message: "Sistema iniciado e indisponivel para uso"
        };
      }
    } else {
      return {
        result: 'error',
        SessionName: SessionName,
        state: 'NOTFOUND',
        status: 'notLogged',
        qrcode: null,
        message: 'Sistema Off-line'
      };
    }
  } //status
  //
  // ------------------------------------------------------------------------------------------------------- //
  //
  static async Start(SessionName, options = []) {
    Sessions.options = Sessions.options || options; //start object
    Sessions.sessions = Sessions.sessions || []; //start array

    var session = Sessions.getSession(SessionName);

    if (session == false) {
      //create new session
      //
      /*
      console.log('- Nome da sessão:', session.name);
      console.log('- State do sistema:', session.state);
      console.log('- Status da sessão:', session.status);
			*/
      //
      session = await Sessions.addSesssion(SessionName);
    } else if (["CLOSED"].includes(session.state)) {
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
      console.log('- Nome da sessão:', session.name);
      console.log('- State do sistema:', session.state);
      console.log('- Status da sessão:', session.status);
      //
      session.client = Sessions.initSession(SessionName);
      Sessions.setup(SessionName);
    } else {
      console.log('- Nome da sessão:', session.name);
      console.log('- State do sistema:', session.state);
      console.log('- Status da sessão:', session.status);
    }
    //
    await updateStateDb(session.state, session.status, SessionName);
    //
    return session;
  } //start
  //
  // ------------------------------------------------------------------------------------------------------- //
  //
  static async addSesssion(SessionName) {
    console.log("- Adicionando sessão");
    var newSession = {
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
    console.log("- Nova sessão: " + newSession.state);

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
    console.log("- Iniciando sessão");
    var session = Sessions.getSession(SessionName);
    session.browserSessionToken = null;
    //
    /*
      ╔═╗┌─┐┌┬┐┬┌─┐┌┐┌┌─┐┬    ╔═╗┬─┐┌─┐┌─┐┌┬┐┌─┐  ╔═╗┌─┐┬─┐┌─┐┌┬┐┌─┐┌┬┐┌─┐┬─┐┌─┐
      ║ ║├─┘ │ ││ ││││├─┤│    ║  ├┬┘├┤ ├─┤ │ ├┤   ╠═╝├─┤├┬┘├─┤│││├┤  │ ├┤ ├┬┘└─┐
      ╚═╝┴   ┴ ┴└─┘┘└┘┴ ┴┴─┘  ╚═╝┴└─└─┘┴ ┴ ┴ └─┘  ╩  ┴ ┴┴└─┴ ┴┴ ┴└─┘ ┴ └─┘┴└─└─┘
   */
    //
    const osnow = await osplatform();
    //
    if (osnow == 'linux' || osnow == 'Linux') {
      console.log("- Sistema operacional:", osnow);
      var folderToken = config.TOKENSPATCH_LINUX;
      session.tokenPatch = folderToken;
    } else if (osnow == 'win32' || osnow == 'win64' || osnow == 'Windows') {
      console.log("- Sistema operacional:", osnow);
      var folderToken = config.TOKENSPATCH_WIN;
      session.tokenPatch = folderToken;
    } else {
      var folderToken = './tokens';
      session.tokenPatch = folderToken;
    }
    //
    console.log("- Saudação:", await saudacao());
    //
    console.log('- Nome da sessão:', SessionName);
    //
    console.log('- Folder Token:', session.tokenPatch);
    //
    //-------------------------------------------------------------------------------------------------------------------------------------//
    const authJSON = JSON.parse(
      fs.readFileSync(`${session.tokenPatch}/${SessionName}.data.json`, {
        encoding: 'utf-8'
      }),
      BufferJSON.reviver
    );
    //
    const auth = {
      creds: authJSON.creds,
      // stores pre-keys, session & other keys in a JSON object
      // we deserialize it here
      keys: initInMemoryKeyStore(authJSON.keys)
    };
    //
    let sock = WASocket | undefined == undefined;
    // load authentication state from a file
    const loadState = () => {
      let state = AuthenticationState | undefined == undefined;
      try {
        const value = JSON.parse(
          readFileSync('./auth_info_multi.json', {
            encoding: 'utf-8'
          }),
          BufferJSON.reviver
        )
        state = {
          creds: value.creds,
          // stores pre-keys, session & other keys in a JSON object
          // we deserialize it here
          keys: initInMemoryKeyStore(value.keys)
        }
      } catch {}
      return state
    }
    // save the authentication state to a file
    const saveState = (state) => {
      console.log('saving pre-keys')
      state = state || sock.authState
      writeFileSync(
        './auth_info_multi.json',
        // BufferJSON replacer utility saves buffers nicely
        JSON.stringify(state, BufferJSON.replacer, 2)
      )
    }
    // start a connection
    const startSock = () => {
      const sock = makeWASocket({
        logger: P({
          level: 'trace'
        }),
        printQRInTerminal: true,
        auth: loadState()
      })
      sock.ev.on('messages.upsert', async m => {
        console.log(JSON.stringify(m, undefined, 2))

        const msg = m.messages[0]
        if (!msg.key.fromMe && m.type === 'notify') {
          console.log('replying to', m.messages[0].key.remoteJid)
          await sock.sendReadReceipt(msg.key.remoteJid, msg.key.participant, [msg.key.id])
          await sendMessageWTyping({
            text: 'Hello there!'
          }, msg.key.remoteJid)
        }

      })
      sock.ev.on('messages.update', m => console.log(m))
      sock.ev.on('presence.update', m => console.log(m))
      sock.ev.on('chats.update', m => console.log(m))
      sock.ev.on('contacts.update', m => console.log(m))
      return sock
    }

    const sendMessageWTyping = async (msg, jid) => {

      await sock.presenceSubscribe(jid)
      await delay(500)

      await sock.sendPresenceUpdate('composing', jid)
      await delay(2000)

      await sock.sendPresenceUpdate('paused', jid)

      await sock.sendMessage(jid, msg)
    }

    //
    const client = new makeWASocket({
      // can provide additional config here
      printQRInTerminal: true
    });
    //
    return client;
  } //initSession
  //
  // ------------------------------------------------------------------------------------------------//
  //
  /*
    ╔═╗┌─┐┌┬┐┌┬┐┬┌┐┌┌─┐  ┌─┐┌┬┐┌─┐┬─┐┌┬┐┌─┐┌┬┐
    ║ ╦├┤  │  │ │││││ ┬  └─┐ │ ├─┤├┬┘ │ ├┤  ││
    ╚═╝└─┘ ┴  ┴ ┴┘└┘└─┘  └─┘ ┴ ┴ ┴┴└─ ┴ └─┘─┴┘
  */
  //
  static async setup(SessionName) {
    console.log("- Sinstema iniciando");
    var session = Sessions.getSession(SessionName);
    await session.client.then(async (client) => {
      //
      console.log("- State setup:", client.state);
      //
      if (client.state == "open") {
        //
        session.state = "CONNECTED";
        session.status = 'isLogged';
        session.qrcodedata = null;
        session.message = 'Sistema iniciando e disponivel para uso';
        //
        await updateStateDb(session.state, session.status, SessionName);
        //
      } else if (client.state == "connecting") {
        //
        session.state = "STARTING";
        session.status = 'notLogged';
        session.qrcodedata = null;
        session.message = 'Sistema iniciando e indisponivel para uso';
        //
        await updateStateDb(session.state, session.status, SessionName);
        //
      } else if (client.state == "close") {
        //
        session.state = "CLOSED";
        session.status = 'CLOSED';
        session.client = false;
        session.qrcodedata = null;
        session.message = "Sessão fechada";
        //
        await updateStateDb(session.state, session.status, SessionName);
        //
      }
      // this will be called as soon as the credentials are updated
      client.on('open', async () => {
        // save credentials whenever updated
        console.log(`- Credentials updated setup!`)
        const authInfo = client.base64EncodedAuthInfo(); // get all the auth info we need to restore this session
        session.browserSessionToken = JSON.stringify(authInfo, null, '\t');
        fs.writeFileSync(`${session.tokenPatch}/${SessionName}.data.json`, JSON.stringify(authInfo, null, '\t')); // save this info to a file
        //
        session.state = "CONNECTED";
        session.status = 'isLogged';
        session.qrcodedata = null;
        session.message = 'Sistema iniciando e disponivel para uso';
        //
        await updateStateDb(session.state, session.status, SessionName);
        //
      });
      //
      // this will be called as soon as the credentials are updated
      client.on('connecting', async ({
        reason,
        isReconnecting
      }) => {
        // save credentials whenever updated
        console.log("- Connecting because " + reason + ", reconnecting: " + isReconnecting)
        //
        session.state = "CLOSED";
        session.status = 'CLOSED';
        session.client = false;
        session.qrcodedata = null;
        console.log("- Sessão fechada");
        //
      });
      //
      client.on("close", async ({
        reason,
        isReconnecting
      }) => {
        console.log("- Close because " + reason + ", reconnecting: " + isReconnecting);
        if (!isReconnecting && reason == "invalid_session") {
          if (fs.existsSync(`${session.tokenPatch}/${SessionName}.data.json`)) {
            fs.unlinkSync(`${session.tokenPatch}/${SessionName}.data.json`);
          }
          client.clearAuthInfo();
          //
          session.state = "DISCONNECTED";
          session.status = 'notLogged';
          session.client = false;
          session.qrcodedata = null;
          console.log("- Sessão fechada");
          //
        } else if (!isReconnecting && reason == "intentional") {
          //
          session.state = "CLOSED";
          session.status = 'CLOSED';
          session.qrcodedata = null;
          session.message = 'Sessão fechada';
          //
        } else if (!isReconnecting && reason == "replaced") {
          //
          session.state = "CLOSED";
          session.status = 'CLOSED';
          session.qrcodedata = null;
          session.message = 'Sessão fechada';
          //
          //await Sessions.Start(SessionName.trim());
          //
        } else {
          //
          session.state = "CLOSED";
          session.status = 'CLOSED';
          session.qrcodedata = null;
          session.message = 'Sessão fechada';
          //
        }
        //
        await deletaToken(session.tokenPatch + "/" + SessionName + ".data.json");
        //
        await updateStateDb(session.state, session.status, SessionName);
        //
      });
      //
      client.on('contacts-received', () => {
        console.log('- You have ' + Object.keys(client.contacts).length + ' contacts');
      });
      //
      /** when the connection to the phone changes */
      client.on('connection-phone-change', (state) => {
        console.log("- State:", state);
        //
        // { connected: false }
        if (state.connected) {
          //
          console.log("- Telefone conectado");
          //
        } else if (!state.connected) {
          //
          console.log("- Telefone desconectado");
          //
        }
        //
      });
      //
      client.on('chats-received', async ({
        hasNewChats
      }) => {
        console.log(`- You have ${client.chats.length} chats, new chats available: ${hasNewChats}`);
        const unread = await client.loadAllUnreadMessages()
        console.log("- You have " + unread.length + " unread messages")
      });
      //
      client.on('chats-received', ({
        hasNewChats
      }) => {
        console.log(`- You have ${client.chats.length} chats, new chats available: ${hasNewChats}`);
      });
      //
      client.on('contacts-received', () => {
        console.log(`- You have ${Object.keys(client.contacts).length} contacts`);
      });
      //
      client.on('initial-data-received', () => {
        console.log('- Received all initial messages');
      });
      //
      client.on('call', ({
        jid,
        id
      }) => {
        conn.rejectIncomingCall(id);
        conn.sendMessage(jid, 'Busy rn', 'conversation');
      });
      //
      client.on('blocklist-update', (json) => {
        console.log('- Update Blocklist');
        session.blocklist = JSON.stringify(json, null, 2);
      });
      //
      client.on('CB:Conn,pushname', (json) => {
        const pushname = json[1].pushname
        client.user.name = pushname // update on client too
        console.log("- Name updated: " + pushname);
      });
      //
      client.on(`CB:action,,battery`, (json) => {
        const batteryLevelStr = json[2][0][1].value
        const batterylevel = parseInt(batteryLevelStr);
        console.log("- Battery level: " + batterylevel + "%");
      });
      //
      client.on(`CB:Cmd,type:disconnect`, (json) => {

      });
      //
      client.on('CB:Blocklist', (json) => {
        console.log('- Blocklist');
        session.blocklist = JSON.stringify(json, null, 2);
      });
      //
    });
  } //setup
  //
  // ------------------------------------------------------------------------------------------------//
  //
  static async closeSession(SessionName) {
    console.log("- Fechando sessão");
    var session = Sessions.getSession(SessionName);
    var closeSession = await session.client.then(async client => {
      try {
        await client.close();
        //
        session.state = "CLOSED";
        session.status = 'CLOSED';
        session.client = false;
        session.qrcode = null;
        session.qrcodedata = null;
        console.log("- Sessão fechada");
        //
        var returnClosed = {
          result: "success",
          state: session.state,
          status: session.status,
          qrcode: session.qrcode,
          qrcodedata: session.qrcodedata,
          message: "Erro ao fechar sessão"
        };
        //
        await deletaToken(session.tokenPatch + "/" + SessionName + ".data.json");
        //
        await updateStateDb(session.state, session.status, SessionName);
        //
        return returnClosed;
        //
      } catch (error) {
        console.log("- Erro ao fechar sessão:", error.message);
        //
        return {
          result: "error",
          state: session.state,
          status: session.status,
          qrcode: session.qrcode,
          qrcodedata: session.qrcodedata,
          message: "Erro ao fechar sessão"
        };
        //
      }
    });
    //
    await deletaToken(session.tokenPatch + "/" + SessionName + ".data.json");
    //
    await updateStateDb(session.state, session.status, SessionName);
    //
    return closeSession;
  } //closeSession
  //
  // ------------------------------------------------------------------------------------------------//
  //
  static async logoutSession(SessionName) {
    console.log("- Fechando sessão");
    var session = Sessions.getSession(SessionName);
    var LogoutSession = await session.client.then(async client => {
      try {
        await client.logout();
        //
        const strClosed = await client.close();
        //
        session.state = "DISCONNECTED";
        session.status = 'CLOSED';
        session.client = false;
        session.qrcode = null;
        console.log("- Sessão desconetada");
        //
        var returnLogout = {
          result: "success",
          state: session.state,
          status: session.status,
          qrcode: session.qrcode,
          message: "Sessão desconetada"
        };
        //
        await deletaToken(session.tokenPatch + "/" + SessionName + ".data.json");
        //
        await updateStateDb(session.state, session.status, SessionName);
        //
        return returnLogout;
        //
      } catch (error) {
        console.log("- Erro ao desconetar sessão:", error.message);
        //
        return {
          result: "error",
          state: session.state,
          status: session.status,
          message: "Erro ao desconetar sessão"
        };
        //
      }
    });
    //
    await updateStateDb(session.state, session.status, SessionName);
    //
    return LogoutSession;
  } //LogoutSession
  //
  // ------------------------------------------------------------------------------------------------------- //
  //
  /*
  ╔╗ ┌─┐┌─┐┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐  ┬ ┬┌─┐┌─┐┌─┐┌─┐
  ╠╩╗├─┤└─┐││    ╠╣ │ │││││   │ ││ ││││└─┐  │ │└─┐├─┤│ ┬├┤ 
  ╚═╝┴ ┴└─┘┴└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘  └─┘└─┘┴ ┴└─┘└─┘
  */
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Enviar Contato
  static async sendContactVcard(
    SessionName,
    number,
    contact,
    namecontact
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
          "number": number,
          "canReceiveMessage": true,
          "text": "success",
          "message": "Contato enviado com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "number": number,
          "canReceiveMessage": false,
          "text": erro.text,
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
    SessionName,
    number,
    msg
  ) {
    console.log("- Enviando menssagem de texto.");
    var session = Sessions.getSession(SessionName);
    var sendResult = await session.client.then(async client => {
      // send a simple text!
      return await client.sendMessage(number, msg, MessageType.text).then((result) => {
        //console.log("Result: ", result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "group": number,
          "canReceiveMessage": true,
          "message": "Menssagem enviada com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error("Error when sending: ", erro); //return object error
        return {
          "erro": true,
          "status": 404,
          "group": number,
          "canReceiveMessage": false,
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
  //Enviar localização
  static async sendLocation(
    SessionName,
    number,
    lat,
    long,
    local
  ) {
    console.log("- Enviando localização.");
    var session = Sessions.getSession(SessionName);
    var sendResult = await session.client.then(async client => {
      // Send basic text
      return await client.sendMessage(number, {
        degreesLatitude: lat,
        degreesLongitude: long
      }, MessageType.location).then((result) => {
        //console.log("Result: ", result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "number": number,
          "canReceiveMessage": true,
          "text": "success",
          "message": "Localização enviada com sucesso."
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
          "number": number,
          "canReceiveMessage": false,
          "text": erro.text,
          "message": "Erro ao enviar localização."
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
    SessionName,
    number,
    link,
    caption
  ) {
    console.log("- Enviando link.");
    var session = Sessions.getSession(SessionName);
    var sendResult = await session.client.then(async client => {
      //
      const options = {
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
          "number": number,
          "canReceiveMessage": true,
          "text": "success",
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
          "number": number,
          "canReceiveMessage": false,
          "text": erro.text,
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
    SessionName,
    number,
    buffer,
    mimetype,
    filename,
    caption
  ) {
    console.log("- Enviando menssagem com imagem.");
    var session = Sessions.getSession(SessionName);
    var resultsendImage = await session.client.then(async (client) => {
      //
      const options = {
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
          "number": number,
          "canReceiveMessage": true,
          "text": "success",
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
          "number": number,
          "canReceiveMessage": false,
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
    filename,
    fileExtension,
    caption
  ) {
    console.log("- Enviando arquivo", fileExtension);
    var session = Sessions.getSession(SessionName);
    var resultsendImage = await session.client.then(async (client) => {
      //
      const options = {
        mimetype: mimetype,
        filename: filename,
        caption: caption
      };
      //
      return await client.sendMessage(number, buffer, MessageType.document, options).then((result) => {
        //console.log('Result: ', result); //return object success
        //return (result);
        //
        return {
          "erro": false,
          "status": 200,
          "number": number,
          "canReceiveMessage": true,
          "text": "success",
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
          "number": number,
          "canReceiveMessage": false,
          "text": erro.text,
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
  ╦═╗┌─┐┌┬┐┬─┐┬┌─┐┬  ┬┬┌┐┌┌─┐  ╔╦╗┌─┐┌┬┐┌─┐                
  ╠╦╝├┤  │ ├┬┘│├┤ └┐┌┘│││││ ┬   ║║├─┤ │ ├─┤                
  ╩╚═└─┘ ┴ ┴└─┴└─┘ └┘ ┴┘└┘└─┘  ═╩╝┴ ┴ ┴ ┴ ┴                
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
            "user": resultAllContacts.jid,
            "name": resultAllContacts.name,
            "shortName": resultAllContacts.short,
            "pushname": resultAllContacts.notify,
            "formattedName": resultAllContacts.vname,
            "isMyContact": resultAllContacts.verify,
            "isWAContact": '',
            "isBusiness": ''
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
          "canReceiveMessage": false,
          "text": "Error",
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
          else MessagePresence = 'Não foi possível carregar as mensagens anteriores';
          let PPIMAGE = null;
          try {
            PPIMAGE = await client.getProfilePicture(`${phonePP}@c.us`);
          } catch (e) {
            PPIMAGE = 'https://upload.wikimedia.org/wikipedia/en/e/ee/Unknown-person.gif';
          }
          
          chatArray = [...chatArray, {
            chatId: id,
            time: newDate,
            phone: allChats[i].jid.replace('@s.whatsapp.net', ''),
            title: Name,
            image: PPIMAGE,
            lastchat: MessagePresence
          }]
					
          //
          chatArray.push({
            "user": allChats[i].jid.replace('@s.whatsapp.net', ''),
            "name": Name,
            "formattedName": Name
          });
          //
        }
        return chatArray;
        //
      } catch (erro) {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "canReceiveMessage": false,
          "text": "Error",
          "message": "Erro ao recuperar grupos"
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
          //else MessagePresence = 'Não foi possível carregar as mensagens anteriores'
          let PPIMAGE = null;
          try {
            PPIMAGE = await client.getProfilePicture(`${phonePP}@c.us`);
          } catch (e) {
            PPIMAGE = 'https://upload.wikimedia.org/wikipedia/en/e/ee/Unknown-person.gif';
          }
          if (allChats[i].jid.includes('@g.us')) {
            /*
            chatArray = [
              ...chatArray,
              {
                chatId: id,
                time: newDate,
                phone: allChats[i].jid.replace('@s.whatsapp.net', ''),
                title: Name,
                image: PPIMAGE,
              },
            ]
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
          "canReceiveMessage": false,
          "text": "Error",
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
          "canReceiveMessage": false,
          "text": "Error",
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
          "canReceiveMessage": false,
          "text": "Error",
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
    SessionName,
    number
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
          "canReceiveMessage": false,
          "text": "Error",
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
    SessionName,
    number
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
          "canReceiveMessage": false,
          "text": "Error",
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
    SessionName,
    number
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
          "canReceiveMessage": false,
          "text": "Error",
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
  // Verificar o status do número
  static async checkNumberStatus(
    SessionName,
    number
  ) {
    console.log("- canReceiveMessage");
    var session = Sessions.getSession(SessionName);
    var resultcheckNumberStatus = await session.client.then(async client => {
      //
      return await client.isOnWhatsApp(number).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        if (result.exists) {
          //
          return {
            "erro": false,
            "status": 200,
            "canReceiveMessage": true,
            "number": result.jid.replace('@s.whatsapp.net', ''),
            "message": "O número informado pode receber mensagens via whatsapp"
          };
          //
        } else if (!result) {
          //
          return {
            "erro": true,
            "status": 404,
            "canReceiveMessage": false,
            "number": result.jid,
            "message": "O número informado não pode receber mensagens via whatsapp"
          };
          //
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "canReceiveMessage": null,
            "number": number,
            "message": "Erro ao verificar número informado"
          };
          //
        }
      }).catch((erro) => {
        //console.error('Error when sending:\n', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "canReceiveMessage": null,
          "number": number,
          "message": "Erro ao verificar número informado"
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
  ╔═╗┬─┐┌─┐┬ ┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐               
  ║ ╦├┬┘│ ││ │├─┘  ╠╣ │ │││││   │ ││ ││││└─┐               
  ╚═╝┴└─└─┘└─┘┴    ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘               
  */
  //
  // Deixar o grupo
  static async leaveGroup(
    SessionName,
    groupId
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
            "canReceiveMessage": true,
            "groupId": groupId,
            "message": "Grupo deixado com sucesso"
          };
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "canReceiveMessage": false,
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
          "canReceiveMessage": false,
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
    SessionName,
    groupId
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
          "canReceiveMessage": false,
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
    SessionName,
    groupId
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
          "canReceiveMessage": false,
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
    SessionName,
    groupId
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
          "canReceiveMessage": false,
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
  // Criar grupo (título, participantes a adicionar)
  static async createGroup(
    SessionName,
    title,
    contactlistValid,
    contactlistInvalid
  ) {
    console.log("- createGroup");
    var session = Sessions.getSession(SessionName);
    var resultgetGroupInviteLink = await session.client.then(async client => {
      return await client.groupCreate(title, contactlistValid).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        if (result.status == 200 || result.status == 207) {
          return {
            "erro": false,
            "status": 200,
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
  // Remove participante
  static async removeParticipant(
    SessionName,
    groupId,
    phonefull
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
    SessionName,
    groupId,
    phonefull
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
    SessionName,
    groupId,
    contactlistValid
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
    SessionName,
    groupId,
    phonefull
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
  // Retorna o status do grupo, jid, descrição do link de convite
  static async getGroupInfoFromInviteLink(
    SessionName,
    InviteCode
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
  // Junte-se a um grupo usando o código de convite do grupo
  static async joinGroup(
    SessionName,
    InviteCode
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
  /*
  ╔═╗┬─┐┌─┐┌─┐┬┬  ┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐           
  ╠═╝├┬┘│ │├┤ ││  ├┤   ╠╣ │ │││││   │ ││ ││││└─┐           
  ╩  ┴└─└─┘└  ┴┴─┘└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘           
  */
  //
  // Set client status
  static async setProfileStatus(
    SessionName,
    ProfileStatus
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
    SessionName,
    ProfileName
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
    SessionName,
    path
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
  ╔╦╗┌─┐┬  ┬┬┌─┐┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐             
   ║║├┤ └┐┌┘││  ├┤   ╠╣ │ │││││   │ ││ ││││└─┐             
  ═╩╝└─┘ └┘ ┴└─┘└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘             
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
          "message": "Serviço parado com sucesso.",
          "killService": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao parar serviço."
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
          "message": "Serviço reiniciado com sucesso.",
          "restartService": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao reiniciar serviço."
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
          "message": "Erro ao obter o estado da conexão"
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
  // Obter versão do WhatsappWeb
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
          "message": "Versão do WhatsappWeb obtido com sucesso",
          "WAVersion": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao obter versão do WhatsappWeb"
        };
        //
      });
    });
    return resultgetWAVersion;
  } //getWAVersion
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Inicia a verificação de conexão do telefone
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
          "message": "Verificação de conexão do telefone iniciada com sucesso",
          "PhoneWatchdog": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao inicia a verificação de conexão do telefone"
        };
        //
      });
    });
    return resultgetWAVersion;
  } //startPhoneWatchdog
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Para a verificação de conexão do telefone
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
          "message": "Verificação de conexão parada iniciada com sucesso",
          "PhoneWatchdog": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao parar a verificação de conexão do telefone"
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
  ╔╦╗┌─┐┌─┐┌┬┐┌─┐┌─┐  ┌┬┐┌─┐  ╦═╗┌─┐┌┬┐┌─┐┌─┐
   ║ ├┤ └─┐ │ ├┤ └─┐   ││├┤   ╠╦╝│ │ │ ├─┤└─┐
   ╩ └─┘└─┘ ┴ └─┘└─┘  ─┴┘└─┘  ╩╚═└─┘ ┴ ┴ ┴└─┘
   */
  //
  // ------------------------------------------------------------------------------------------------//
  //
  static async RotaTeste() {
    //console.log('Result: ', result); //return object success
    //
    var result = {
      '556792664545@s.whatsapp.net': {
        jid: '556792664545@s.whatsapp.net',
        name: 'Rafa Hotel Porta',
        short: 'Rafa Hotel Porta'
      },
      '556484338175@s.whatsapp.net': {
        jid: '556484338175@s.whatsapp.net',
        vname: 'Wender Teixeira',
        verify: '0'
      }
    };
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
        "isMyContact": resultAllContacts.verify,
        "isWAContact": '',
        "isBusiness": ''
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