const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const userList = document.getElementById('users');


// Get username 
const { username} = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const socket = io();


// Join chatroom
socket.emit('joinRoom', { username });

// Get room and users
socket.on('roomUsers', ({ users }) => {
  
  outputUsers(users);
});

// Message from server
socket.on('message', message => {
  console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', e => {

  e.preventDefault();
  let msg = e.target.elements.msg.value;
    msg = msg.trim();
  
    if (!msg){
      return false;
    }

    socket.emit('chatMessage', (msg));
    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
 
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}


// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach(user=>{
    const li = document.createElement('li');
    li.innerText = user.username;
    userList.appendChild(li);
  });
 }
