class Main extends Phaser.Scene {

    constructor ()
    {
        super('GameScene');
        Game.scene = this
        this.player = null
        this.players = {
            instances: {},
            state: {}
        }

        
        this.currentItem = 0;
        this.blocksNet = {}
        this.canPlace = this.canDestroy = true
        this.zoom = false
    }
    setCurrentItem(i){
        if(!Game.chatFocused){
            Game.setCurrentItem(i)
            this.currentItem = i;
            this.target.setTexture(blocksStore[this.currentItem].name)
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
    spawnBlock(block=null, from=null){
        if(from){
            block = toGrid(from)
            block.bid = `${block.x}-${block.y}`
            
            Game.io.emit('placeBlock', block)
        }
        if(!this.blocksNet[block.bid]){
            this.blocksNet[block.bid] = this.blocks.create(block.x, block.y, block.sprite)
        }
    }
    destroyBlock(bid){
        if(this.blocksNet[bid]){
            this.blocksNet[bid].destroy()
            delete this.blocksNet[bid]
        }
    }
    preload ()
    {
        this.cameras.main.setBackgroundColor('#5baee5')

        this.physics.world.setBounds(0, 0, 2048, 2048, true, true, true, true);

        blocksStore.forEach(({name, url}) => {
            this.load.image(name, url)
        })

        this.load.spritesheet('dude', 
            'src/assets/dude.png',
            { frameWidth: 32, frameHeight: 48 }
        );

        this.load.image('cloud', 'src/assets/cloud.png')
        
    }
    create(){

        window.addEventListener('wheel', (e) => {
            const dir = e.deltaY / -100
            if(this.zoom){

                let curZoom = this.cameras.main.zoom + dir / 10
                if(curZoom > 1) curZoom = 1
                if(curZoom < .25) curZoom = .25
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
        
        this.target = this.add.sprite(0, 0, blocksStore[this.currentItem].name)
        this.target.alpha = .5
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

        this.blocks = this.physics.add.staticGroup();
        Game.io.on('newPlayer', ({id}) => {
    
            if(Game.io.id === id){
                this.player = new Player(this)
                this.cameras.main.startFollow(this.player.rb, true, .25, .25)
            }
        })
        Game.io.on('playersTick', s => this.players.state = s)
        
        Game.io.on('playerDisconnected', id => {
            const p = this.players.instances[id]
            if(p){
                p.destroy()
                delete this.players.instances[id]
                delete this.players.state[id]
            }
        })
    
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
    
    update(){
        this.scale.resize(window.outerWidth, window.innerHeight)
        this.input.keyboard.clearCaptures()

        const pointer = this.input.activePointer
        this.target.x = Math.floor((pointer.worldX + 16) / 32) * 32
        this.target.y = Math.floor((pointer.worldY + 16) / 32) * 32


        if(pointer.rightButtonDown()){

            if(this.canPlace){
                this.spawnBlock(null, {
                    sprite: blocksStore[this.currentItem].name, 
                    x: pointer.worldX, 
                    y: pointer.worldY
                })
                this.canPlace = false
                setTimeout(() => this.canPlace = true, 150)
            }
            
        } 
        if(pointer.leftButtonDown()){
            if(this.canDestroy){
                Game.io.emit('destroyBlock', {
                    x: pointer.worldX,
                    y: pointer.worldY,
                })
                this.canDestroy = false
                setTimeout(() => this.canDestroy = true, 250)
            }
        }
    
        
        if(this.player){
            this.player.update()
        }
        if(this.players.state){
            Object.entries(this.players.state).forEach(([id, state]) => {
                
                if(id !== Game.io.id){
                    let p = this.players.instances[id]
    
                    if(!p){
                        p = new Player(this, true, state.nick)
                        this.players.instances[id] = p
                    }
                    p.update(state.state)
                }
            })
    
        }
    }
}
