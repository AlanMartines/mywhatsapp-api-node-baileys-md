import requests
import json
import base64
import mimetypes
import os
import requests


def funcao_dados():
    # Gera dados
    return {
        "AuthorizationToken": "",
        "SessionName": "",
        "wh_status": "",
        "wh_message": "",
        "wh_qrcode": "",
        "wh_connect": ""
    }


def funcao_base64(arquivo):
    # Gera base64
    if arquivo.startswith('http://') or arquivo.startswith('https://'):
        try:
            resposta = requests.get(arquivo)
            # Verifica se o link está online
            if resposta.status_code != 200:
                print('O link está offline')
                return False
            dados = resposta.content
        except requests.exceptions.RequestException as e:
            print("Erro ao acessar o link: {}".format(e))
            return False
    else:
        if not os.path.exists(arquivo):
            print("O arquivo não existe")
            return False
        with open(arquivo, 'rb') as f:
            dados = f.read()

    base64_encoded = base64.b64encode(dados).decode('utf-8')

    mimetype = mimetypes.guess_type(arquivo)[0]
    extensao = os.path.splitext(arquivo)[1]
    filename = os.path.basename(arquivo)

    return {
        'base64': base64_encoded,
        'mimetype': mimetype,
        'extensao': extensao,
        'filename': filename
    }


def iniciar_whats():
    # Inicia a API
    print('Iniciando API')
    AuthorizationToken, SessionName, wh_status, wh_message, wh_qrcode, wh_connect = funcao_dados()
    url = "http://localhost/instance/Start"
    payload = json.dumps({
        "SessionName": f"{SessionName}",
        "wh_status": f"{wh_status}",
        "wh_message": f"{wh_message}",
        "wh_qrcode": f"{wh_qrcode}",
        "wh_connect": f"{wh_connect}"
    })
    headers = {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'AuthorizationToken': f'{AuthorizationToken}'
    }
    response = requests.request("POST", url, headers=headers, data=payload)
    print(response.text)  # UTILIZADO PARA INFORMAR QUE A API FOI INICIADA
    status_whats = response.text
    return status_whats


def status_whats():
    # Inicia a API
    print('Staus API')
    AuthorizationToken, SessionName = funcao_dados()
    url = "http://localhost/instance/Status"
    payload = json.dumps({
        "SessionName": f"{SessionName}"
    })
    headers = {
        'Content-Type': 'application/json',
				'Accept': '*/*',
				'AuthorizationToken': f'{AuthorizationToken}'
    }
    response = requests.request("POST", url, headers=headers, data=payload)
    print(response.text)  # UTILIZADO PARA INFORMAR QUE A API FOI INICIADA
    status_whats = response.text
    return status_whats


def enviar_texto_whats(contato):
    # Enviar texto
    if contato:
        AuthorizationToken, SessionName = funcao_dados()
        url = "http://localhost/message/sendText"
        payload = json.dumps({
            "SessionName": f"{SessionName}",
            "phonefull": f"{contato}",
            "msg": f"Olá..."
        })
        headers = {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'AuthorizationToken': f'{AuthorizationToken}'
        }
        response = requests.request("POST", url, headers=headers, data=payload)
        print(response.text)
        status_whats = response.text
        return status_whats
    else:
        print('\n')
        return False


def enviar_arquivo_whats(filePatch, contato):
    # Envia base64
    if contato and filePatch:
        AuthorizationToken, SessionName = funcao_dados()
        arquivo_base64_str, mimetype, extensao, filename = funcao_base64(
            filePatch)
        url = "http://localhost/message/sendFileBase64"
        payload = json.dumps({
            "SessionName": f"{SessionName}",
            "phonefull": f"{contato}",
            "base64": f"{arquivo_base64_str}",
            "originalname": f"{filename}",
            # \n{data_hr}
            "caption": f"Olá, segue o arquivo..."
        })
        headers = {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'AuthorizationToken': f'{AuthorizationToken}'
        }
        response = requests.request("POST", url, headers=headers, data=payload)
        print(response.text)
        status_whats = response.text
        return status_whats
    else:
        print('\n')
        return False


if __name__ == "__main__":

    print('\n')
    srState = iniciar_whats()

    while True:
        # Seu código aqui

        if srState.state == 'CONNECTED' or srState.status == 'inChat':
            break
