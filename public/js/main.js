//calls the chat form by its id and inserts it into a const for easy access
const chatForm = document.getElementById('chat-form');
//calls the messages by its id and inserts it into a const for easy access
const chatMessages = document.querySelector('.chat-messages');
//requiring socket.io for the message functions 
const socket = io();

const username = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

console.log(`this is the username:${username}`)
// when the client recieves a message, output it to the page
socket.on('message', message => {
  //calling the function output message (which outputs it to the page)
  outputMessage(message);
  // Scroll down with each new message
  chatMessages.scrollTop = chatMessages.scrollHeight;
});





console.log(username)
// Message submit
chatForm.addEventListener('submit', e => {
//stops the message if its blank
  e.preventDefault();
  //gets the message from the value of the submit box
  let msg = e.target.elements.msg.value;
    //removes whitespace
    msg = msg.trim();
    //sends the message to the server to the other client
    socket.emit('chatMessage', msg, username);
    // Clear input
    e.target.elements.msg.value = '';
    //resets the browsers focus to the text box
    e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  console.log(message.username)
 if(message.username == 'Server'){
    const div = document.createElement('div');
    div.classList.add('Smessage');
    //creates the text element of the message for the username
    const p = document.createElement('p');
    p.classList.add('Smeta');
    p.innerText = message.username;
    //adds the messages time to the message
    p.innerHTML += `<span>${message.time}</span>`;
    div.appendChild(p);
    //creates a new paragraph text  and adds the user message to the message content 
    const para = document.createElement('p');
    para.classList.add('text');
    para.innerText = message.text;
    div.appendChild(para);
    document.querySelector('.Schat-messages').appendChild(div);
 } else {

  const div = document.createElement('div');
    div.classList.add('message');
    console.log(username);
    //creates the text element of the message for the username
    const p = document.createElement('p');
    p.classList.add('meta');
    p.innerText = message.username;
    //adds the messages time to the message
    p.innerHTML += `<span>${message.time}</span>`;
    div.appendChild(p);
    //creates a new paragraph text  and adds the user message to the message content 
    const para = document.createElement('p')
    para.classList.add('text');
    para.innerText = message.text;
    div.appendChild(para);
    document.querySelector('.chat-messages').appendChild(div);
 }
}
