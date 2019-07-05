class Player {

    maxSpeed = 160
    jumpForce = 350

    input = {
        x: 0,
        y: 0
    }
    floating = true
    nick = null

    constructor(scene, remote=false, nick=null){

        this.remote = remote
        this.nick = nick
        this.rb = scene.physics.add.sprite(1024, 1024, 'dude')
        this.rb.setDepth(1)
        this.cloud = scene.add.sprite(0,0, 'cloud')
        this.cloud.setDepth(2)
        this.cloud.alpha = 1
        this.rb.body.moves = false
        this.text = scene.add.text(0,0, nick, {fontSize: 12})
        this.text.fontWeight = 'bold'
        this.text.setShadow(0, 2, 'rgba(0,0,0,0.85)', 2);
        this.text.setOrigin(.5, .5)
        this.text.setWordWrapWidth(200, true)
        this.text.setDepth(3)

        scene.physics.add.collider(this.rb, scene.blocks);
        this.rb.setBounce(0)
        if(!remote){
            
            scene.input.keyboard.on('keydown-' + 'SPACE', () => {

                if(!Game.chatFocused){

                    this.floating = !this.floating
                    this.rb.body.moves = !this.floating
                    this.cloud.alpha = this.floating ? 1 : 0 
                }
         
            })
            setInterval(() => {

                const data = {
                    input: this.input,
                    position: {
                        x: this.rb.x,
                        y: this.rb.y
                    },
                    grounded: this.isGrounded(),
                    floating: this.floating
                }
                Game.io.emit('playerTick', data)
    
            }, 1000 / 60)
        }
    }
    
    update(data=null){
        
        let grounded = false

        if(data){
            this.data = data
            try{
                
                this.input = data.input
                grounded = data.grounded
                
                let { x, y } = data.position
   
                this.rb.x = lerp(this.rb.x, x, 0.25)
                this.rb.y = lerp(this.rb.y, y, 0.25)
                this.floating = data.floating
                this.rb.body.moves = !this.floating
                this.cloud.alpha = this.floating ? 1 : 0 

            }catch(err) {
                
            }

        }else{
            if(!Game.chatFocused){
                this.input = GetAxisRaw()
            }else{
                this.input = {
                    x: 0,
                    y: 0
                }
            
            }
            grounded = this.isGrounded()

            
        }
       
        if(this.input){
            
            const targetSpeed = this.maxSpeed * this.input.x

            if(!this.floating){
 
                if(grounded){
                    
                    this.rb.setVelocityX(targetSpeed)
                }else{
                    this.addVelocityX(targetSpeed)
                }
                
                if(this.input.y > 0 && grounded){
                    this.jump()
                }
                
                
            }else{

                const xvel = (this.maxSpeed / 25) * this.input.x
                const yvel = (this.maxSpeed / 25) * this.input.y

                this.rb.setVelocityX(xvel * 25)
                this.rb.setVelocityY(yvel * -25)
                this.rb.x += xvel
                this.rb.y -= yvel
            }
            this.rb.anims.play(this.input.x === 0 ? 'turn' : (this.input.x > 0 ? 'right' : 'left'), !this.floating);
                
        }
        follow(this.cloud, this.rb, 0, 28)
        follow(this.text, this.rb, 0, -32)

    }
    setText(text, showNick=true){
        const duration = (text.length + 20) * 75
        this.text.setText(text)
        if(this.textTimeout){
            clearTimeout(this.textTimeout)
        }
        this.textTimeout = setTimeout(() => {
            this.text.setText(showNick ? this.nick : null)
        }, duration);
    }
    jump(){
        this.rb.setVelocityY(-this.jumpForce)
    }
    addVelocityX(dir){

        const p = this.rb
        const curVel = p.body.velocity.x
        p.setVelocityX(lerp(curVel, dir, 0.05))
        
    }
    isGrounded(){
        return this.rb.body.touching.down
    }
    destroy(){
        this.rb.destroy()
        this.cloud.destroy()
        this.text.destroy()
    }
}