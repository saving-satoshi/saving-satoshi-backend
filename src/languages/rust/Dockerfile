FROM rust:1.69-slim-bullseye as builder

COPY . .

RUN cargo build

CMD ["./target/debug/rust"]
