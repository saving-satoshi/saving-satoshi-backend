FROM python:3.13.0a2-slim-bullseye
WORKDIR /usr/app

ENV PIP_DISABLE_PIP_VERSION_CHECK 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update
RUN pip install --upgrade pip

RUN pip install savingsatoshi_secp256k1py savingsatoshi_bech32py ecdsa

COPY ./ /usr/app

CMD python main.py
