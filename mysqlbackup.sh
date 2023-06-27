#!/bin/bash

# Configurações do backup
nome_do_container="dbData"
user="root"
password="12345678"
host="127.0.0.1"
port=3306
backup_path="/usr/local/mysqlBackup"
days=15
#date=$(date +"%d-%b-%Y_%H:%M:%S")
date=$(date +"%d-%m-%Y")

# Verifica se o diretório de backup existe
if [ ! -d "$backup_path" ]; then
	echo "Diretório de backup $backup_path não encontrado"
	exit 1
fi

# Obtém a lista de bancos de dados
databases=$(mysql --user=$user --password=$password --host=$host --port=$port -e "SHOW DATABASES;" | grep -Ev "(Database|information_schema|performance_schema)")
#databases=$(docker exec $nome_do_container mysql --user=$user --password=$password --host=$host --port=$port -e "SHOW DATABASES;" | grep -Ev "(Database|information_schema|performance_schema|sys|mysql)")

# Faz backup de cada banco de dados e envia para o Google Drive
for db in $databases; do
	# Cria o backup em formato SQL
	mysqldump --user=$user --password=$password --host=$host $db >$backup_path/$db-$date.sql
	#docker exec $nome_do_container sh -c "exec mysqldump --single-transaction -u $user -p'$password' $db" > $backup_path/$db-$date.sql

	# Verifica se o backup foi criado com sucesso
	if [ $? -ne 0 ]; then
		echo "Erro ao criar backup do banco de dados $db"
		exit 1
	fi

	# Compacta o backup em formato tar.gz
	tar -czf $backup_path/$db-$date.tar.gz $backup_path/$db-$date.sql

	# Remove o backup SQL não compactado
	rm $backup_path/$db-$date.sql

done

# Acecessa o diretório de backup
cd $backup_path

# Verifica se o script está no diretório de backup
if [ $(pwd) != $backup_path ]; then
	echo "O script não está no diretório $backup_path"
	exit 1
fi

# Remove os arquivos antigos
find . -type f -mtime +$days -delete

# Envia o backup para o Google Drive usando o rclone
#flock -n /tmp/google_drv_sync.lock /usr/bin/rclone sync --transfers 20 --retries 5 "$backup_path" "GoogleDrive:/Bkp/MySql"