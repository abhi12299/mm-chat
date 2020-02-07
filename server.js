const express = require('express');
const path = require('path');
const fs = require('fs');

const Busboy = require('busboy');
const app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

app.use(express.static('uploads'))

app.post('/upload', function(req, res) {
    const busboy = new Busboy({ headers: req.headers });
    req.pipe(busboy);
    busboy.on('file', (fieldname, file, filename) => {
        const ext = path.extname(filename);
        const newFilename = `${Date.now()}${ext}`;
        req.newFilename = newFilename;
        req.originalFilename = filename;
        const saveTo = path.join('uploads', newFilename);
        file.pipe(fs.createWriteStream(saveTo));
    });
    busboy.on('finish', () => {
        res.json({
            originalFilename: req.originalFilename,
            newFilename: req.newFilename
        });
    });
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

    socket.on('start-type', (name, cb) => {
        console.log(`${name} started to type`);
        socket.broadcast.emit('start-type', name);
        cb();
    });

    socket.on('stop-type', (name, cb) => {
        console.log(`${name} stopped typing`);
        socket.broadcast.emit('stop-type', name);
        cb();
    });

    socket.on('file', f => {
        console.log(`File by: ${f.name}`);
        io.emit('file', f);
    });
});

http.listen(3000, () => {
    console.log('> http://localhost:3000');
});
