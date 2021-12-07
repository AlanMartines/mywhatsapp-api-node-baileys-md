FROM node:14.17.6

LABEL version="1.0.0" description="API" maintainer="Alan Martines<alan.martines@produzirsa.com.br>"

RUN   sudo apt-get update && \
	apt-get upgrade -y && \
	apt-get install -y \
	git \
	curl \
	yarn \
	gcc \
	g++ \
	make \
	libgbm-dev \
	wget \
	unzip \
	fontconfig \
	locales \
	gconf-service \
	libasound2 \
	libatk1.0-0 \
	libc6 \
	libcairo2 \
	libcups2 \
	libdbus-1-3 \
	libexpat1 \
	libfontconfig1 \
	libgconf-2-4 \
	libgdk-pixbuf2.0-0 \
	libglib2.0-0 \
	libgtk-3-0 \
	libnspr4 \
	libpango-1.0-0 \
	libpangocairo-1.0-0 \
	libstdc++6 \
	libx11-6 \
	libx11-xcb1 \
	libxcb1 \
	libxcomposite1 \
	libxcursor1 \
	libxdamage1 \
	libxext6 \
	libxfixes3 \
	libxi6 \
	libxrandr2 \
	libxrender1 \
	libxss1 \
	libxtst6 \
	ca-certificates \
	fonts-liberation \
	libnss3 \
	lsb-release \
	xdg-utils \
	ca-certificates \
	fonts-liberation \
	libasound2 \
	libatk-bridge2.0-0 \
	libatk1.0-0 \
	libc6 \
	libcairo2 \
	libcups2 \
	libdbus-1-3 \
	libexpat1 \
	libfontconfig1 \
	libgbm1 \
	libgcc1 \
	libglib2.0-0 \
	libgtk-3-0 \
	libnspr4 \
	libnss3 \
	libpango-1.0-0 \
	libpangocairo-1.0-0 \
	libstdc++6 \
	libx11-6 \
	libx11-xcb1 \
	libxcb1 \
	libxcomposite1 \
	libxcursor1 \
	libxdamage1 \
	libxext6 \
	libxfixes3 \
	libxi6 \
	libxrandr2 \
	libxrender1 \
	libxss1 \
	libxtst6 \
	lsb-release \
	libu2f-udev \
	wget \
	xdg-utils \
	ffmpeg imagemagick \
	ghostscript

# Ir para seu diretório home
RUN mkdir /home/ApiBaileysMd

# Clone este repositório
RUN  git clone https://github.com/AlanMartines/mywhatsapp-api-node-baileys-md.git ApiBaileysMd

# Acesse a pasta do projeto no terminal/cmd
RUN  cd /home/ApiBaileysMd &&  \
	npm install --allow-root --unsafe-perm=true

# Clone este repositório
RUN  cd /home/ApiBaileysMd &&  \
	git clone -b multi-device https://github.com/AlanMartines/Baileys.git

# Acesse a pasta do projeto no terminal/cmd
RUN  cd /home/ApiBaileysMd/Baileys && \
	npm install --allow-root --unsafe-perm=true && \
	npm run build:all

# Acesse a pasta do projeto no terminal/cmd
COPY .env  /home/ApiBaileysMd

# Building WPPConnect
RUN  mkdir /usr/local/tokens

#Set working directory
WORKDIR /home/ApiBaileysMd

EXPOSE 9003

CMD [ "node", "--trace-warnings", "server.js" ]

### LEIA-ME ###
## Processando o arquivo Dockerfile
# docker build -t alanmartines/nodejs-mywhats-api:1.0 .

## Criar um contêiner
# docker container run --name mywhats-api -p 9000:9000 -d alanmartines/nodejs-mywhats-api:1.0

## Acessar bash do container
# docker exec -it <container id> /bin/sh
# docker exec -it <container id> /bin/bash

## Removendo todos os containers e imagens de uma só vez
# docker rm $(docker ps -qa)

## Removendo todas as imagens de uma só vez
# docker rmi $(docker images -aq)

## Removendo imagens
# docker rmi <REPOSITORY>
# docker rmi <IMAGE ID>

## Como obter o endereço IP de um contêiner Docker do host
# https://stack.desenvolvedor.expert/appendix/docker/rede.html
# docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <IMAGE ID>