class Main extends Phaser.Scene {

    constructor ()
    {
        super('GameScene');
        Game.scene = this

        this.playersState = {}
        this.blocksNet = {}

        
        this.currentItem = 0;
        this.canPlace = this.canDestroy = true
        this.zoom = false
    }
    setCurrentItem(i){
        if(!Game.chatFocused){
            Game.setCurrentItem(i)
            this.currentItem = i;
            this.target.setTexture('blocks', i)
        }
    }
    changeItem(dir){
        let next = this.currentItem + dir
        if(next < 0){
            next = blocksStore.length - 1
        }else if(next >= blocksStore.length){
            next = 0
        }
        this.setCurrentItem(next)
    }
    async spawnBlock(block=null, from=null){
        if(from){
            block = toGrid(from)
            
            
            Game.io.emit('placeBlock', block)
        }
        block.bid = `${block.x}-${block.y}`

        if(!this.blocksNet[block.bid]){

            const blockSprite = this.blocksBlitter.create(block.x, block.y, block.id)
            this.blocksNet[block.bid] = blockSprite

        }
    }
    destroyBlock(bid){
        if(this.blocksNet[bid]){
            this.blocksNet[bid].destroy()
            delete this.blocksNet[bid]
        }
    }
    spawnPlayer(nick, id){
        const remote = Game.io.id !== id
        const newPlayer = new Player(this, remote, nick, id)

        this.allPlayers.add(newPlayer)

        if(!remote){
            this.cameras.main.startFollow(newPlayer, true, .25, .25)
        }
        Game.updatePlayers()
    }
    preload ()
    {
        this.cameras.main.setBackgroundColor('#5baee5')
        
        this.physics.world.setBounds(0, 0, 2048, 2048, true, true, true, true);

        this.load.spritesheet('blocks', 'src/assets/block/block_sheet.png', { frameWidth: 32, frameHeight: 32})
        this.load.spritesheet('dude', 
            'src/assets/dude.png',
            { frameWidth: 32, frameHeight: 48 }
        );

        this.load.image('cloud', 'src/assets/cloud.png')
        
    }
   
    create(){
        window.addEventListener('wheel', (e) => {
            const dir = Math.sign(e.deltaY)
            if(this.zoom){

                let curZoom = this.cameras.main.zoom - dir / 10
                if(curZoom > 1) curZoom = 1
                if(curZoom < .15) curZoom = .15
                this.cameras.main.zoom = curZoom
                
            }else{
                
                this.changeItem(dir)

            }
        })

        this.input.keyboard.on('keydown-' + 'SHIFT', () => {
            this.zoom = true
        })
        this.input.keyboard.on('keyup-' + 'SHIFT', () => {
            this.zoom = false
        })
        this.camera = this.cameras.main
        this.target = this.add.sprite(0, 0)
        this.target.alpha = .75
        this.target.setDepth(4)
        this.setCurrentItem(0)
        this.allPlayers = this.add.group()
        this.allPlayers.runChildUpdate = true

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
    
        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });
    
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
        this.blocksBlitter = this.add.blitter(-16,-16,'blocks')

        this.blocks = this.physics.add.staticGroup();
        this.blocks.add(this.blocksBlitter)

        Game.io.on('newPlayer', ({nick, id}) => {
            this.spawnPlayer(nick, id)
        })

        Game.io.on('loadPlayers', players => {
            Object.entries(players).forEach(([id, player]) => {
                if(id !== Game.io.id){
                    this.spawnPlayer(player.nick, id)
                }
            })
        })
        
        Game.io.on('playerDisconnected', id => {
            
            const allPlayers = this.allPlayers.getChildren()
            for(let player of allPlayers){
                if(player.id === id){
                    player.disconnect()
                    break
                }
            }
            Game.updatePlayers()
            
        })

        Game.io.on('playersTick', s => this.playersState = s)
    
        Game.io.on('placeBlock', block => {
            this.spawnBlock(block)    
        })
        Game.io.on('destroyBlock', bid => {
            this.destroyBlock(bid)
        })
        Game.io.on('loadBlocks', blocks => {
            Object.entries(blocks).forEach(([key, block]) => {
                this.spawnBlock(block)
            })
        })
        Game.io.emit('ready', Game.username)
    }
    
    update(time, delta){
        
        this.scale.resize(window.outerWidth, window.innerHeight)
        this.input.keyboard.clearCaptures()

        const pointer = this.input.activePointer
        const {x, y} = toGrid({x: pointer.worldX, y: pointer.worldY})
        this.target.x = x
        this.target.y = y


        if(pointer.rightButtonDown()){

            if(this.canPlace){
                this.spawnBlock(null, {
                    x: pointer.worldX, 
                    y: pointer.worldY,
                    id: this.currentItem 
                })
                this.canPlace = false
                setTimeout(() => this.canPlace = true, 100)
            }
            
        } 
        if(pointer.leftButtonDown()){
            if(this.canDestroy){
                Game.io.emit('destroyBlock', {
                    x: pointer.worldX,
                    y: pointer.worldY,
                })
                this.canDestroy = false
                setTimeout(() => this.canDestroy = true, 1000)
            }
        }
    }
}
