FROM alpine:latest

WORKDIR /usr/src/app

# Copy the script
COPY cryptopp.sh .

# Make the script executable and run it
RUN chmod +x cryptopp.sh && ./cryptopp.sh

# Copy your application files
COPY . .

# Build your application
RUN g++ -o main main.cpp -lcryptopp

CMD ["./main"]