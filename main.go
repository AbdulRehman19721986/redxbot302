package main

import (
    "context"
    "fmt"
    "log"
    "os"
    "os/signal"
    "strings"
    "syscall"
    "time"

    "github.com/aldinokemal/go-whatsapp-web-multidevice/device"
    "github.com/aldinokemal/go-whatsapp-web-multidevice/handler"
    whatsapp "github.com/aldinokemal/go-whatsapp-web-multidevice/whatsapp"
)

func main() {
    // 1. Initialize device manager – this handles multiple sessions
    deviceManager := device.NewManager("storages/devices")

    // 2. Define the device ID for your bot
    deviceID := "main-bot"
    if !deviceManager.Exists(deviceID) {
        deviceManager.Create(deviceID)
    }

    // 3. Create WhatsApp client with auto‑reconnect
    client, err := whatsapp.NewClient(
        deviceID,
        whatsapp.WithAutoReconnect(true),
        whatsapp.WithMaxReconnectAttempts(10),
        whatsapp.WithReconnectInterval(5*time.Second),
    )
    if err != nil {
        log.Fatalf("Failed to create client: %v", err)
    }

    // 4. Set up message handler
    client.AddMessageHandler(func(msg *whatsapp.Message) {
        handleMessage(client, msg)
    })

    // 5. Connect – this will prompt for a QR code the first time
    if err := client.Connect(); err != nil {
        log.Fatalf("Failed to connect: %v", err)
    }
    log.Println("✅ Bot connected")

    // 6. Wait for interrupt signal (Ctrl+C)
    c := make(chan os.Signal, 1)
    signal.Notify(c, os.Interrupt, syscall.SIGTERM)
    <-c

    // 7. Graceful shutdown
    client.Disconnect()
    log.Println("Bot disconnected")
}

func handleMessage(client *whatsapp.Client, msg *whatsapp.Message) {
    // Skip own messages
    if msg.Info.FromMe {
        return
    }

    // Extract text from various message types
    var text string
    if msg.Message.Conversation != nil {
        text = *msg.Message.Conversation
    } else if msg.Message.ExtendedTextMessage != nil {
        text = *msg.Message.ExtendedTextMessage.Text
    } else {
        return
    }

    // Check for command prefix (.)
    if !strings.HasPrefix(text, ".") {
        return
    }

    // Split command and arguments
    parts := strings.Fields(text[1:])
    if len(parts) == 0 {
        return
    }
    cmd := parts[0]
    args := parts[1:]

    switch cmd {
    case "ping":
        client.SendMessage(msg.Info.Chat, "🏓 Pong!")

    case "menu":
        menu := "╭┈───〔 *GO-BOT* 〕┈───⊷\n"
        menu += "├▢ 🤖 Device: main-bot\n"
        menu += "├▢ 📊 Commands: ping, menu, sticker, tts\n"
        menu += "╰───────────────────⊷\n"
        menu += "• .ping - Check response\n"
        menu += "• .menu - Show this menu\n"
        menu += "• .sticker - Create sticker (reply to image/video)\n"
        menu += "• .tts <text> - Text to speech\n"
        client.SendMessage(msg.Info.Chat, menu)

    case "sticker":
        if msg.HasMedia() {
            // Sticker creation would go here – you may need to add this functionality
            client.ReplyMessage(msg, "🔄 Sticker creation coming soon...")
        } else {
            client.ReplyMessage(msg, "❌ Reply to an image or video")
        }

    case "tts":
        if len(args) > 0 {
            text := strings.Join(args, " ")
            // TTS logic – you can integrate a service later
            client.ReplyMessage(msg, fmt.Sprintf("🔊 TTS: %s", text))
        } else {
            client.ReplyMessage(msg, "❌ Provide text, e.g. .tts Hello")
        }
    }
}
