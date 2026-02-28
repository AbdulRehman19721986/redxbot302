FROM golang:1.24-alpine AS builder

RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o whatsapp-bot main.go

FROM alpine:latest

RUN apk add --no-cache ca-certificates tzdata ffmpeg

WORKDIR /app

COPY --from=builder /app/whatsapp-bot .
COPY --from=builder /app/storages ./storages

EXPOSE 3000

CMD ["./whatsapp-bot"]
