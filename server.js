
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
//requiring the NLU / IBM Watson Dependancies
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
// calling the authenticator method through Watson
const { IamAuthenticator } = require('ibm-watson/auth');
//new instance of the NLU
const nlu = new NaturalLanguageUnderstandingV1({
  //sets NLU version
  version: '2020-08-01',
  //sets the authenticator to IAM, IBMS method of AUTH  
  authenticator: new IamAuthenticator({
  //Sets the API key
    apikey: 'IFFrSi2XqsDYkLlRETWyjoR3DnJnmkwufiLZwW7aP7nz',}),
  //sets the service URL
  serviceUrl: 'https://api.eu-gb.natural-language-understanding.watson.cloud.ibm.com/instances/392ccbd3-d571-4040-857a-198ce11f962a',});

//sets express to the const app, means i can make changes without directly affecting the express dependancy
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
    // greets the user  by emmiting a message to the websocket from the server
    socket.emit('message', formatMessage(serverName, 'welcome to the chat'));
    //tells the users in the chat that there is a new user joining
    socket.broadcast.emit('message', formatMessage(serverName,'a user has joined the chat'));
    //tells the users in the chat that a user has left by a function passed in
    socket.on('disconnect', () => {
    //emits a message to the websockets, formatting the message 
        io.emit('message', formatMessage(serverName,'a user has left the chat'))
    })

        //when the server recieves a chat message, start filtering
    socket.on('chatMessage', msg => {
      //logs the starting point
        console.log('im here')
        //logs the message
        console.log(msg)
        //the main filtering function, this is loaded inside of here since the output is a io.emit output, it needs to be inside of io.on connection, and it makes sense that its inside of the function that its called in.
        function FilteringFunction(inputString){
          //Sets a string to output if there is an error
          const errormessage = 'sorry there has been an error processing your message'
          //sets a const to the input string
          const input = inputString;
          //resets the filtered message when the function is called to make sure the pipeline is clear
          let filteredMessage = ''

          console.log('inside of the filtering function')
        //removes unnesaccary parameters from the response from watson NLU
        outputRemoveParam = (output) =>{
          delete output["status"];
          delete output["statusText"]               
          delete output["headers"];                 
          delete output["result"]["usage"];         
          delete output["result"]["language"];
          }
          //turns the returned results from the outputRemoveParam from an object into an array of keypairs, making it more readable for debugging as well as easier to work with code wise.  
        arrayify = (editedResults) =>{
          //sets an empty array
          let arrayified = [];
          //object.entries converts the object's parameter keypairs to an array
          arrayified = Object.entries(editedResults["result"]["emotion"]["document"]["emotion"])
          //returning the "arrayified" data
          return arrayified
        } 
        //sets the parameters for watson, potentially will add context depending on time but not sure how to factor this in yet
        let analyzeParams = {
          //feeds the text in via a variable
          'text': input,
          //setting the required params 
          'features': {
            'emotion': {
            }
          }
        };
        //calling for the NLU to analyse the text
        nlu.analyze(analyzeParams)
        //async call to wait for this to finsh, once it has feed the data into the function
        .then(analysisResults => {
        // calls the outputRemove Function
        outputRemoveParam(analysisResults);
        // Calls the Arrayified function    
        arrayified = arrayify(analysisResults);
        //logs the array to console for easy reading 
        console.log(arrayified[0][1] + ' ' + arrayified[0][0]) 
        console.log(arrayified[1][1] + ' ' + arrayified[1][0])
        console.log(arrayified[2][1] + ' ' + arrayified[2][0])
        console.log(arrayified[3][1] + ' ' + arrayified[3][0])
        console.log(arrayified[4][1] + ' ' + arrayified[4][0]) 
          //basic filtering (this will be changed later )
          if (arrayified[0][1] >= 0.5){
            console.log('very sad message')
            filteredMessage = 'veroy sad :('  
          } else if (arrayified[3][1] >= 0.5){
            console.log('very disgusted message')
            filteredMessage = 'ewwiwiwiwew gross'
          } else if (arrayified[4][1] >= 0.5){
           console.log('very angry message')
           filteredMessage = 'dont be angy >:('
          } else {filteredMessage = input} 
        //emits the message from the server to the rest of the clients, formats the message and filters it  
        io.emit('message',formatMessage(serverName,filteredMessage))
        
        }).catch(err => {
        //since js supports .catch, when watson NLU throws an error, it will default to this parameter.
         console.log('error:', err);
         io.emit('message',formatMessage(serverName,errormessage)) 
         /*error logs:
         400 = no content or unsupported text language 
         422 = too little content 
          */
          })
        }
        //calls the above filtering function
        FilteringFunction(msg)
    });
    
})

//looks to see if there is a environment variable named port and if not use port 3000
const PORT = process.env.PORT || 3000;
//listens for a port and will bind the server to it if there isn't 
server.listen(PORT, () => console.log(`Server Running on port ${PORT}`))

