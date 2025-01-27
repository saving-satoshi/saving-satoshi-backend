# Use Alpine as base image
FROM alpine:latest

# Install necessary packages
RUN apk add --no-cache g++ make linux-headers git autoconf automake libtool

WORKDIR /usr/app

# Clone the Crypto++ library
RUN git clone https://github.com/weidai11/cryptopp.git

# Build and install the Crypto++ library
WORKDIR /usr/app/cryptopp
RUN make && make install

CMD ["./main"]