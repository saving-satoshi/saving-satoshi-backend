# Use cpp-base image
FROM cpp-base:latest

WORKDIR /usr/app

# Copy application files
COPY . /usr/app

# Build application
RUN g++ -o main main.cpp -lcryptopp

CMD ["./main"]