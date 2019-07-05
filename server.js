const express = require('express')
const app = express()
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs')

app.disable('view cache')
app.use(express.static(__dirname + '/'));

app.get('/', function(req, res){
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
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
        
        sendMessage('Mundo salvo!')
        saving = false
        
    })
}
const sendMessage = (msg, sender=null) => {
    io.emit('newMessage', {
        sender: sender !== null ? sender : 'Servidor',
        msg: msg
    })
}

const toGrid = pos => {
    pos.x = Math.floor(pos.x - pos.x % 32)
    pos.y = Math.floor(pos.y - pos.y % 32)
    return pos
}
const removePlayer = id => {
    delete players[id]
    io.emit('playerDisconnected', id)
    console.log(`${id} - Disconnected`)
}
io.on('connection', socket => {

    const id = socket.id
    console.log(`${id} - Connected`);

    let canPlace = true
    let canDestroy = true
    let timeInactive = 0

    socket.on('ready', nick => {
        
        players[id] = {}

        io.emit('newPlayer', {
            id: id
        })

        socket.emit('loadBlocks', blocks)
        socket.emit('loadMessages', messages)
        socket.broadcast.emit('newMessage', {
            sender: 'Servidor',
            msg: `<strong>${nick}</strong> entrou`
        })
        socket.emit('newMessage', {
            sender: 'Servidor',
            msg: 'Bem vindo!<br/>Aqui vão umas dicas:<br/><strong>CLIQUE ESQUERDO:</strong> Destrói bloco<br/><strong>CLIQUE DIREITO:</strong> Coloca bloco<br/><strong>SCROLL:</strong> muda item atual<br/><strong>ESPAÇO:</strong> alterna entre movimento normal e voo<br/><strong>SHIFT+SCROLL:</strong> altera zoom'
        })
        const inter = setInterval(() => {
            timeInactive ++
            if(timeInactive > 1){
                removePlayer(id)
                socket.disconnect()
                clearInterval(inter)
            }
        }, 1000);
        
    })

    socket.on('playerTick', state => {
        players[socket.id] = state
        timeInactive = 0
    })
    socket.on('chat', msg => {
        messages.push(msg)
        sendMessage(msg.msg, msg.sender)
    })
    socket.on('placeBlock', block => {

        const {x, y, sprite} = toGrid(block)
        const bid = `${x}-${y}`

        if(canPlace){
            canPlace = false
            setTimeout(() => canPlace = true, 50)
            
            if(!blocks[bid]){
                blocks[bid] = {
                    bid: bid,
                    x: x,
                    y: y,
                    sprite: sprite
                }
                io.emit('placeBlock', blocks[bid])
            }
            
        }else{
            io.emit('destroyBlock', bid)
        }
    })
    socket.on('destroyBlock', pos => {

        if(canDestroy){
            canDestroy = false
            setTimeout(() => canDestroy = true, 150)
            
            const {x, y} = toGrid(pos)
            const bid = `${x}-${y}`
            if(blocks[bid]){
                delete blocks[bid]
                io.emit('destroyBlock', bid)
            }
        }
        
    })
    socket.on('disconnect',() => {
        removePlayer(id)
    })
  
});

setInterval(() => io.emit('playersTick', players), 1000 / 60);
setInterval(saveWorld, 1000 * 60)
http.listen(80);

