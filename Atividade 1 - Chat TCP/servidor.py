import socket
import threading

class ChatServer:
    def __init__(self, host='localhost', port=8888):
        self.host = host
        self.port = port
        self.clients = []
        self.nicknames = []

    def broadcast(self, message):
        """Envia mensagem para todos os clientes conectados"""
        for client in self.clients:
            try:
                client.send(message)
            except:
                self.remove_client(client)

    def remove_client(self, client):
        """Remove cliente desconectado"""
        if client in self.clients:
            index = self.clients.index(client)
            self.clients.remove(client)
            nickname = self.nicknames[index]
            self.nicknames.remove(nickname)
            self.broadcast(f'{nickname} saiu do chat!'.encode('utf-8'))
            client.close()

    def handle_client(self, client):
        """Gerencia mensagens de um cliente específico"""
        while True:
            try:
                message = client.recv(1024)
                if message:
                    self.broadcast(message)
                else:
                    self.remove_client(client)
                    break
            except:
                self.remove_client(client)
                break

    def start_server(self):
        """Inicia o servidor"""
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.bind((self.host, self.port))
        server.listen()
        
        print(f'Servidor iniciado em {self.host}:{self.port}')
        print('Aguardando conexões...')

        while True:
            client, address = server.accept()
            print(f'Conectado com {str(address)}')

            # Solicita nickname
            client.send('NICK'.encode('utf-8'))
            nickname = client.recv(1024).decode('utf-8')

            self.nicknames.append(nickname)
            self.clients.append(client)

            print(f'Nickname do cliente: {nickname}')
            self.broadcast(f'{nickname} entrou no chat!'.encode('utf-8'))
            client.send('Conectado ao servidor!'.encode('utf-8'))

            # Inicia thread para gerenciar o cliente
            thread = threading.Thread(target=self.handle_client, args=(client,))
            thread.start()

if __name__ == "__main__":
    server = ChatServer()
    server.start_server()