import asyncio
import websockets
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

connected_clients = set()
message_history = []

async def register_client(websocket):
    connected_clients.add(websocket)
    logger.info(f"Cliente conectado. Total: {len(connected_clients)}")
    
    if message_history:
        for message in message_history[-50:]:
            await websocket.send(json.dumps(message))

async def unregister_client(websocket):
    connected_clients.discard(websocket)
    logger.info(f"Cliente desconectado. Total: {len(connected_clients)}")

async def broadcast_message(message, sender_websocket):
    if connected_clients:
        message_data = {
            "id": len(message_history) + 1,
            "username": message.get("username", "Anônimo"),
            "text": message.get("text", ""),
            "timestamp": datetime.now().isoformat(),
            "type": "message"
        }
        
        message_history.append(message_data)
        
        disconnected = set()
        for client in connected_clients:
            try:
                await client.send(json.dumps(message_data))
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(client)
        
        for client in disconnected:
            connected_clients.discard(client)

async def handle_client(websocket, path):
    try:
        await register_client(websocket)
        
        welcome_message = {
            "type": "system",
            "text": "Bem-vindo ao chat!",
            "timestamp": datetime.now().isoformat()
        }
        await websocket.send(json.dumps(welcome_message))
        
        notification = {
            "type": "notification",
            "text": "Um usuário entrou no chat",
            "timestamp": datetime.now().isoformat()
        }
        await broadcast_message(notification, websocket)
        
        async for message in websocket:
            try:
                data = json.loads(message)
                logger.info(f"Mensagem recebida: {data}")
                
                if data.get("type") == "message":
                    await broadcast_message(data, websocket)
                    
            except json.JSONDecodeError:
                logger.error(f"Mensagem inválida recebida: {message}")
                
    except websockets.exceptions.ConnectionClosed:
        logger.info("Conexão fechada pelo cliente")
    except Exception as e:
        logger.error(f"Erro na conexão: {e}")
    finally:
        await unregister_client(websocket)
        
        notification = {
            "type": "notification",
            "text": "Um usuário saiu do chat",
            "timestamp": datetime.now().isoformat()
        }
        if connected_clients:
            await broadcast_message(notification, None)

def main():
    HOST = "localhost"
    PORT = 8765
    
    logger.info(f"Iniciando servidor WebSocket em ws://{HOST}:{PORT}")
    
    start_server = websockets.serve(handle_client, HOST, PORT)
    
    logger.info("Servidor iniciado! Pressione Ctrl+C para parar.")
    
    try:
        asyncio.get_event_loop().run_until_complete(start_server)
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        logger.info("Servidor interrompido pelo usuário")
    except Exception as e:
        logger.error(f"Erro no servidor: {e}")

if __name__ == "__main__":
    main()