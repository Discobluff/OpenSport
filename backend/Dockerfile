# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY backend/ ./backend/

# Build the application
RUN go build -o opensport backend/cmd/main.go

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates
WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/opensport .

# Expose port
EXPOSE 8080

# Run the application
CMD ["./opensport"]