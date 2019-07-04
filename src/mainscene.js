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
        this.items = ['dirt', 'stone']
        this.blocksNet = {}
    }
    setCurrentItem(i){
        Game.setCurrentItem(i)
        this.currentItem = i;
        this.target.setTexture(this.items[this.currentItem])
    }
    changeItem(dir){
        let next = this.currentItem + dir
        if(next < 0){
            next = this.items.length - 1
        }else if(next >= this.items.length){
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
        this.physics.world.setBounds(0, 0, 4096, 4096, true, true, true, true);
        
        this.load.image('gridcell', 'src/assets/grid_cell.png')
        this.load.image('dirt', 'src/assets/block/dirt.png')
        this.load.image('stone', 'src/assets/block/stone.png')

        this.load.spritesheet('dude', 
            'src/assets/dude.png',
            { frameWidth: 32, frameHeight: 48 }
        );
        
        

    }
    create(){
        
        window.addEventListener('wheel', (e) => {
            const dir = e.deltaY / -100
            this.changeItem(dir)
        })
        
        this.target = this.add.sprite(0, 0, this.items[this.currentItem])

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
        Game.io.emit('ready')
    }
    
    update(){
        this.scale.resize(window.outerWidth, window.innerHeight)
        this.input.keyboard.clearCaptures()

        const pointer = this.input.activePointer
        this.target.x = (pointer.worldX - pointer.worldX % 32)
        this.target.y = (pointer.worldY - pointer.worldY % 32)


        if(pointer.rightButtonDown()){
            this.spawnBlock(null, {
                sprite: this.items[this.currentItem], 
                x: pointer.worldX, 
                y: pointer.worldY
            })
        } 
        if(pointer.leftButtonDown()){
            Game.io.emit('destroyBlock', {
                x: pointer.worldX,
                y: pointer.worldY,
            })
        }
    
        
        if(this.player){
            this.player.update()
        }
        if(this.players.state){
            Object.entries(this.players.state).forEach(([id, state]) => {
                
                if(id !== Game.io.id){
                    let p = this.players.instances[id]
    
                    if(!p){
                        p = new Player(this, true)
                        this.players.instances[id] = p
                    }
                    p.update(state)
                }
            })
    
        }
    }
}
