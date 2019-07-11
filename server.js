const express = require('express')
const app = express()
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs')

app.disable('view cache')
app.use(express.static(__dirname + '/'));

app.get('/', function(req, res, next){
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.sendFile(__dirname + '/index.html');
    next()
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
        
        //sendMessage('Mundo salvo!')
        saving = false
        
    })
}
const sendMessage = (msg, sender=null, socket=null, id=null) => {
    const con = socket ? socket : io
    con.emit('newMessage', {
        id: id,
        sender: sender !== null ? sender : 'Servidor',
        msg: msg
    })
}

const toGrid = pos => {
    pos.x = Math.floor((pos.x + 16) / 32) * 32
    pos.y = Math.floor((pos.y + 16) / 32) * 32
    return pos
}
const removePlayer = id => {
    delete players[id]
    io.emit('playerDisconnected', id)
    console.log(`${id} - Disconnected`)
}
const checkCommand = (msg, socket) => {
    let isCommand = false
    switch (msg){

        case '!help':
        case '!h':
        case '!ajuda':
            sendMessage('CLIQUE ESQUERDO: Destrói bloco CLIQUE DIREITO: Coloca bloco SCROLL: muda item atual SHIFT+SCROLL: altera zoom',
            null, socket)
            isCommand = true
            break

        case '!dev':
            sendMessage('Wilian da Silva', 'Desenvolvedor')
            isCommand = true
            break
    }
    return isCommand
}
io.on('connection', socket => {

    const id = socket.id
    console.log(`${id} - Connected`);

    let canPlace = true
    let canDestroy = true
    let timeInactive = 0

    socket.on('ready', nick => {
        if(!nick){
            socket.disconnect()
            return
        }
        nick = nick.substring(0, 12)
        
        socket.emit('loadPlayers', players)
        
        players[id] = {nick: nick, state: {input: {x: 0, y: 0}, position: {x: 1024, y: 1024}}}

        io.emit('newPlayer', {
            nick: nick,
            id: id
        })

        const blocksArray = Object.entries(blocks)
        let blockChunks = []

        while(blocksArray.length){
            const chunkArray = blocksArray.splice(0, 128)
            let chunkObject = {}
            chunkArray.forEach(([key, val]) => {
                chunkObject[key] = val
            })

            blockChunks.push(chunkObject)
        }
        blockChunks.forEach(chunk => socket.emit('loadBlocks', chunk))

        socket.emit('loadMessages', messages)
        socket.broadcast.emit('newMessage', {
            sender: 'Servidor',
            msg: `${nick} entrou`
        })
        sendMessage('Bem vindo, qualquer dúvida, envie !ajuda',
        null, socket)

        const inter = setInterval(() => {
            timeInactive ++
            if(timeInactive > 5){
                socket.disconnect()
                clearInterval(inter)
            }
        }, 1000);
        
    })

    socket.on('playerTick', state => {
        if(!state){
            return
        }
        if(players[id]){
            players[id]['state'] = state
            timeInactive = 0
        }
    })
    socket.on('chat', msg => {
        try{
            msg.msg = msg.msg.substring(0, 120)
            if(!checkCommand(msg.msg, socket)){
                messages.push(msg)
                sendMessage(msg.msg, msg.sender, null, id)
            }
        }catch(err){
            console.log(`${id}: ${err}`)
        }
    })
    socket.on('placeBlock', block => {

        if(!block){
            return
        }
        block = toGrid(block)
        const bid = `${block.x}-${block.y}`

        if(canPlace){
            canPlace = false
            setTimeout(() => canPlace = true, 10)
            
            if(!blocks[bid]){
                blocks[bid] = {
                    x: block.x,
                    y: block.y,
                    id: block.id
                }
                io.emit('placeBlock', blocks[bid])
            }
            
        }else{
            io.emit('destroyBlock', bid)
        }
        
    })
    socket.on('destroyBlock', pos => {
        if(!pos){
            return
        }
        if(canDestroy){
            canDestroy = false
            setTimeout(() => canDestroy = true, 1000)

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

setInterval(() => {
    messages = []
    messages.push({
        id: null,
        sender: 'Servidor',
        msg: 'Chat limpo!'
    })
    io.emit('loadMessages', messages)

}, 1000 * 60 * 2.5)
setInterval(() => io.emit('playersTick', players), 1000 / 60);
setInterval(saveWorld, 1000 * 60)
http.listen(80);

