// nwaypanel-bot.js
const {
  default: makeWASocket,
  useSingleFileAuthState,
} = require('@adiwajshing/baileys');
const fs = require('fs');
const { state, saveState } = useSingleFileAuthState('./session.json');

let pendingForm = {};
const dbFile = './database.json';

// === FUNGSI BANTU ===
function loadDatabase() {
  if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(dbFile));
}

function saveDatabase(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

// === GREETING OTOMATIS SESUAI JAM ===
function getGreeting(name = '') {
  const hour = new Date().getHours();
  let greeting = '';
  if (hour >= 5 && hour < 11) greeting = '⛅ Selamat Pagi';
  else if (hour >= 11 && hour < 15) greeting = '🌤️ Selamat Siang';
  else if (hour >= 15 && hour < 18) greeting = '🌇 Selamat Sore';
  else greeting = '🌙 Selamat Malam';
  return name ? `${greeting}, ${name}!` : `${greeting}!`;
}

// === MULAI BOT ===
async function startBot() {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on('messages.upsert', async (msg) => {
    const m = msg.messages[0];
    if (!m.message || m.key.fromMe) return;

    const from = m.key.remoteJid;
    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      m.message?.buttonsResponseMessage?.selectedButtonId ||
      m.message?.listResponseMessage?.singleSelectReply?.selectedRowId;

    console.log('Pesan dari', from, ':', text);

    // === JIKA USER SEDANG ISI FORM ===
    if (pendingForm[from]) {
      const step = pendingForm[from].step;
      if (step === 1) {
        pendingForm[from].gmail = text;
        pendingForm[from].step = 2;
        await sock.sendMessage(from, { text: '👤 Masukkan *Nama* kamu:' });
      } else if (step === 2) {
        pendingForm[from].nama = text;
        pendingForm[from].step = 3;
        await sock.sendMessage(from, {
          text: `💰 Masukkan *Harga* paket (${pendingForm[from].paket}):`,
        });
      } else if (step === 3) {
        pendingForm[from].harga = text;
        const data = pendingForm[from];
        delete pendingForm[from];

        // Simpan ke database.json
        const db = loadDatabase();
        db.push({
          id: from,
          gmail: data.gmail,
          nama: data.nama,
          paket: data.paket,
          harga: data.harga,
          waktu: new Date().toLocaleString(),
        });
        saveDatabase(db);

        await sock.sendMessage(from, {
          text: `🎉 Terima kasih sudah bergabung, *${data.nama}*!\nSelamat datang di 🚀 *NWAY PANEL HOSTING*!\n\n✅ *Pendaftaran Berhasil!*\n\n📧 Gmail: ${data.gmail}\n👤 Nama: ${data.nama}\n💎 Paket: ${data.paket}\n💰 Harga: ${data.harga}\n🕒 Tanggal: ${new Date().toLocaleString()}\n\nSilakan kirim bukti pembayaran untuk melanjutkan transaksi.`,
        });
      }
      return;
    }

    // === MENU UTAMA ===
    if (text === 'menu') {
      const bannerPath = './nway.jpg';
      const buttons = [
        { buttonId: 'beli', buttonText: { displayText: '🛒 Beli Panel' }, type: 1 },
        { buttonId: 'saldo', buttonText: { displayText: '💰 Cek Saldo' }, type: 1 },
        { buttonId: 'logout', buttonText: { displayText: '🚪 Logout' }, type: 1 },
      ];

      const db = loadDatabase();
      const user = db.find((u) => u.id === from);
      const userName = user ? user.nama : 'Pengguna';

      const message = {
        image: { url: bannerPath },
        caption: `${getGreeting(userName)}\n\n👤 *${userName}*\n📧 ${
          user ? user.gmail : 'Belum terdaftar'
        }\n💎 2 GB CPU\n⚙️ 40% Power\n\n💰 10K / 1B\n\nPilih menu di bawah ini:`,
        footer: '🚀 NWAY PANEL HOSTING',
        buttons,
        headerType: 4,
      };
      await sock.sendMessage(from, message);
    }

    // === BELI PANEL ===
    else if (text === 'beli') {
      const listMessage = {
        title: '💎 Daftar Paket Panel',
        text: 'Pilih paket yang ingin kamu beli:',
        footer: '🚀 NWAY PANEL STORE',
        buttonText: 'Pilih Paket 💫',
        sections: [
          {
            title: '🧠 Paket CPU List',
            rows: [
              { title: '💎 2 GB CPU - 10K / 1B', rowId: 'buy_2GB' },
              { title: '⚡ 4 GB CPU - 20K / 1B', rowId: 'buy_4GB' },
              { title: '🔥 6 GB CPU - 30K / 1B', rowId: 'buy_6GB' },
              { title: '💥 8 GB CPU - 40K / 1B', rowId: 'buy_8GB' },
              { title: '🌈 10 GB CPU - 50K / 1B', rowId: 'buy_10GB' },
              { title: '🚀 12 GB CPU - 60K / 1B', rowId: 'buy_12GB' },
              { title: '💫 14 GB CPU - 70K / 1B', rowId: 'buy_14GB' },
              { title: '🌋 16 GB CPU - 80K / 1B', rowId: 'buy_16GB' },
              { title: '🎇 17 GB CPU - 90K / 1B', rowId: 'buy_17GB' },
              { title: '🌍 18 GB CPU - 100K / 1B', rowId: 'buy_18GB' },
            ],
          },
        ],
      };
      await sock.sendMessage(from, { listMessage });
    }

    // === CEK SALDO ===
    else if (text === 'saldo') {
      await sock.sendMessage(from, {
        text: '💰 *Saldo kamu saat ini:* Rp50.000\n\nKetik *menu* untuk kembali.',
      });
    }

    // === LOGOUT ===
    else if (text === 'logout') {
      await sock.sendMessage(from, {
        text: '🚪 Kamu telah logout.\nKetik *menu* untuk login kembali.',
      });
    }

    // === PILIHAN BELI ===
    else if (text?.startsWith('buy_')) {
      const paket = text.replace('buy_', '').toUpperCase();
      await sock.sendMessage(from, {
        text: `🧾 Kamu memilih *${paket} CPU*\n\nSebelum lanjut, isi data berikut:\n\n📧 Masukkan *Gmail* kamu:`,
      });
      pendingForm[from] = { step: 1, paket };
    }
  });

  sock.ev.on('creds.update', saveState);
}

startBot();
