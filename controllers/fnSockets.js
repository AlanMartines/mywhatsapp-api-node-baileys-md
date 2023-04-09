module.exports = class Sockets {
		//
    constructor(io) {
        this.io = io;
    }
		//
    //Emitindo mensagem que qrcode mudou 
    qrCode(SessionName, data) {
        this.io.emit('qrCode', data);
        return true;
    }
		//
    //Mudando statusFind
    statusFind(SessionName, data) {
        this.io.emit('statusFind', data);
        return true;
    }
		//
    //Detectando start do servidor
    start(SessionName, data) {
        this.io.emit('start', data);
        return true;
    }
		//
    //Enviando mensagem como emissor
    messagesent(SessionName, data) {
        this.io.emit('messagesent', data);
        return true;
    }
		//
    //Recebendo mensagens
    message(SessionName, data) {
        this.io.emit('message', data);
        return true;
    }
		//
    //Mudando status
    stateChange(SessionName, data) {
        this.io.emit('stateChange', data);
        return true;
    }
		//
    //Webhook para detecção de chamadas
    eventCall(SessionName, data) {
        this.io.emit('eventCall', data);
        return true;
    }
		//
    //Webhook para detecção de alteracoes de status nas mensagens
    ack(SessionName, data) {
        this.io.emit('ack', data);
        return true;
    }
		//
    //Função para emitir mensagens de status
    events(SessionName, data) {
        this.io.emit('events', data)
    }
		//
    //Função para emitir um alerta
    alert(SessionName, data) {
        this.io.emit('alert', data);
        return true;
    }
		//
}