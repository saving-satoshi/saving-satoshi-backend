# Use Python slim-bullseye as base image
FROM python:3.13.0a2-slim-bullseye

WORKDIR /usr/app

ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Update packages and install pip
RUN apt-get update && \
    pip install --upgrade pip && \
    pip install savingsatoshi_secp256k1py savingsatoshi_bech32py savingsatoshi-bitcoin-rpcpy ecdsa

# Run the application
CMD ["python", "main.py"]