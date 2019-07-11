
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state={currentItem: 0, players: [], showPlayers: false}
        Game.setCurrentItem = (i) => this.setCurrentItem(i)
        Game.updatePlayers = () => this.updatePlayers()

        window.addEventListener('keydown', e => {
            if(e.keyCode === 9){
                e.preventDefault()
                if(!this.state.showPlayers){
                    this.setState({showPlayers: true})
                }

            }
        })
        window.addEventListener('keyup', e => {
            if(e.keyCode === 9){
                e.preventDefault()
                if(this.state.showPlayers){
                    this.setState({showPlayers: false})
                }
            }
        })
    }
    setCurrentItem(i){
        this.setState({currentItem: i})
    }
    updatePlayers(){

        this.setState({players: Game.scene.allPlayers.getChildren()})
        
    }

    render() {

        const { currentItem, players, showPlayers } = this.state

        return (
            <div className='app flex vertical padding-sm'>
                {showPlayers && <div className='players shadow pointer-events-on'>
                    <h5 className='msg padding-sm'>Jogadores {players.length}</h5>
                    <div className='scroll'>
                        <ul className='twocolumns'>
                        {
                            players.map(player => {
                                return(
                                    <li className='padding-sm'>
                                        <h6 className='msg'>{player.nick}</h6>
                                    </li>
                                )
                            })
                        }
                        </ul>
                    </div>
                </div>}
                <Chat/>
                <h5 className='sender'>Jogadores: <span className='msg'>{players.length}</span></h5>
                <div className='flex vertical align-items-center'>
                    <div className='items-bar'>
                        {
                            blocksStore.map(({name, url}, i) => {
                                return(

                                    <div key={name} className={`item ${currentItem === i ? 'item-active' : ''}`}>
                                        <img src={url}/>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            </div>
        )
    }
}
const domContainer = document.querySelector('#display');
ReactDOM.render(React.createElement(App), domContainer);