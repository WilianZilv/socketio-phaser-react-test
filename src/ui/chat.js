
class Chat extends React.Component {
    constructor(props) {
        super(props);
        
        this.state={messages: [], focus: false}
    }
    componentDidMount(){
        this.scrollBottom()

        Game.io.on('loadMessages', messages => this.setState({messages}))
        Game.io.on('newMessage', msg => {
            const messages = this.state.messages
            messages.push(msg)
            this.setState({messages})
        })

        window.onkeydown = ev => {
            
            if(ev.keyCode === 13){
                if(!this.state.focus){

                    this.input.focus()
                    this.setState({focus: true})

                }else{

                    this.input.blur()
                    this.setState({focus: false})
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
                                <span className={'sender truncate ' + (sender == Game.username ? 'sender-me' : '')}>{sender}: <span className='msg truncate'>{msg}</span></span>
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