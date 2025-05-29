<p align="center">
  <img src="./public/imagens/whatsapp-bot.png" width="150" alt="My Whats">
</p>

# API - My WhatsApp

Este projeto usa como base o [Baileys](https://github.com/WhiskeysSockets/Baileys "Baileys"), um navegador virtual sem interface gráfica que abre o whatsapp web e executa todos os comandos via código possibilitando assim a automação de todas as funções.

![](https://img.shields.io/github/stars/AlanMartines/mywhatsapp-api-node-baileys-md.svg) ![](https://img.shields.io/github/tag/AlanMartines/mywhatsapp-api-node-baileys-md.svg) ![](https://img.shields.io/github/v/release/AlanMartines/mywhatsapp-api-node-baileys-md.svg) ![](https://img.shields.io/github/issues/AlanMartines/mywhatsapp-api-node-baileys-md.svg) ![](https://img.shields.io/badge/express-v4.17.2-green.svg) ![](https://img.shields.io/badge/node-v14.0-green.svg) ![](https://img.shields.io/badge/npm-v8.3.2-green.svg) ![](https://img.shields.io/github/license/AlanMartines/mywhatsapp-api-node-baileys-md) ![](https://img.shields.io/github/downloads/AlanMartines/mywhatsapp-api-node-baileys-md/total) ![](https://img.shields.io/github/forks/AlanMartines/mywhatsapp-api-node-baileys-md)

## Nota

Esta Api, segue os mesmos termos de serviço do WhatsApp. É importante que você leia atentamente a estes termos. Você é responsável pelo uso da ferramenta e pelas conseqüências do mau uso. Reforçamos que a API não é destinada para prática de SPAM e que o envio de mensagens indesejadas, viola os termos de serviço do WhatsApp. A violação dos termos pode acarretar no bloqueio e banimento definitivo de sua conta no WhatsApp.

#### Dependências Debian (e.g. Ubuntu) 64bits

```bash
sudo apt update && \
apt upgrade -y && \
apt install -y \
git \
curl \
yarn \
gcc \
g++ \
make \
libgbm-dev \
wget \
unzip \
ffmpeg \
imagemagick \
unoconv \
sox \
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
libatk-bridge2.0-0 \
libgbm1 \
libgcc1 \
build-essential \
nodejs \
libappindicator1 \
openjdk-11-jdk
```

#### Dependências CentOS 7/8 64bits (Validar)

```bash
sudo yum install -y \
ffmpeg \
sox \
alsa-lib.x86_64 \
atk.x86_64 \
cups-libs.x86_64 \
gtk3.x86_64 \
ipa-gothic-fonts \
libXcomposite.x86_64 \
libXcursor.x86_64 \
libXdamage.x86_64 \
libXext.x86_64 \
libXi.x86_64 \
libXrandr.x86_64 \
libXScrnSaver.x86_64 \
libXtst.x86_64 \
pango.x86_64 \
xorg-x11-fonts-100dpi \
xorg-x11-fonts-75dpi \
xorg-x11-fonts-cyrillic \
xorg-x11-fonts-misc \
xorg-x11-fonts-Type1 \
xorg-x11-utils \
java-11-openjdk
```

#### Dependências Alpine 64bits (Validar)

```bash
# replacing default repositories with edge ones
echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" > /etc/apk/repositories && \
echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories && \
echo "http://dl-cdn.alpinelinux.org/alpine/v3.9/main" >> /etc/apk/repositories && \
echo "http://dl-cdn.alpinelinux.org/alpine/v3.9/community" >> /etc/apk/repositories && \
apk update && \
apk upgrade && \
apk add --update --no-cache dumb-init curl make gcc g++ linux-headers binutils-gold gnupg \
libstdc++ nss chromium chromium-chromedriver git vim curl yarn nodejs nodejs-npm npm python \
python3 dpkg wget \
ffmpeg sox
```

#### Instale o NodeJs Debian (e.g. Ubuntu)

###### Instalar

```bash
# Ir para seu diretório home
cd ~

# Recuperar o script de instalação para sua versão de preferência
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Instalar o pacote Node.js
source ~/.profile
nvm ls-remote
nvm install --lts
```

#### Instale o NodeJs CentOS 7/8 64bits

###### Instalar

```bash
# Ir para seu diretório home
cd ~

# Recuperar o script de instalação para sua versão de preferência
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Instalar o pacote Node.js
source ~/.profile
nvm ls-remote
nvm install --lts
```

#### Instale o NodeJs Alpine 64bits

###### Instalar

```bash
# Ir para seu diretório home
cd ~

# Instalar o pacote Node.js
apk add --update nodejs nodejs-npm
```

## Rodando a aplicação

```bash
# Ir para seu diretório home
cd ~

# Clone este repositório
git clone https://github.com/AlanMartines/mywhatsapp-api-node-baileys-md.git ApiBaileysMd

# Acesse a pasta do projeto no terminal/cmd
cd ApiBaileysMd

# Instale as dependências
env NODE_OPTIONS=" --dns-result-order=ipv4first "
npm install --allow-root --unsafe-perm=true

# Configuração inicial
cp .env-example .env

# Execute a aplicação
node server.js

# Manter os processos ativos a cada reinicialização do servidor
npm install pm2 -g

pm2 start server.js --name ApiBaileysMd --watch

pm2 startup

pm2 save

# Para remover do init script
pm2 unstartup systemd

# O servidor iniciará na porta:9001

# Pronto, escaneie o código QR-Code do Whatsapp e aproveite!
```

## Gerar SECRET_KEY para uso local de validação

```bash
node -e "console.log(require('crypto').randomBytes(45).toString('base64').slice(0, 60));"
```

## Criar pasta tokens (Linux)

```bash
#Criar pasta para os tokens
mkdir /usr/local/tokens

#Setar permição na pasta tokens
chmod -R 775 /usr/local/tokens
```

## Configuração inicial do arquivo ".env-example"

```sh
NODE_EN=production
#
# Defina o IPV4 aqui caso voce utilize uma VPS deve ser colocado o IP da VPS
# Exemplos:
# IPV4=204.202.54.2 => IP da VPS, caso esteja usando virtualização via hospedagem
# IPV4=10.0.0.10 => IP da VM, caso esteja usando virtualização
# IPV4=127.0.0.1 => caso esteja usando na sua proprima maquina local
# IPV4=0.0.0.0 => caso esteja usando em um cotainer
IPV4=127.0.0.1
#
# Defina o IPV6 aqui caso voce utilize uma VPS deve ser colocado o IP da VPS
# CASO UTILIZE IPV6, DEVE PREENCHER A VARIAVEL IPV6
# CASO DE NÃO SER CONFIGURADO IPV6 MATENHA A VARIAVEL IPV6 VAZIA
# Exemplos:
# IPV6=FEDC:2D9D:DC28:7654:3210:FC57:D4C8:1FFF => IP da VPS, caso esteja usando virtualização via hospedagem
# IPV6=2001:0DB8:85A3:08D3:1319:8A2E:0370:7344 => IP da VM, caso esteja usando virtualização
# IPV6=0:0:0:0:0:0:0:1 => caso esteja usando na sua proprima maquina local
# IPV6=0:0:0:0:0:0:0:0 => caso esteja usando em um cotainer
IPV6=
#
# Defina o numero da porta a ser usada pela API.
PORT=9009
#
# CASO UTILIZE CERTIFICADO SSL COM REDIRECIONAMENTO DE PORTA, DEVE PREENCHER A VARIAVEL DOMAIN_SSL
# CASO DE NÃO SER CONFIGURADO UM DOMÍNIO MATENHA A VARIAVEL DOMAIN_SSL VAZIA
# Exemplos:
# DOMAIN_SSL=api.meudomai.com.br ou meudomai.com.br
# DOMAIN_SSL=
DOMAIN_SSL=
#
# Define se o qrcode vai ser mostrado no terminal
VIEW_QRCODE_TERMINAL=0
#
# Define a pasta para os tokens
PATCH_TOKENS=/usr/local/tokens
#
# Device name
DEVICE_NAME='My-Whatsapp'
#
# Host name
HOST_NAME='ApiBaileysMd'
#
# Defina a versão do whatsapp a ser usada.
# CASO DE NÃO SER CONFIGURADO UM VERSÂO MATENHA A VARIAVEL WA_VERSION VAZIA
# Exemplos:
# WA_VERSION='2.2204.13'
# WA_VERSION=
#
WA_VERSION=
#
# Defina a url do whatsapp a ser usada.
# CASO DE NÃO SER CONFIGURADO UM LINK MATENHA A VARIAVEL WA_URL VAZIA
# Exemplos:
# WA_URL='web.whatsapp.com'
# WA_URL=
WA_URL=
#
# Auto close
AUTO_CLOSE=15
#
# Chave de segurança para validação
SECRET_KEY='kgashjgajbug$$jgbbjgkbkgk'
#
# Defina se vai ser usando um bando de dados ou não.
# CASO DE NÃO SER CONFIGURADO A VARIAVEL VALIDATE_MYSQL DEVE SER 0
VALIDATE_MYSQL=1
#
# Defina a quantidade de processo simultaneo na fila.
CONCURRENCY=5
#
# Defina qual bando de dados usado, mysql ou mariabd usado para uso no docker
MYSQL_ENGINE=mysql
#
# Defina qual versão do bando de dados usado para uso no docker
MYSQL_VERSION=latest
#
# O host do banco. Ex: localhost
MYSQL_HOST=localhost
#
# Port do banco. Ex: 3306
MYSQL_PORT=3306
#
# Um usuário do banco. Ex: user
MYSQL_USER=mywhatsappapi
#
# A senha do usuário do banco. Ex: user123
MYSQL_PASSWORD='senha123'
#
# A base de dados a qual a p-queue irá se conectar. Ex: node_mysql
MYSQL_DATABASE=node_mysql
#
# Time Zone
MYSQL_TIMEZONE='-04:00'
#
# Time Zone
TZ='America/Sao_Paulo'
#
# Gag image
TAG=1.0.0
#
# browserWSEndpoint Ex.: ws://127.0.0.1:3000
BROWSER_WSENDPOINT=
#
# Caso queira que ao iniciar a API todas as sessões salvas sejam inicializadas automaticamente
START_ALL_SESSIONS=1
#
# Deleta os arquivos não usados do Baileys
DELETE_FILE_UNUSED=0
#
# Host do servidor do Graylog
GRAYLOGSERVER=127.0.0.1
#
# Porta do servidor do  Graylog
GRAYLOGPORT=12201
#
# Defina se vai ser usado em um container.
# CASO DE SER USADO CONFIGURE A VARIAVEL INDOCKER DEVE SER 1
# CASO DE NÃO SER CONFIGURADO A VARIAVEL INDOCKER DEVE SER 0
INDOCKER=0
#
```

## Create MySQL DATABASE/TABLE

```sql
-- Copiando estrutura do banco de dados para mywhatsapp-api
CREATE DATABASE IF NOT EXISTS `mywhatsapp-api` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `mywhatsapp-api`;

-- Copiando estrutura para tabela mywhatsapp-api.sessionwa
CREATE TABLE IF NOT EXISTS `sessionwa` (
  `ID` int unsigned NOT NULL AUTO_INCREMENT,
  `authorizationtoken` char(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `sessionname` char(255) COLLATE utf8mb4_general_ci NOT NULL,
  `state` char(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT 'DISCONNECTED',
  `status` char(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT 'notLogged',
  `userconnected` char(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `profilepicture` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `wh_status` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `wh_message` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `wh_qrcode` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `wh_connect` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `wh_incomingcall` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando estrutura para tabela mywhatsapp-api.statistics
CREATE TABLE IF NOT EXISTS `statistics` (
  `ID` int unsigned NOT NULL AUTO_INCREMENT,
  `authorizationtoken` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `sessionname` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `status` char(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `type` char(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `isgroup` tinyint NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `ID` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=196 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando estrutura para tabela mywhatsapp-api.tokens
CREATE TABLE IF NOT EXISTS `tokens` (
  `ID` int unsigned NOT NULL AUTO_INCREMENT,
  `authorizationtoken` char(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `datafinal` date NOT NULL,
  `active` char(5) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT 'true',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `ID` (`ID`),
  UNIQUE KEY `token` (`authorizationtoken`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;

-- Copiando dados para a tabela mywhatsapp-api.tokens: ~2 rows (aproximadamente)
INSERT INTO `tokens` (`ID`, `authorizationtoken`, `datafinal`, `active`, `created`, `modified`) VALUES
	(1, 'TOKENTESTE123', '9999-12-31', '1', '2023-06-27 02:24:55', '2023-09-23 18:30:07');
```

## Rotas

> As rota se encontra no arquivo [Insomnia.json](https://github.com/AlanMartines/mywhatsapp-api-node-baileys-md/blob/master/Insomnia.json "Insomnia.json"), importe para seu Insomnia e desfrute da API.

#### Json (POST)

```json
{
  "SessionName": "Teste"
	...
}
```

#### Iniciar sessão whatsapp (POST method)

```js
await fetch("http://localhost:9001/sistema/Start", {
  method: "POST",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "AuthorizationToken": "SECRET_KEY_OR_TOKEN",
  },
  body: JSON.stringify({
    "SessionName": "Teste"
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error(error));
```

#### Retorna json com (base64) do QR-Code (POST method)

```js
await fetch("http://localhost:9001/sistema/QRCode", {
  method: "POST",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "AuthorizationToken": "SECRET_KEY_OR_TOKEN",
  },
  body: JSON.stringify({
    "SessionName": "Teste"
		"View": false,
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error(error));
```

#### Fecha sessão whatsapp (POST method)

```js
await fetch("http://localhost:9001/sistema/Close", {
  method: "POST",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "AuthorizationToken": "SECRET_KEY_OR_TOKEN",
  },
  body: JSON.stringify({
    "SessionName": "Teste"
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error(error));
```

## Docker-Compose

```bash
# Ir para seu diretório home
cd ~

#Criar pasta para os tokens
mkdir /usr/local/tokens

#Setar permição na pasta tokens
chmod -R 775 /usr/local/tokens

# Clone este repositório
git clone https://github.com/AlanMartines/mywhatsapp-api-node-baileys-md.git ApiBaileysMd

# Acesse a pasta do projeto no terminal/cmd
cd ApiBaileysMd

# Instale as dependências
npm install --allow-root --unsafe-perm=true

# Configuração inicial
cp .env-example .env

# Criar um contêiner
docker compose -f docker-compose.yml up --build -d
```

## Dockerfile

```bash
# Ir para seu diretório home
cd ~

#Criar pasta para os tokens
mkdir /usr/local/tokens

#Setar permição na pasta tokens
chmod -R 777 /usr/local/tokens

# Clone este repositório
git clone https://github.com/AlanMartines/mywhatsapp-api-node-baileys-md.git ApiBaileysMd

# Acesse a pasta do projeto no terminal/cmd
cd ApiBaileysMd

# Instale as dependências
npm install --allow-root --unsafe-perm=true

# Configuração inicial
cp .env-example .env

# Processando o arquivo Dockerfile
docker build -t alanmartines/mywhatsapp-api-node-baileys-md:1.0.0 -f Dockerfile.backend .

# Criar contêiner
docker run -d -p 9001:9001 --name ApiBaileysMd --restart=unless-stopped --env-file .env alanmartines/mywhatsapp-api-node-baileys-md:1.0.0

```

## Instalar o certbot Debian (e.g. Ubuntu) 64bits

```barsh
# Instalar Python e cerbot
sudo apt install -y certbot python3-certbot-nginx

# Renew certificate interactively
sudo certbot renew
```

## Instalar o certbot CentOS 7/8 64bits

```barsh
# Instalar Python e cerbot
sudo yum install -y epel-release

# Instalar plugin para nginex
sudo yum install -y certbot-nginx

# Renew certificate interactively
sudo certbot renew
```

## Instalar o certbot Alpine 64bits

```barsh
# Instalar Python
apk add --update python3 py3-pip

# Instalar cerbot
apk add certbot

# Instalar plugin para nginex
pip install certbot-nginx

# Renew certificate interactively
certbot renew
```

## Criar o certificado SSL para domínios https Debian (e.g. Ubuntu) 64bits e CentOS 7/8 64bits

```barsh
sudo certbot certonly --manual --force-renewal -d *.yourdomain.net -d yourdomain.net \
--agree-tos --no-bootstrap --manual-public-ip-logging-ok --preferred-challenges dns-01 \
--server https://acme-v02.api.letsencrypt.org/directory
```

## Criar o certificado SSL para domínios https Alpine 64bits

```barsh
certbot certonly --manual --force-renewal -d *.yourdomain.net -d yourdomain.net \
--agree-tos --no-bootstrap --manual-public-ip-logging-ok --preferred-challenges dns-01 \
--server https://acme-v02.api.letsencrypt.org/directory
```

## Em desenvolvimento

Este projeto se encontra em desenvolvimento, então pode conter erros.

## Ban Whatsapp

<blockquote>
Existem dois tipos diferentes de banimento.

**BANIMENTO TEMPORÁRIO**
Uma técnica para banir temporariamente uma conta. Eu sei que eles não estão mais acostumados a aplicar banimento temporário, ou eles são tão raros hoje em dia, exceto pelo uso de versões não autorizadas do WhatsApp.

- O WhatsApp pode banir temporariamente sua conta se você estiver usando uma versão não autorizada do WhatsApp.
- Versões não autorizadas do WhatsApp, também conhecidas como “Mods do WhatsApp” no Android, costumam oferecer vários novos recursos, mas sua privacidade pode ser comprometida: esses aplicativos editam o WhatsApp, injetando um código diferente, e não podemos saber se esse código é perigoso para sua privacidade e segurança.

- Usar uma versão modificada do WhatsApp viola os Termos de Serviço, então o WhatsApp pode banir sua conta quando iniciar uma nova onda de banimento. Se o usuário não mudar para a versão oficial do WhatsApp da App Store e Google Play Store dentro de um determinado tempo, ele definitivamente banirá sua conta.

- O WhatsApp deve proteger seus produtos e usuários, portanto, sua ação de banir as versões modificadas é absolutamente correta. Talvez eles pudessem agir de forma diferente, por exemplo, impedindo o acesso a versões modificadas do WhatsApp sem banir o usuário, mas é compreensível. Há alguns anos o WhatsApp está tentando convencer as pessoas a parar de usar versões modificadas do WhatsApp, implementando alguns recursos incluídos nessas versões.
- O WhatsApp pode banir temporariamente sua conta se você criar muitos grupos com pessoas que não têm seu número de telefone salvo em suas listas de endereços.
- O WhatsApp pode banir temporariamente sua conta se você enviar muitas mensagens para pessoas que não têm seu número de telefone salvo em suas listas de endereços.
- O WhatsApp pode banir temporariamente sua conta se você enviar muitas mensagens para uma lista de difusão.
- O WhatsApp poderia anteriormente banir sua conta se você enviar a mesma mensagem para muitas pessoas. O WhatsApp não consegue ler o conteúdo da mensagem, mas se o aplicativo WhatsApp entender que você está encaminhando a mesma mensagem para muitos contatos, você pode ser banido temporariamente. Não deveria estar ativo hoje em dia ou é muito raro, pois o WhatsApp permite encaminhar uma mensagem para no máximo 5 contatos, a fim de evitar a divulgação de notícias falsas.
- O WhatsApp pode banir temporariamente sua conta se muitas pessoas bloquearem você em um determinado tempo.
  Se o usuário foi banido temporariamente várias vezes, ele pode ser banido permanentemente de usar o WhatsApp.

**BANIMENTO PERMANENTE**
Principais razões pelas quais o WhatsApp pode banir sua conta:

- O WhatsApp proíbe permanentemente contas que executam ações em massa ou automatizadas: elas violam totalmente seus Termos de Serviço porque essas ações usam os serviços do WhatsApp sem qualquer autorização. O WhatsApp proíbe mais de 2,5 milhões de contas por mês devido a mensagens em massa e automatizadas.
- O WhatsApp pode banir permanentemente sua conta se o número de telefone associado tiver sido usado para ações suspeitas. Essa verificação acontece durante o registro da conta.
- O WhatsApp proíbe contas que usam seu serviço intensamente, por exemplo, se a conta enviar muitas mensagens em um determinado período. Não se preocupe, o WhatsApp introduziu um limite que é realmente inalcançável para uma pessoa. Se uma conta atingiu o limite, significa que não é humana, mas é um sistema automatizado.
- O WhatsApp bane todas as contas que recebem vários relatórios de outros usuários.
O WhatsApp avisa que eles não podem emitir um aviso antes de banir qualquer conta (de acordo com seus Termos de Serviço, eles podem reter o direito de bani-lo sem qualquer comunicação), mas, se o usuário pensa que sua conta foi banida por engano, ele pode enviar um e-mail para que eles vai examinar o caso dele.
O WhatsApp também proíbe contas com nomes suspeitos em seus nomes de grupo.
Conforme mencionado no artigo sobre os rótulos de privacidade da Apple para WhatsApp, o WhatsApp pode visualizar todos os nomes e descrições de grupos, a fim de banir automaticamente todas as contas que violam as leis (mas não são coletadas para fins publicitários e esses detalhes não são compartilhados com seus pais empresa, Facebook). Isso é para ajudar o WhatsApp a combater a exploração infantil.
Infelizmente, o WhatsApp também pode banir sua conta por engano. Deixe-nos mostrar alguns exemplos.
Algumas semanas atrás, recebi um relatório de um usuário do WhatsApp: ele estava em um grupo com outros 12 membros. Um membro deu seu código de 6 dígitos para outra pessoa e ele perdeu sua conta do WhatsApp (o que são contas do WhatsApp roubadas e por que isso acontece?). Este “novo membro” mudou o nome e a descrição do grupo: ele inseriu termos ilegais, acionando sistemas WhatsApp e todo o grupo foi banido.
Esses usuários tentaram entrar em contato com o Suporte do WhatsApp para solicitar o cancelamento do banimento. O WhatsApp se recusou a cancelar o banimento dessas contas, porque violaram seus Termos de Serviço.
Mantiveram contato com o suporte por mais de 2 meses, mas nada de novo: sempre recebiam a mesma resposta ou não atendiam.
Resolvi dar voz a essa história, compartilhando no Twitter. No dia seguinte, essas 13 contas foram canceladas.
</blockquote>

## Reflexão

<blockquote>
O conhecimento que adquirimos não merece ficar parado. Compartilhar tudo o que sabemos e gerar valor na vida de outras pessoas pode ter efeitos incríveis. Viver em constante compartilhamento de informações ajuda nossa comunidade profissional a evoluir cada vez mais.

Todos nós, independente do nível de conhecimento técnico, temos algum tipo de diferencial a oferecer para o próximo.

Já que temos a incrível capacidade de oferecer algo diferente para o próximo, devemos aproveitar isso para compartilhar todo esse nosso conhecimento.

Às vezes temos o sentimento de que aquilo que estamos fazendo de tão especial merece ser compartilhado, a internet está aí para nos possibilitar isso.

Temos a chance de buscar um conhecimento hoje e amanhã criar um artigo, vídeo ou qualquer outro tipo de material para compartilhar com as pessoas esse conhecimento que adquirimos.

Muitas pessoas, e talvez você se inclua nesse grupo, ainda têm aquele sentimento forte de mudar o próximo. Um sentimento que a faz ter um propósito de vida para buscar algo a mais, algo que possa contribuir para as gerações que por aqui estão e que ainda virá a passar.

Isso fica ainda mais expressivo quando se trata da comunidade específica de seu campo de estudo ou trabalho, pois deixar algum “legado” para sua área de conhecimento é algo que chama atenção de profissionais, pesquisadores e estudantes do mundo todo.

Muitos são movidos exatamente por essa energia de deixar seu nome registrado para o mundo.

A sua carreira é construída ao longo do tempo com uma série de conhecimentos e habilidades que são adquiras ao longo da vida.

Mas essa tarefa não precisa ser uma ação solitária e tão complicada assim, ainda mais levando em conta que uma sede grande pela busca de conhecimento e alguns ainda mais motivados para compartilhar tudo aquilo que já aprenderam.

Em outras palavras, as pessoas acabam tendo uma certa tendência em escutar o que as outras pessoas têm a dizer e também fazer a sua voz ser ouvida.

A informação não fica parada!

Quando entendemos a força desse hábito de compartilhar conhecimento, estamos contribuindo para que as pessoas ao nosso redor, que também precisam desse conhecimento, não parem de aprender.

Informação que fica parada, se perde! Tudo está na rede, esperando por você.

Faça dessa prática um de seus hábitos também. As informações que são compartilhadas por você podem contribuir para o crescimento e ascensão de alguém, já imaginou isso?

Envolva-se com as pessoas. Isso é ter propósito!

</blockquote>

# Contribuições

[Contribuições](CONTRIBUTING.md) são bem-vindas! Por favor, abra uma issue ou pull request.

# Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
