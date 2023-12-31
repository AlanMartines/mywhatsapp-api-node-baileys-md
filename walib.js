"use strict";
const { Boom } = require("@hapi/boom");
const NodeCache = require("node-cache");
const {
	makeWASocket,
	makeInMemoryStore,
	useMultiFileAuthState,
	fetchLatestBaileysVersion,
	makeCacheableSignalKeyStore,
	DisconnectReason,
	jidDecode,
	delay,
	proto
} = require("@whiskeysockets/baileys");
const moment = require("moment");
const fs = require("fs");

const timer = moment(new Date()).format("HH:mm:ss DD/MM/YYYY");

const logger = require("pino")({
	timestamp: () => `,"time":"${new Date().toJSON()}"`
}).child({});
logger.level = "silent";

const useStore = !process.argv.includes("--no-store");
const usePairingCode = process.argv.includes("--use-pairing-code");

const msgRetryCounterCache = new NodeCache();

const rl = require("readline").createInterface({
	input: process.stdin,
	output: process.stdout
});

const question = text => new Promise(resolve => rl.question(text, resolve));

const store = useStore ? makeInMemoryStore({ logger }) : undefined;

store?.readFromFile("./store_multi.json");
// 10detik
setInterval(() => {
	store?.writeToFile("./store_multi.json");
}, 10000);

function uncache(module = ".") {
	return new Promise(function (resolve, reject) {
		try {
			delete require.cache[require.resolve(module)];
			resolve();
		} catch (error) {
			reject(error);
		}
	});
}

function nocache(module, cb = function () { }) {
	console.log(`module ${module} memantau perubahan data.\n`);
	fs.watchFile(require.resolve(module), async function () {
		await uncache(require.resolve(module));
		cb(module);
	});
}

async function connectoWhatsapps() {
	const { state, saveCreds } = await useMultiFileAuthState("@OpenWA");
	const { version, isLatest } = await fetchLatestBaileysVersion();

	const sock = makeWASocket({
		version,
		logger,
		printQRInTerminal: !usePairingCode,
		browser: ["Safari (Linux)", "browser", "1.0.0"],
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger)
		},
		msgRetryCounterCache,
		generateHighQualityLinkPreview: true,
		patchMessageBeforeSending,
		getMessage
	});

	store?.bind(sock.ev);

	require("./index");
	nocache("./index", function (module) {
		console.log(
			`\n[ WHATSAPPS BOT ] ${timer} ${module} telah di update!...`
		);
	});

	sock.ev.on("chats.set", function () {
		console.log("got chats", store.chats.all());
	});

	sock.ev.on("contacts.set", function () {
		console.log("got contacts", Object.values(store.contacts));
	});

	if (usePairingCode && !sock.authState.creds.registered) {
		const phoneNumber = await question(
			"Masukkan nomor telepon seluler anda: +"
		);
		if (/\d/.test(phoneNumber)) {
			const code = await sock.requestPairingCode(
				phoneNumber.replace(/[^0-9]/g, "")
			);
			console.log(
				"jika ada notif whatsapp [Memasukkan kode menautkan perangkat baru] maka sudah di pastikan berhasil!"
			);
			console.log(`pairing code: ${code.match(/.{1,4}/g).join("-")}`);
		} else {
			console.log("Nomor telepon tidak valid.");
			process.exit();
		}
	}

	const sendMessageWTyping = async (msg, jid) => {
		await sock.presenceSubscribe(jid);
		await delay(500);
		await sock.sendPresenceUpdate("composing", jid);
		await delay(2000);
		await sock.sendPresenceUpdate("paused", jid);
		await sock.sendMessage(jid, msg);
	};

	sock.ev.on("connection.update", function ({ connection, lastDisconnect }) {
		switch (connection) {
			case "close":
				switch (new Boom(lastDisconnect?.error)?.output?.statusCode) {
					case DisconnectReason.badSession:
						console.log(`Bad Session File, hapus session dan scan scan lagi.`);
						process.exit();
						break;
					case DisconnectReason.connectionClosed:
						console.log(`Connection closed, menyambungkan kembali...`);
						connectoWhatsapps();
						break;
					case DisconnectReason.connectionLost:
						console.log(`Connection Lost from Server, menyambungkan kembali...`);
						connectoWhatsapps();
						break;
					case DisconnectReason.connectionReplaced:
						console.log(`Connection Replaced, sesi baru lainnya dibuka dan terhubung kembali...`);
						connectoWhatsapps();
						break;
					case DisconnectReason.loggedOut:
						console.log(`Device Logged Out, scan ulang lagi.`);
						process.exit();
						break;
					case DisconnectReason.restartRequired:
						console.log(`Restart Required, memulai ulang...`);
						connectoWhatsapps();
						break;
					case DisconnectReason.timedOut:
						console.log(`Connection TimedOut, menyambungkan kembali...`);
						connectoWhatsapps();
						break;
					case DisconnectReason.Multidevicemismatch:
						console.log(`Multi device mismatch, scan ulang lagi...`);
						process.exit();
						break;
					default:
						console.log(``);
				}
				break;
			case "connecting":
				console.log(`using WA v${version.join(".")}, isLatest ${isLatest}`);
				break;
			case "open":
				console.log(" nama :", sock.user.name);
				console.log(" nomor:", sock.user.id.split(":")[0]);
				rl.close();
				break;
			default:
		}
	});

	sock.ev.on("creds.update", function () {
		saveCreds();
	});

	sock.ev.on("messages.upsert", function ({ messages, type }) {
		console.log("recv messages ", JSON.stringify(messages, undefined, 2));
	});

	sock.decodeJid = function (jid) {
		if (!jid) return jid;
		if (/:\d+@/gi.test(jid)) {
			const decode = jidDecode(jid) || {};
			return (
				(decode.user &&
					decode.server &&
					decode.user + "@" + decode.server) ||
				jid
			);
		}
	};

	sock.ev.on("contacts.update", function (update) {
		for (const contact of update) {
			const id = sock.decodeJid(contact.id);
			if (store && store.contacts)
				store.contacts[id] = {
					id,
					name: contact.notify
				};
		}
	});

	sock.ev.on(
		"group-participants.update",
		function ({ id, participants, action }) { }
	);

	sock.reply = async function (from, content, message) {
		await sock.sendMessage(from, { text: content }, { quoted: message });
	};

	return sock;

	function patchMessageBeforeSending(message) {
		const requiresPatch = !!(
			message.buttonsMessage ||
			message.templateMessage ||
			message.listMessage
		);
		if (requiresPatch) {
			message = {
				viewOnceMessage: {
					message: {
						messageContextInfo: {
							deviceListMetadataVersion: 2,
							deviceListMetadata: {}
						},
						...message
					}
				}
			};
		}
		return message;
	}

	async function getMessage(key) {
		if (store) {
			const msg = await store.loadMessage(key.remoteJid, key.id);
			return msg?.message || undefined;
		}
		// only if store is present
		return proto.Message.fromObject({});
	}
}

connectoWhatsapps();