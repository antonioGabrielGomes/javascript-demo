import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// import { availableParallelism } from 'node:os';
import cluster from 'node:cluster';
import { createAdapter, setupPrimary } from '@socket.io/cluster-adapter';
import process from 'node:process';
import os from 'node:os';

async function main() {
    // open the databse file
    const db = await open({
        filename: 'chat.db',
        driver: sqlite3.Database
    });

    // create our 'messages' table (you can ignore the 'client_offset' collum for now)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_offset TEXT UNIQUE,
            content TEXT
        );
    `);

    const app = express();
    const server = createServer(app);
    const io = new Server(server, {
        connectionStateRecovery: {},
        // set up the adapter on each worker thread
        adapter: createAdapter()
    });

    app.get('/', (req, res) => {
        res.sendFile(join(__dirname, 'index.html'));
    });

    io.on('connection', async (socket) => {
        /// console.log('a user connected');

        socket.on('chat message', async (msg, clientOffset, callback) => {
            // io.emit('chat message', msg);
            let result;
            try {
                // store the message in the database
                // result = await db.run('INSERT INTO messages (content) VALUES (?)', msg);
                result = await db.run('INSERT INTO messages (content, client_offset) VALUES (?, ?)', msg, clientOffset);
            } catch (e: any) {
                // TODO handle the failure
                if (e.errno === 19 /** SQLITE_CONSTRAINT */) {
                    // the messsage was already inserted, so we notify the client
                    callback();
                } else {
                    // nothing to do, just let the client retry
                }
                return;
            }
            // include the offset with the message
            io.emit('chat message', msg, result.lastID);
            // acknowledge the event
            callback();
        });

        if (!socket.recovered) {
            // if the connection state recovery was not successful
            try {
                await db.each('SELECT id, content FROM messages WHERE id > ?',
                    [socket.handshake.auth.serverOffset || 0],
                    (_err, row) => {
                        socket.emit('chat message', row.content, row.id);
                    }
                )
            } catch (e) {
                // something went wrong
            }
        }

        // socket.on('disconnect', () => {
        //     console.log('user disconnected');
        // });
    });

    //   server.listen(3000, () => {
    //       console.log('server running at http://localhost:3000');
    //   });

    // each worker will listen on a distinct port
    const port = process.env.PORT;

    server.listen(port, () => {
        console.log(`server running at http://localhost:${port}`);
    });

}

if (cluster.isPrimary) {
    // const numCPUs = availableParallelism();
    const numCPUs = os.cpus().length;
    // console.log(numCPUs);
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork({
            PORT: 3000 + i
        });
    }

    setupPrimary();
} else {
    main();
}

