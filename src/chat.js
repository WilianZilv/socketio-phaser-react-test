
class Chat extends React.Component {
    constructor(props) {
        super(props);
        
        this.state={messages: [], focus: false}
        Game.chatFocused = false
    }
    componentDidMount(){
        this.scrollBottom()

        Game.io.on('loadMessages', messages => this.setState({messages}))
        Game.io.on('newMessage', msg => {
            if(msg.id){
                if(msg.id === Game.io.id){
                    
                    Game.scene.player.setText(msg.msg, false)
                }else if(Game.scene.players.instances[msg.id]){
                    Game.scene.players.instances[msg.id].setText(msg.msg)
                }
            }
            const messages = this.state.messages
            messages.push(msg)
            this.setState({messages})
        })

        window.onkeydown = ev => {
            
            if(ev.keyCode === 13){
                if(!this.state.focus){

                    this.setFocus(true)

                }else{

                    this.setFocus(false)
                }
                if (this.input.value.length > 0){
                    
                    Game.io.emit('chat', {
                        sender: Game.username,
                        msg: this.input.value
                    })
                    this.input.value = ''

                }
            }
           
        }
    }
    setFocus(val){
        this.setState({focus: val})
        Game.chatFocused = val
        if(val){
            this.input.focus()
        }else{
            this.input.blur()
        }
    }
    componentDidUpdate(){
        this.scrollBottom()
    }
    scrollBottom(){
        this.chat.scrollTop = this.chat.scrollHeight
    }
    render() {

        return (
            <div className={`chat-container pointer-events-${this.state.focus ? 'on' : 'off'}`}>
                <div className='full chat' ref={ref => this.chat = ref}>
                    {this.state.messages.map(({sender, msg}, i) => {
                        return (
                            <div key={i} className=''>
                                <span className={'sender truncate ' + (sender == Game.username ? 'sender-me' : '')}>{sender}: <span 
                                className='msg truncate'>{msg}</span></span>
                            </div>
                        )
                    })}
                </div>
                <div className='flex'>
                    <input ref={ref => this.input = ref} className='full form-control-sm chat-input'/>
                </div>
            </div>
        )
    }
}