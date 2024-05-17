import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path, { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import cors from 'cors';

import cluster from 'node:cluster';
import { createAdapter, setupPrimary } from '@socket.io/cluster-adapter';


async function main() {
    const app = express();
    const server = createServer(app);
    const io = new Server(server, {
    });

    const connectedUsers = new Map();
    const usersInMatch = new Set();

    app.use(cors())

    app.use(express.static(path.join(__dirname, 'public')));

    app.get('/', (req, res) => {
        res.sendFile(join(__dirname, 'index.html'));
    });

    app.get('/chat', (req, res) => {
        res.sendFile(join(__dirname, 'chat.html'));
    });

    io.on('connection', async (socket) => {

        const userId = socket.id;
        connectedUsers.set(userId);

        console.log('a user connected with ID:', userId);

        // socket.on('chat message', async (msg, clientOffset, callback) => {
        // 
        // });
    /**
    if (usersInMatch.has(userId)) {
        console.log('User with ID ', userId, ' is already in a match')
    } else {
        let randomUserId;
        do {
            randomUserId = Array.from(connectedUsers.keys())[Math.floor(Math.random() * connectedUsers.size)]
        } while (randomUserId === userId || usersInMatch.has(randomUserId));

         // Adicionar ambos os usuários ao conjunto de usuários em uma correspondência
         usersInMatch.add(userId);
         usersInMatch.add(randomUserId);
 
         // Emitir um evento para informar ambos os usuários sobre a correspondência
         io.to(userId).emit('match', randomUserId);
         io.to(randomUserId).emit('match', userId);
 
         console.log('User with ID', userId, 'matched with user with ID', randomUserId); 
    }

     */

        // socket.on('disconnect', () => {
        //     console.log('user disconnected');
        // });
    });

    server.listen(3000, () => {
        console.log('server running at http://localhost:3000');
    });
}

main();

