// commands/url.js
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const os = require("os");
const path = require("path");
const fakevCard = require('../lib/fakevcard');

module.exports = {
  pattern: "url3",
  desc: "Convert media to Catbox URL",
  react: "🖇",
  category: "utility",
  filename: __filename,
  use: ".url [reply to media or send media with caption]",

  execute: async (conn, message, m, { from }) => {
    const sendMessageWithContext = async (text, quoted = message) => {
      return conn.sendMessage(
        from,
        {
          text,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363405513439052@newsletter",
              newsletterName: "★彡[REDXBOT302]彡★",
              serverMessageId: 200,
            },
          },
        },
        { quoted: fakevCard }
      );
    };

    try {
      // 1) Use replied message if exists, otherwise current message
      const quotedMsg =
        message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const target = quotedMsg || message.message;

      if (!target) {
        return await sendMessageWithContext(
          "❌ Please reply to an audio, video, image, or document with `.url`"
        );
      }

      // 2) Detect media type & node
      let mediaNode = null;
      let mediaType = null;
      if (target.imageMessage) {
        mediaNode = target.imageMessage;
        mediaType = "image";
      } else if (target.videoMessage) {
        mediaNode = target.videoMessage;
        mediaType = "video";
      } else if (target.audioMessage) {
        mediaNode = target.audioMessage;
        mediaType = "audio";
      } else if (target.documentMessage) {
        mediaNode = target.documentMessage;
        mediaType = "document";
      } else {
        return await sendMessageWithContext(
          "❌ Please reply to an audio, video, image, or document with `.url`"
        );
      }

      // 3) React
      if (module.exports.react) {
        try {
          await conn.sendMessage(from, {
            react: { text: module.exports.react, key: message.key },
          });
        } catch {}
      }

      // 4) Download media
      let buffer;
      try {
        const stream = await downloadContentFromMessage(mediaNode, mediaType);
        let _buf = Buffer.from([]);
        for await (const chunk of stream) {
          _buf = Buffer.concat([_buf, chunk]);
        }
        buffer = _buf;
      } catch (e) {
        console.error("Download error:", e);
        return await sendMessageWithContext(
          "❌ Failed to download media. Try replying to a valid file."
        );
      }

      if (!buffer || buffer.length === 0) {
        return await sendMessageWithContext(
          "❌ Downloaded media is empty or too large."
        );
      }

      // 5) Extension
      let extension = "";
      if (mediaType === "image") extension = ".jpg";
      else if (mediaType === "video") extension = ".mp4";
      else if (mediaType === "audio") extension = ".mp3";
      else if (mediaType === "document") {
        const fileName = mediaNode.fileName || "";
        extension = path.extname(fileName) || ".bin";
      }

      const tempFilePath = path.join(
        os.tmpdir(),
        `catbox_upload_${Date.now()}${extension}`
      );
      fs.writeFileSync(tempFilePath, buffer);

      // 6) Upload to Catbox
      const form = new FormData();
      form.append("fileToUpload", fs.createReadStream(tempFilePath));
      form.append("reqtype", "fileupload");

      const uploadResponse = await axios.post(
        "https://catbox.moe/user/api.php",
        form,
        {
          headers: form.getHeaders(),
          timeout: 30000,
        }
      );

      if (!uploadResponse.data)
        throw new Error("Error uploading to Catbox");
      const uploadedUrl = uploadResponse.data;

      // cleanup
      try {
        fs.unlinkSync(tempFilePath);
      } catch {}

      // 7) Reply with result
      await sendMessageWithContext(
        `*${mediaType.toUpperCase()} Uploaded Successfully*\n\n` +
          `*sɪᴢᴇ:* ${formatBytes(buffer.length)}\n` +
          `*ᴜʀʟ:* ${uploadedUrl}\n\n` +
          `> © ᴜᴘʟᴏᴀᴅᴇᴅ ʙʏ REDXBOT302-ʟɪᴛᴇ 💙`
      );
    } catch (err) {
      console.error("URL execution error:", err);
      await sendMessageWithContext(
        `⚠️ Error: ${err.message || "Failed to process media"}`
      );
    }
  },
};

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
}
