
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state={currentItem: 0, items:blocksStore}
        Game.setCurrentItem = (i) => this.setCurrentItem(i)

        window.key
    }
    setCurrentItem(i){
        this.setState({currentItem: i})
    }
    
    render() {

        const { currentItem, items } = this.state
        return (
            <div className='app flex vertical padding-sm'>
                <Chat/>
                <div className='flex vertical align-items-center'>
                    <div className='items-bar'>
                        {
                            items.map(({name, url}, i) => {
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