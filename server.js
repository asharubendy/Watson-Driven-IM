
//requires the nodeJS library for working with file paths
const path = require('path');
//requires the nodeJS Library HTTP, enbales use of the HTTP server and client
const http = require('http');
//requires the express dependancy (web framework)
const express = require('express');
//requires the socketIO dependancy (websockets framework)
const socketio = require('socket.io')
//calls the message formatting system from another file
const formatMessage = require('./utils/messages')
//sets express to the variable, means i can make changes without directly affecting the express dependancy
const app = express(); 
//creates http server and passes in the express framework - required so express can work with Socket.IO 
const server = http.createServer(app)
//creates the websocket server (socket io) and passes in the http server 
const io = socketio(server)
//sets the deafult static page for express by using the path.join function to get the top level directory and the public folder and combine them
app.use(express.static(path.join(__dirname, 'public')));
//sets a variable named server name to server, this is used for system messages like the greeting and disconnect messages.
const serverName = 'Server'

//tells socket io on a new connection assign a new websocket ID
io.on('connection', socket => {

    // greets the user 
    socket.emit('message', formatMessage(serverName, 'welcome to the chat'));
    //tells the users in the chat that there is a new user joining
    socket.broadcast.emit('message', formatMessage(serverName,'a user has joined the chat'));
    //tells the users in the chat that a user has left
    socket.on('disconnect', () => {
        io.emit('message', formatMessage(serverName,'a user has left the chat'))
    })

    socket.on('chatMessage', msg => {
        io.emit('message',formatMessage(serverName, msg))
    });
    
})


//looks to see if there is a environment variable named port and if not use port 3000
const PORT = process.env.PORT || 3000;
//listens for a port and will bind the server to it if there isn't 
server.listen(PORT, () => console.log(`Server Running on port ${PORT}`))
