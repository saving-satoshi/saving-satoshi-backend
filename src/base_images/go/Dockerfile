FROM golang:1.19.9-bullseye

WORKDIR /usr/app

# RUN go mod download

COPY *.mod ./
COPY *.go ./

RUN CGO_ENABLED=0 GOOS=linux go build -o /app

CMD ["/app"]