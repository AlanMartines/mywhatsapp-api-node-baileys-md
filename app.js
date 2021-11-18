/*
 * Olá Caro kibador, esta base está sob lisença MIT, Caso deseje roubar/tirar os créditos você pode ser Processado!
 * Siga as normas da Lisença MIT, Abraços Criador!
 *
 * Segundo o site: http://escolhaumalicenca.com.br/licencas/mit/
 * Não é permitido a retirada de aviso de licença... Abraços!
 *
 * ViniciusBOT Baileys MD
 */

const {
  MessageType,
  WAMessage,
  ReconnectMode,
  WAProto,
  MediaType
} = require('@adiwajshing/baileys-md')
var pino = require("pino");
var baileys = require("@adiwajshing/baileys-md");
const axios = require('axios').default
const fs = require('fs')
const moment = require('moment-timezone')
const chalk = require('chalk')

const color1 = (texto, cor) => {
  return !color ? chalk.magenta(texto) : chalk.keyword(cor)(texto)
}
const color = (texto, cor) => {
  return !color ? chalk.cyan(texto) : chalk.keyword(cor)(texto)
}
const getGroupAdmins = (participantes) => {
  var admins = []
  for (let i of participantes) {
    i.admin === "admin" ? admins.push(i.id) : ''
  }
  return admins
}



(async () => {
  prefix = [
    '!'
  ]
  var client = undefined;
  var loadState = () => {
    var state = undefined;
    try {
      var sessão = JSON.parse(fs.readFileSync('./session.json', {
        encoding: 'utf-8'
      }), baileys.BufferJSON.reviver);
      state = {
        creds: sessão.creds,
        keys: baileys.initInMemoryKeyStore(sessão.keys)
      };
    } catch (error) {}
    return state;
  };
  // salvar os dados da sessão
  const saveState = (state) => {
    //console.log('saving pre-keys')
    state = state || client.authState
    fs.writeFileSync(
      './session.json',
      JSON.stringify(state, baileys.BufferJSON.replacer, 2)
    );
  }

  var startSock = () => {
    const client = baileys["default"]({
      printQRInTerminal: true,
      browser: ['ViniciusBOT MD Session', "Safari", "3.0"],
      logger: pino({
        level: 'warn'
      }),
      auth: loadState()
    });

    client.ev.on('chats.delete', async e => {
      console.log(e)
    });

    client.ev.on('messages.upsert', async m => {
      var authInfo = client.authState
      fs.writeFileSync('./session.json', JSON.stringify(authInfo, baileys.BufferJSON.replacer, 2))
      try {
        msgfull = m
        const msg = m.messages[0]
        if (!msg.message) return
        msg.message = (Object.keys(msg.message)[0] === 'ephemeralMessage') ? msg.message.ephemeralMessage.message : msg.message
        if (!msg.message) return
        if (msg.key && msg.key.remoteJid == 'status@broadcast') return
        if (msg.key.fromMe) return

        const from = msg.key.remoteJid
        const type = Object.keys(msg.message)[0]
        const time = moment.tz('America/Sao_Paulo').format('HH:mm:ss')

        var body = (type === 'conversation') ? msg.message.conversation : (type == 'imageMessage') ?
          msg.message.imageMessage.caption : (type == 'videoMessage') ?
          msg.message.videoMessage.caption : (type == 'extendedTextMessage') ?
          msg.message.extendedTextMessage.text : (type == 'buttonsResponseMessage') ?
          msg.message.buttonsResponseMessage.selectedButtonId : (type == 'listResponseMessage') ?
          msg.message.listResponseMessage.singleSelectReply.selectedRowId : ''

        const isMedia = type.includes('videoMessage') || type.includes('imageMessage') || type.includes('stickerMessage') || type.includes('audioMessage') || type.includes('documentMessage')

        const isCmd = prefix.includes(body != '' && body.slice(0, 1)) && body.slice(1) != ''
        const comando = isCmd ? body.slice(1).trim().split(' ')[0].toLowerCase() : ''
        const args = body.trim().split(/ +/).slice(1)
        const isGroup = from.endsWith('@g.us')
        const author = isGroup ? msg.key.participant : msg.key.remoteJid
        const pushname = msg.pushName || "Sem Nome"

        const groupMetadata = isGroup ? await client.groupMetadata(from) : ''
        const groupName = isGroup ? groupMetadata.subject : ''
        const groupMembers = isGroup ? groupMetadata.participants : ''
        const groupAdmins = isGroup ? getGroupAdmins(groupMembers) : ''

        const isGroupAdmins = groupAdmins.includes(author) || false
        const isBotAdmin = () => {
          a1 = isGroup ? getGroupAdmins(groupMembers) : ''
          poisitonAdmin = false
          Object.keys(a1).forEach((a) => {
            if (banTemp[a].id === botNumber) {
              poisitonAdmin = a
            }
            if (posiçaode4 !== null) {
              bb = a1[poisitonAdmin].admin
              if (bb === 'admin') {
                return true
              } else {
                return false
              }
            }
          });
        }

        /**
         * 
         * @param {String} mensagem Palavra
         */
        const reply = (mensagem) => {
          client.sendMessage(from, {
            text: mensagem
          }, {
            quoted: msg
          });
        }
        /**
         * @param {Buffer} img Buffer da imagem
         * @param {String} mensagem Palavra
         */
        const sendImage = (img, mensagem) => {
          client.sendMessage(from, {
            image: img,
            caption: mensagem,
            jpegThumbnail: img
          }, {
            quoted: msg
          });
        }

        if (!isGroup && isCmd) console.log(color('COMANDO RECEBIDO'), color(time, 'yellow'), color1(comando), 'DE', color1(pushname))
        if (isCmd && isGroup) console.log(color('COMANDO RECEBIDO'), color(time, 'yellow'), color1(comando), 'DE', color1(pushname), 'EM', color(groupName))

        if (isCmd) {
          switch (comando) {
            case 'msg':
              client.sendMessage(from, {
                text: JSON.stringify(msg, null, '\t'),
                quoted: msg
              }, {
                quoted: msg
              })
              break
            case 'sendtext':
              reply(`Text Here`)
              break
            case 'sendimage':
              /*
               * client.sendMessage(from, {image: Buffer})
               */
              break
          }
        }

      } catch (err) {
        console.log(err)
      }
    });

    client.ev.on('group-participants.update', async (update) => {
      //var authInfo = client.authState
      //fs.writeFileSync('./session.json', JSON.stringify(authInfo, baileys.BufferJSON.replacer, 2))
      try {
        console.log(update)
      } catch (error) {
        console.log(error)
      }
    });

    client.ev.on('chats.update', async (update) => {
      var authInfo = client.authState
      fs.writeFileSync('./session.json', JSON.stringify(authInfo, baileys.BufferJSON.replacer, 2))
      console.log(update)
    })
    return client
  }

  client = startSock();
  client.ev.on('connection.update', (update) => {
    const {
      connection,
      lastDisconnect
    } = update
    if (connection === 'close') {
      // reconnect if not logged out
      lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut ?
        await startSock() :
        console.log('connection closed')
    }
    console.log('Connection Update: ', update)
  });
  // auto save dos dados da sessão
  client.ev.on('auth-state.update', () => saveState())
})()