document.addEventListener('contextmenu', event => event.preventDefault());

function GetAxisRaw(){
    
    let vector2 = {
        x: 0,
        y: 0
    }

    const inputs = Game.scene.input.keyboard.createCursorKeys();
    const wasd = Game.scene.input.keyboard.addKeys('W,A,S,D')

        

    if(inputs.right.isDown || wasd.D.isDown){
        vector2.x = 1
    }
    if(inputs.left.isDown || wasd.A.isDown){
        vector2.x = -1
    }
    if(inputs.up.isDown || wasd.W.isDown){
        vector2.y = 1
    }
    if(inputs.down.isDown || wasd.S.isDown){
        vector2.y= -1
    }


    return vector2
}
function lerp (start, end, amt){
    return (1-amt)*start+amt*end
  }
function toGrid (pos) {
    pos.x = Math.floor(pos.x - pos.x % 32)
    pos.y = Math.floor(pos.y - pos.y % 32)
    return pos
}