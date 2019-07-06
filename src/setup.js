var config = {
    type: Phaser.WEBGL,
    width: window.outerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 700 },
            debug: false
        }
    },
    scene: Main
};

var game = new Phaser.Game(config)
Game.instance = game

