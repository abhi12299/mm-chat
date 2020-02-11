const express = require('express');
const path = require('path');
const fs = require('fs');
const redisClient = require('./redisDb')

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
    socket.on('disconnect', async () => {
        console.log(`${socket.name} disconnected!`);
        io.emit('leave', socket.name);
        await redisClient.delAsync(`socketIdFor-${socket.name}`)
    });

    socket.on('join', async name => {
        console.log(`${name} joined!`);
        socket.name = name;
        io.emit('join', name);
        await redisClient.setAsync(`socketIdFor-${name}`, socket.id)
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

    socket.on('like', async (msg) => {
        try {
            const socketId = await redisClient.getAsync(`socketIdFor-${msg.name}`)
            if (socketId) {
                io.to(socketId).emit('like', msg)
            } else {
                // user was probably disconnected or doesnt exist
                // if disconnected, store this notif in a db
                // and show it once they log back in
            }
        } catch (error) {
            // handle the error somehow
        }
    });

    socket.on('dislike', async (msg) => {
        try {
            const socketId = await redisClient.getAsync(`socketIdFor-${msg.name}`)
            if (socketId) {
                io.to(socketId).emit('dislike', msg)
            } else {
                // user was probably disconnected or doesnt exist
                // if disconnected, store this notif in a db
                // and show it once they log back in
            }
        } catch (error) {
            // handle the error somehow
        }
    });

    socket.on('audio', msg => {
        io.emit('audio', msg);
    });
});

http.listen(3000, () => {
    console.log('> http://localhost:3000');
});
