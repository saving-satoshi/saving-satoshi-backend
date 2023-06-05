FROM python:3.10.2-slim-bullseye
WORKDIR /usr/app

ENV PIP_DISABLE_PIP_VERSION_CHECK 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update
RUN pip install --upgrade pip

COPY ./ /usr/app

CMD python main.py
CMD echo "hello world"
