## Template NGINX proxy reverso

#### Configuração simples

```sh
# Comando para criar o arquivo de configuração
sudo vim /etc/nginx/conf.d/apiwa.conf
```

```sh
# Define um upstream chamado "aplication" que aponta para um servidor rodando no localhost na porta 9001.
# Isso é útil para fazer balanceamento de carga ou proxy reverso para uma aplicação rodando nesse endereço e porta.
upstream aplication {
    server 127.0.0.1:9001;
}

# Bloco de servidor para lidar com solicitações HTTP (porta 80).
# Redireciona todo o tráfego HTTP para HTTPS para garantir uma comunicação segura.
server {
    listen 80;
    listen [::]:80;
    charset utf-8;
    client_max_body_size 256M;
    server_name subdominio.seudominio.com.br;
    return 301 https://$host$request_uri;
}

# Bloco de servidor para lidar com solicitações HTTPS (porta 443).
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    charset utf-8;
    client_max_body_size 256M;
    server_name subdominio.seudominio.com.br;

    # Caminhos para os certificados SSL gerados pelo Let's Encrypt (Certbot).
    ssl_certificate /etc/letsencrypt/live/subdominio.seudominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/subdominio.seudominio.com.br/privkey.pem;

    # Configurações de segurança SSL para usar protocolos e cifras fortes.
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_ecdh_curve secp384r1;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling off;
    ssl_stapling_verify off;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Cabeçalhos de segurança adicionais.
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Configuração de log para este subdomínio.
		access_log /var/log/nginx/subdominio.access.log;
		error_log /var/log/nginx/subdominio.error.log warn;

    # Tratamento específico para favicon.ico.
    location = /favicon.ico {
        return 204;
        access_log off;
        log_not_found off;
    }

    # Configuração de proxy reverso para a aplicação.
    location / {
        proxy_pass http://aplication;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        # Suporte para WebSocket.
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_read_timeout 90;
        proxy_redirect off;
    }

    # Configuração específica para Socket.IO.
    location /socket.io/ {
        proxy_pass http://aplication;
        proxy_redirect off;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Fix Limit File Upload Size in NGINX (client intended to send too large body)

1. Edite o arquivo /etc/nginx/nginx.conf:

```sh
sudo vim /etc/nginx/nginx.conf
```

- **http:**
  > Essa configuração nos permitirão fazer upload em todo o site

```sh
 http {
	 ...
	 client_max_body_size 200M;
 }
```

1. Edite o arquivo /etc/nginx/conf.d/file_name.conf:

```sh
sudo vim /etc/nginx/nginx.conf
```

- **server:**
  > Essa configuração nos permitirão fazer upload em um servidor específico

```sh
server {
	 ...
	 client_max_body_size 200M;
}
```

- **location:**
  > Essa configuração nos permitirão fazer upload em um bloco específico

```sh
location / {
	 ...
	 client_max_body_size 200M;
}
```

> **Obs.:** Valor infomado como forma de exemplo.

2. Salve o arquivo e reinicie o servidor da web NGINX para aplicar as alterações:

   - **systemd**

```sh
	sudo systemctl restart nginx;
```
