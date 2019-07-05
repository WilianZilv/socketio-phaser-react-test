
class Game {
    
}
Game.scene = null
Game.io = io();
Game.username = localStorage.getItem('username')

const promptNickName = () => {
    const username = prompt('Qual vai ser o seu nick?')
    if(username === null){
        return promptNickName()
    }else{
        if(username.length === 0){
            return promptNickName()
        }
    }
    localStorage.setItem('username', username)
    return username
}
if(Game.username === null){
    Game.username = promptNickName()
}
