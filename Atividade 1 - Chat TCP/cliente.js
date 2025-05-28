const net = require('net');
const readline = require('readline');

class ChatClient {
    constructor(host = 'localhost', port = 8888) {
        this.host = host;
        this.port = port;
        this.client = null;
        this.nickname = '';
        
        // Interface para entrada do usuário
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    connect() {
        this.client = new net.Socket();

        this.client.connect(this.port, this.host, () => {
            console.log(`Conectado ao servidor ${this.host}:${this.port}`);
        });

        // Recebe mensagens do servidor
        this.client.on('data', (data) => {
            const message = data.toString();
            
            if (message === 'NICK') {
                // Servidor solicita nickname
                this.rl.question('Escolha um nickname: ', (nickname) => {
                    this.nickname = nickname;
                    this.client.write(nickname);
                    this.startChatting();
                });
            } else {
                console.log(message);
            }
        });

        // Gerencia desconexão
        this.client.on('close', () => {
            console.log('Desconectado do servidor');
            process.exit(0);
        });

        // Gerencia erros
        this.client.on('error', (err) => {
            console.error('Erro de conexão:', err.message);
            process.exit(1);
        });
    }

    startChatting() {
        console.log('\n=== CHAT INICIADO ===');
        console.log('Digite suas mensagens (digite "sair" para desconectar):');
        
        const promptUser = () => {
            this.rl.question('', (message) => {
                if (message.toLowerCase() === 'sair') {
                    this.disconnect();
                    return;
                }
                
                // Envia mensagem formatada
                const formattedMessage = `${this.nickname}: ${message}`;
                this.client.write(formattedMessage);
                promptUser(); // Continua esperando input
            });
        };
        
        promptUser();
    }

    disconnect() {
        console.log('Desconectando...');
        this.client.end();
        this.rl.close();
    }
}

// Inicia o cliente
const client = new ChatClient();
client.connect();