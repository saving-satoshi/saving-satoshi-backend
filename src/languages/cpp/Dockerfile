FROM gcc:13.1.0

WORKDIR /usr/app

# Copy the script
COPY cryptopp.sh .

# Make the script executable and run it
RUN chmod +x cryptopp.sh && ./cryptopp.sh

# Copy your application files
COPY . /usr/app

# Build your application
RUN g++ -o main main.cpp -lcryptopp

CMD ["./main"]