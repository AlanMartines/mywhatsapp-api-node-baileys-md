import makeWASocket, {
  AuthenticationState,
  BufferJSON, DisconnectReason,
  initInMemoryKeyStore,
  WASocket,
  delay,
  AnyMessageContent,
  MiscMessageGenerationOptions,
  downloadContentFromMessage,
  proto,
} from '@adiwajshing/baileys-md';
import { Boom } from '@hapi/boom';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

export enum TypesMessage {
  CONVERSATION = 'conversation',
  DOCUMENT_MESSAGE = 'documentMessage',
  IMAGE_MESSAGE = 'imageMessage',
  AUDIO_MESSAGE = 'audioMessage',
  STICKER_MESSAGE = 'stickerMessage',
  INVOICE_MESSAGE = 'invoiceMessage',
  EXTENDED_TEXT_MESSAGE = 'extendedTextMessage',
  SENDER_KEY_DISTRIBUTION_MESSAGE = 'senderKeyDistributionMessage'
}

function saveSession(socket: WASocket, session: any) {
  const infoSession = session || socket.authState;

  writeFileSync(
    './auth_info_multi.json',
    JSON.stringify(infoSession, BufferJSON.replacer, 2),
  );
}

function loadSession(): AuthenticationState | null {
  try {
    const credentials = readFileSync('./auth_info_multi.json', { encoding: 'utf-8' });
    const value = JSON.parse(credentials, BufferJSON.reviver);

    return {
      creds: value.creds,
      keys: initInMemoryKeyStore(value.keys),
    };
  } catch {
    console.log('Erro ao carregar credenciais');
  }
  return null;
}

async function sendMessageWithTyping(
  socket: WASocket,
  remoteJid: string,
  message: AnyMessageContent,
  options: MiscMessageGenerationOptions,
) {
  await socket.presenceSubscribe(remoteJid);
  await delay(500);

  await socket.sendPresenceUpdate('composing', remoteJid);
  await delay(2000);

  await socket.sendPresenceUpdate('paused', remoteJid);

  await socket.sendMessage(remoteJid, message, options);
}

async function testeCases(socket: WASocket, messageRaw: proto.IWebMessageInfo) {
  // console.log('Message raw: ', messageRaw);

  if (messageRaw.message) {
    const { fromMe, remoteJid } = messageRaw.key;
    const messageType = Object.keys(messageRaw.message)[0];
    const text = messageRaw.message.conversation;

    console.log();
    console.log();
    console.log('Message type: ', messageType);

    switch (messageType) {
      case TypesMessage.CONVERSATION:
        console.log('Mensagem: ', messageRaw);

        if (!fromMe && text === 'ping') {
          sendMessageWithTyping(socket, remoteJid, { text: 'pong' }, {
            quoted: messageRaw,
          });
        }
        break;
      case TypesMessage.EXTENDED_TEXT_MESSAGE:
        console.log('Mensagem extended: ', messageRaw);
        break;
      case TypesMessage.SENDER_KEY_DISTRIBUTION_MESSAGE:
        console.log('Mensagem key distribution:', messageRaw);
        break;
      case TypesMessage.STICKER_MESSAGE:
        console.log('Mensagem sticker:', messageRaw);
        break;
      case TypesMessage.IMAGE_MESSAGE:
        console.log('Mensagem imagem: ', messageRaw);
        if (!fromMe && messageType === 'imageMessage') {
          const stream = await downloadContentFromMessage(
            messageRaw.message.imageMessage, 'image',
          );

          let buffer = Buffer.from([]);
          // eslint-disable-next-line no-restricted-syntax
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }
          const path = `./downloads/image_${new Date().getTime()}.jpeg`;

          writeFileSync(path, buffer);
        }
        break;
      default:
        console.log('Tipo não tratado');
        break;
    }
  }
}

async function startSocket() {
  const socket = makeWASocket({
    printQRInTerminal: true,
    auth: loadSession(),
  });

  socket.ev.on('presence.update', (presences) => {
    console.log('Presence: ', presences);
  });

  socket.ev.on('groups.update', (group) => {
    // Teste 1 - Alterei o nome do grupo e caiu aqui, onde o subject é o novo nome
    console.log('Grupo update: ', group);
  });

  socket.ev.on('group-participants.update', (group) => {
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
        console.log('Ação não tratada');
        break;
    }
  });

  socket.ev.on('messages.upsert', async ({ messages }) => {
    const message = messages[0];
    testeCases(socket, message);
  });

  socket.ev.on('auth-state.update', () => saveSession(socket));

  socket.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    console.log();
    console.log();
    console.log('Connection: ', connection);

    if (connection === 'close') {
      const statusError = (lastDisconnect.error as Boom).output.statusCode;
      const statusErrorLogout = DisconnectReason.loggedOut;
      const errorIsNotLogout = statusError !== statusErrorLogout;

      if (errorIsNotLogout) {
        startSocket();
      } else {
        const path = join(__dirname, '../', 'auth_info_multi.json');
        unlinkSync(path);
        console.log('Connection closed');
        process.exit();
      }
    }
    console.log('Connection update', update);
  });

  console.log(socket)
  return socket;
}

startSocket();