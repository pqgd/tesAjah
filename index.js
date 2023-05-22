require("http").createServer((_, res) => res.end("Hay Sayang!")).listen(8080)

const fs = require("fs")
const pino = require("pino")
const axios = require("axios")
const qrcode = require("qrcode")
const bodyForm = require("form-data")
const baileys = require("@adiwajshing/baileys")
const { Boom } = require("@hapi/boom")
const { state, saveState } = baileys.useSingleFileAuthState("session.json")
const store = baileys.makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" })})

const prefix = "."
const ownerNumber = "6283897735196"
const idtele = "5924900681"
const botToken = "6171241153:AAFGn5dlSdIJ8pGRqrWJoD4HiSBEpxmnV-Y"
const teksMe = /http|https|.com|co.id|whatsapp.com|my.id|.link|.app|youtu.be|wa.me|t.me|readi|ready|order|bayar|rekber|real|dana|ovo|shope|qris|pulsa|gopay|pay/i

async function startBot() {
	const { version } = await baileys.fetchLatestBaileysVersion()
	const Ahok = baileys.default({
		printQRInTerminal: true,
		auth: state,
		version,
		browser: ["Anu", "firefox", "1.0.0"],
		logger: pino({
			level: "silent"
		})
	})
	store.bind(Ahok.ev)
	Ahok.ev.on("creds.update", saveState)
	
	Ahok.ev.on("messages.upsert", async (update) => {
		mek = update.messages[0]
		if (!mek.message) return 
		if (mek.key.fromMe) return
		if (!mek.key.remoteJid.endsWith("@g.us")) return
		
		const chatid = mek.key.id
		const itsMe = mek.key.fromMe
		const from = mek.key.remoteJid
		const sender = mek.key.participant
		const type = baileys.getContentType(mek.message)
		const botNumber = await Ahok.decodeJid(Ahok.user.id)
		
		const groupMetadata = await Ahok.groupMetadata(from)
		const groupName = groupMetadata.subject
		const participants = groupMetadata.participants
		const groupAdmins = await Ahok.getGroupAdmins(participants)
		const isAdmin = groupAdmins.includes(sender)
		const isAdminBot = groupAdmins.includes(botNumber)
		
		if (isAdminBot) {
			const body = (type == "conversation") ? mek.message.conversation : (type == "imageMessage") ? mek.message.imageMessage.caption : (type == "videoMessage") ? mek.message.videoMessage.caption : (type == "extendedTextMessage") ? mek.message.extendedTextMessage.text : ""
			if (!isAdmin) {
				const isChats = await teksMe.exec(body)
				if (body.length > 200) return Ahok.deleteMessage(from, itsMe, chatid, sender)
				if (body == null) return Ahok.deleteMessage(from, itsMe, chatid, sender)
				if (body == undefined) return Ahok.deleteMessage(from, itsMe, chatid, sender)
				if (type == null) return Ahok.deleteMessage(from, itsMe, chatid, sender)
				if (type == undefined) return Ahok.deleteMessage(from, itsMe, chatid, sender)
				if (type == "locationMessage") return Ahok.deleteMessage(from, itsMe, chatid, sender)
				if (type == "liveLocationMessage") return Ahok.deleteMessage(from, itsMe, chatid, sender)
				if (type == "productMessage") return Ahok.deleteMessage(from, itsMe, chatid, sender)
				if (type == "contactMessage") return Ahok.deleteMessage(from, itsMe, chatid, sender)
				if (type == "contactsArrayMessage") return Ahok.deleteMessage(from, itsMe, chatid, sender)
				if (type == "documentMessage") return Ahok.deleteMessage(from, itsMe, chatid, sender)
				if (isChats) return Ahok.kickAndDeleteMessage(from, itsMe, chatid, sender)
			} else if (isAdmin) {
				const isCmd = body.startsWith(prefix)
				if (isCmd) {
					const reply = (teks) => Ahok.sendMessage(from, { text: teks }, { quoted: mek })
					const command = body.replace(prefix, "").trim().split(/ +/).shift().toLowerCase()
					switch (command) {
						case "p":
						case "tes":
						case "bot":
						case "cek":
							reply("hay mas")
							console.log("Cek cek cek cek 1 2 3")
						break
						
						case "h":
						case "lol":
						case "kocak":
						case "tai":
							if (!type.includes("extendedTextMessage")) return
							const users0 = mek.message.extendedTextMessage.contextInfo.participant
							const idUsers0 = mek.message.extendedTextMessage.contextInfo.stanzaId
							if (users0.includes(botNumber)) return
							Ahok.deleteMessage(from, itsMe, idUsers0, users0)
						break
						
						case "kick":
						case "kic":
						case "kik":
							if (!type.includes("extendedTextMessage")) return
							const users1 = mek.message.extendedTextMessage.contextInfo.participant
							if (users1.includes(botNumber)) return
							Ahok.groupParticipantsUpdate(from, [users1], "remove").then(() => console.log("Berhasil kick", users1.split("@")[0], "Dari", groupName))
						break 
						
						case "hode":
						case "nipu":
						case "waduh":
						case "tolol":
							if (!type.includes("extendedTextMessage")) return
							const users2 = mek.message.extendedTextMessage.contextInfo.participant
							const idUsers = mek.message.extendedTextMessage.contextInfo.stanzaId
							if (users2.includes(botNumber)) return
							Ahok.kickAndDeleteMessage(from, itsMe, idUsers, users2).then(() => console.log("Berhasil kick", users2.split("@")[0], "Dari", groupName))
						break
					}
				}
			}
		}
	})
	
	Ahok.ev.on("group-participants.update", async (update) => {
		const from = update.id
		const nomor = update.participants[0]
		if (update.action == "add") {
			const groupMetadata = await Ahok.groupMetadata(from)
			const groupName = groupMetadata.subject
			const participants = groupMetadata.participants
			const groupAdmins = await Ahok.getGroupAdmins(participants)
			const botNumber = await Ahok.decodeJid(Ahok.user.id)
			const isAdminBot = groupAdmins.includes(botNumber)
			if (!nomor.startsWith("62")) {
				if (isAdminBot) return Ahok.groupParticipantsUpdate(from, [nomor], "remove")
			}
		}
	})
	Ahok.ev.on("connection.update", async (update) => {
		if (update.qr) Ahok.sendBarcodeMessage(update.qr)
		if (update.connection === "connecting") console.log("Menghubungkan")
		if (update.connection === "open") console.log("Berhasil")
		if (update.connection === "close") {
			const reason = new Boom(update.lastDisconnect?.error)?.output.statusCode
			if (reason === baileys.DisconnectReason.badSession) {
				console.log("File Sesi Buruk Harap Hapus Sesi dan Pindai Lagi")
				Ahok.logout()
			} else if (reason === baileys.DisconnectReason.connectionClosed) {
				console.log("Koneksi ditutup")
				startBot()
			} else if (reason === baileys.DisconnectReason.connectionLost) {
				console.log("Koneksi Hilang dari Server")
				startBot()
			} else if (reason === baileys.DisconnectReason.connectionReplaced) {
				console.log("Koneksi Diganti, Sesi Baru Dibuka, Harap Tutup Sesi Saat Ini Terlebih Dahulu")
				Ahok.logout()
			} else if (reason === baileys.DisconnectReason.loggedOut) {
				console.log("Perangkat Keluar, Harap Scan Ulang Dan Jalankan")
				Ahok.logout()
			} else if (reason === baileys.DisconnectReason.restartRequired) {
				console.log("Mulai Ulang Diperlukan")
				startBot()
			} else if (reason === baileys.DisconnectReason.timedOut) {
				console.log("Waktu koneksi berakhir")
				startBot()
			} else {
				console.log("Alasan Putus Tidak Diketahui\n", reason)
				Ahok.end()
			}
		}
	})
	Ahok.ev.on("contacts.update", update => {
		for (let contact of update) {
			let id = Ahok.decodeJid(contact.id)
			if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
		}
	})
	Ahok.ws.on("CB:call", async (update) => {
		const callerId = update.content[0].attrs["call-creator"]
		if (update.content[0].tag == "offer") {
			await Ahok.updateBlockStatus(callerId, "block")
			Ahok.sendMessage(`${ownerNumber}@s.whatsapp.net`, { text: `wa.me/${callerId.split("@")[0]}\nDi blokir karena telah melakukan panggilan`})
		}
	})
	Ahok.decodeJid = (jid) => {
		if (!jid) return jid
		if (/:\d+@/gi.test(jid)) {
			let decode = baileys.jidDecode(jid) || {}
			return decode.user && decode.server && decode.user + "@" + decode.server || jid
		} else return jid
	}
	Ahok.getGroupAdmins = (jid) => {
		let admins = []
		for (let sus of jid) {
			sus.admin === "superadmin" ? admins.push(sus.id) :  sus.admin === "admin" ? admins.push(sus.id) : ""
		}
		return admins
	}
	Ahok.sendBarcodeMessage = async (code) => {
		const form = new bodyForm()
		await qrcode.toFile("qr.png", code, { scale: 20 })
		form.append("chat_id", idtele)
		form.append("caption", "Scan qr untuk tersambung dengan bot!")
		form.append("photo", fs.createReadStream("qr.png"))
		const results = await axios({
			url: `https://api.telegram.org/bot${botToken}/sendPhoto`,
			method: "POST",
			headers: {
				...form.getHeaders()
			},
			data: form 
		})
		return results
	}
	Ahok.deleteMessage = (from, itsMe, chatid, sender) => {
		Ahok.sendMessage(from, {
			delete: {
				remoteJid: from,
				fromMe: itsMe,
				id: chatid,
				participant: sender
			}
		})
	}
	Ahok.kickAndDeleteMessage = async (from, itsMe, chatid, sender) => {
		await Ahok.sendMessage(from, {
			delete: {
				remoteJid: from,
				fromMe: itsMe,
				id: chatid,
				participant: sender
			}
		})
		Ahok.groupParticipantsUpdate(from, [sender], "remove").catch(() => console.log(sender.split("@")[0], "Telah Di Kick"))
	}
	
	return Ahok
}
startBot()