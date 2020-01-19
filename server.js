const express = require('express');

const app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

io.on('connection', socket => {
    socket.on('disconnect', () => {
        console.log(`${socket.name} disconnected!`);
        io.emit('leave', socket.name);
    });

    socket.on('join', name => {
        console.log(`${name} joined!`);
        socket.name = name;
        io.emit('join', name);
    });

    socket.on('chat', data => {
        console.log(`chat data: ${JSON.stringify(data, null, 2)}`);
        io.emit('chat', data);
    });
});

http.listen(3000, () => {
    console.log('> http://localhost:3000');
});
