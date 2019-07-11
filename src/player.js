class Player extends Phaser.GameObjects.Sprite {

    maxSpeed = 1
    nick = null
    input = {
        x: 0,
        y: 0
    }

    constructor(scene, remote=false, nick=null, id=null){
        super(scene, 1024, 1024, 'dude')
        scene.add.existing(this)
        this.setDepth(1)

        this.cloud = scene.add.sprite(0,0, 'cloud')
        this.cloud.setDepth(2)
        this.text = scene.add.text(0,0, remote ? nick : null, {fontSize: 22, fontWeight: 'bold', fontFamily: 'impact'})
        this.text.setStroke('black', 6)
        this.text.setOrigin(.5, .5)
        this.text.setWordWrapWidth(350, true)
        this.text.setDepth(3)

        this.remote = remote
        this.nick = nick
        this.id = id

    }
    
    update(time, delta){

        if(this.remote){
            const me = Game.scene.playersState[this.id]
            if(me){
                this.input = me.state.input
                follow(this, me.state.position, 0, 0, .5)
            }

        }else{

            this.input = !Game.chatFocused ? GetAxisRaw() : {x: 0, y: 0}
            
            this.x += this.maxSpeed * this.input.x * delta
            this.y -= this.maxSpeed * this.input.y * delta
            
            
            this.sendPos()
        }

        this.anims.play(this.input.x === 0 ? 'turn' : (this.input.x > 0 ? 'right' : 'left'), false);

        follow(this.cloud, this, 0, 28)
        follow(this.text, this, 0, -32)

    }
    sendPos(){
        
        Game.io.emit('playerTick', {
            input: this.input,
            position: {x: this.x, y: this.y}
        })
    }
    changeText(text, showNick=true){
        const duration = (text.length + 20) * 50
        this.text.setText(text)
        if(this.textTimeout){
            clearTimeout(this.textTimeout)
        }
        this.textTimeout = setTimeout(() => {
            this.text.setText(showNick ? this.nick : null)
        }, duration);
    }
    disconnect(){
        this.destroy()
        this.cloud.destroy()
        this.text.destroy()
    }
}