const http = require('http')
const fs = require('fs');
const WebSocketServer = require('websocket').server
let connection = null;

const httpserver = http.createServer((req, res) => {
    console.log((new Date()) + ' Received request for ' + req.url);

    if (req.url === "/socket") {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.readFile('index.html', 'utf8', (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Página não encontrada!');
            } else {
                // Envia a página HTML como resposta
                res.write(data);
                res.end();
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }


});

const websocket = new WebSocketServer({
    httpServer: httpserver,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    return true;
}


websocket.on("request", request => {
    if (!originIsAllowed(request.origin)) {
        request.reject();
        // console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    connection = request.accept(null, request.origin);
    
    connection.send("Hello client.");

    connection.on('message', function (message) {
        console.log(message.utf8Data)
        console.log(`Received Message: ${message.utf8Data}`);
    });

    connection.on('close', function (reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });

    seconds();
});


function seconds() {
    connection.send(`Message: ${Math.random()}`);
    setTimeout(seconds, 1000);
}


httpserver.listen(8081, () => console.log((new Date()) + ' Server is listening on port 8081'));
