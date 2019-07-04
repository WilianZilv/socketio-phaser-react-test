const express = require('express')
const app = express()
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs')

app.use(express.static(__dirname + '/'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

let players = {}
let messages = []
let blocks = {}

fs.readFile('./src/world.json', 'utf-8', (err, data) => {
    data = JSON.parse(data)
    blocks = data
})
let saving = false;
const saveWorld = () => {
    if(saving){
        return
    }
    saving = true
    fs.writeFile('./src/world.json', JSON.stringify(blocks), err => {
        
        io.emit('newMessage', {
            sender: 'Servidor',
            msg: 'Mundo salvo!'
        })
        saving = false
        
    })
}

const toGrid = pos => {
    pos.x = Math.floor(pos.x - pos.x % 32)
    pos.y = Math.floor(pos.y - pos.y % 32)
    return pos
}

io.on('connection', socket => {

    const id = socket.id
    console.log(`${id} - Connected`);

    socket.on('ready', () => {
        
        players[id] = {}

        io.emit('newPlayer', {
            id: id
        })

        socket.emit('loadBlocks', blocks)
        socket.emit('loadMessages', messages)
    })

    socket.on('playerTick', state => {
        players[socket.id] = state
    })
    socket.on('chat', msg => {
        messages.push(msg)
        io.emit('newMessage', msg)
    })
    socket.on('placeBlock', block => {
        const {x, y, sprite} = toGrid(block)

        const bid = `${x}-${y}`
        if(!blocks[bid]){
            blocks[bid] = {
                bid: bid,
                x: x,
                y: y,
                sprite: sprite
            }
            io.emit('placeBlock', blocks[bid])

        }
    })
    socket.on('destroyBlock', pos => {
        const {x, y} = toGrid(pos)
        const bid = `${x}-${y}`
        if(blocks[bid]){
            delete blocks[bid]
            io.emit('destroyBlock', bid)
        }
        
    })



    socket.on('disconnect', () => {
        delete players[id]
        io.emit('playerDisconnected', id)
        console.log(`${id} - Disconnected`)
    })
  
});

setInterval(() => io.emit('playersTick', players), 1000 / 60);
setInterval(saveWorld, 1000 * 60)
http.listen(80);

