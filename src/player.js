class Player {

    maxSpeed = 160
    jumpForce = 350

    input = {
        x: 0,
        y: 0
    }

    constructor(scene, remote=false){

        this.remote = remote

        this.rb = scene.physics.add.sprite(2048, 2000, 'dude')
        scene.physics.add.collider(this.rb, scene.blocks);
        this.rb.setBounce(0)
        this.rb.setCollideWorldBounds(true)
            
        if(!remote){
            
            setInterval(() => {

                const data = {
                    input: this.input,
                    position: {
                        x: this.rb.x,
                        y: this.rb.y
                    },
                    grounded: this.isGrounded()
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
                
            }catch(err) {
                
            }

        }else{
            this.input = GetAxisRaw()
            grounded = this.isGrounded()

            
        }

        if(this.input){

            const targetSpeed = this.maxSpeed * this.input.x

            if(grounded){

                this.rb.setVelocityX(targetSpeed)
            }else{
                this.addVelocityX(targetSpeed)
            }

            if(this.input.y > 0 && grounded){
                this.jump()
            }

            this.rb.anims.play(this.input.x === 0 ? 'turn' : (this.input.x > 0 ? 'right' : 'left'), true);

        }

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
    }
}