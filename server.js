//requires the nodeJS library for working with file paths
const path = require('path');
//requires the nodeJS Library HTTP, enbales use of the HTTP server and client
const http = require('http');
//requires the express dependancy (web framework)
const express = require('express');
//requires the socketIO dependancy (websockets framework)
const socketio = require('socket.io');
///requires the Unirest dependancy (rapidApi requests)
var unirest = require('unirest');
//sets url and http request type as a variable
var req = unirest("POST", "https://phonetic-bad-word-filter.p.rapidapi.com/PhoneticCheck");
//moment gives the current time - node js doesn't have a native function for this
const moment = require('moment')
//requiring the NLU / IBM Watson Dependancies
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
// calling the authenticator method through Watson
const { IamAuthenticator } = require('ibm-watson/auth');
const { resolve } = require('path');

//new instance of the NLU (!!!! IMPORTANT !!!! REMEMBER TO CHANGE THIS BEFORE YOU GO LIVE YOU MELON - USE THE CREDENTIALS FILE AND HIDE IT)
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
//headers for rapidAPI request
req.headers({
	"content-type": "application/json",
	"x-rapidapi-key": "d7d577193emsh1553c6b1eda0b0bp13a438jsndcaaf1000fee",
	"x-rapidapi-host": "phonetic-bad-word-filter.p.rapidapi.com",
	"useQueryString": true
});
let finalMessage = ''

function filterGenerator(num){
  n = Math.floor(Math.random() * (3 - 0 + 1) + 0);

  angerFilterMessages = [`Please try to calm down`,`Take a deep breath, then try again`,`It's not that deep`,`Just try to put yourself in their shoes`];
  sadnessFilterMessages = [`Hey man, are you all good?`,`Everything alright?`,`Inhale, exhale`,`You'll be alright.`];
  disgustFilterMessages = [`Try not to be so mean`,`Don't look down on people like that`,`Chill out a little`,`Don't talk to people like that`];

  if (num == 1){
    return angerFilterMessages[n];
  }else if (num == 2){
    return sadnessFilterMessages[n];
  }else if (num == 3){
    return disgustFilterMessages[n];
  }else{
   return null; 
  } 
}
filteredMessage = " ";
//function that returns the username and text along with the time in an object, this is for formatting the message in css and html 
function formatMessage(username, text) {
      
  return {
    username,
    text,
    time: moment().format('h:mm a')
  };

}

//secondary filtering and filtered word list 

async function BackupFiltering(inputString){
  let string = "not changed"

  req.type("json");
  req.send({
    "phrase": inputString,
    "phoneticlist": [
      "nigger",

    ],
    "whitelist": [],
    "blacklist": [
      "nigga",
      "chink",
      "cracker",
      "curry muncher",
      "dot head",
      "golliwog",
      "gyppo",
      "heeb",
      "hairyback",
      "injun",
      "jap",
      "jigaboo",
      "raghead",
      "dickhead",
      "tranny",
      "bimbo",
      "dyke",
      "anal",
      "anus",
      "arse",
      "ass",
      "ass fuck",
      "ass hole",
      "assfucker",
      "asshole",
      "assshole",
      "bastard",
      "bitch",
      "black cock",
      "boong",
      "cock",
      "cockfucker",
      "cocksuck",
      "cocksucker",
      "coon",
      "coonnass",
      "cunt",
      "cyberfuck",
      "dick",
      "erect",
      "erection",
      "erotic",
      "fag",
      "faggot",
      "fuck",
      "fuck off",
      "fuck you",
      "fuckass",
      "fuckhole",
      "gook",
      "homoerotic",
      "hore",
      "mother fucker",
      "motherfuck",
      "motherfucker",
      "negro",
      "nigger",
      "nonce",
      "orgasm",
      "penis",
      "penisfucker",
      "piss off",
      "porn",
      "porno",
      "pornography",
      "pussy",
      "retard",
      "sadist",
      "sex",
      "sexy",
      "shit",
      "slut",
      "son of a bitch",
      "suck",
      "tits",
      "twat",
      "viagra",
      "whore"
    ]
  });
  // ADD ABBREVIATED SWEARWORDS!!!!!!
  req.end(function (res) {
   
    //console.log(res)
    if (res.error) throw new Error(res.error);
    //sets the string to the censored phrase
    string = res.body.censoredPhrase;

    //console.log("backup fliter activated")  
    // console.log(res.body);
    // console.log(string);
  });


  //Send response after the output is set
  return await new Promise((resolve) => {
    setTimeout(() => {
        // Resolve the promise
        console.log("Before Return: " + string);
        resolve(string);
    }, 500);
  });

} 


//the main filtering function, this is loaded inside of here since the output is a io.emit output, it needs to be inside of io.on connection, and it makes sense that its inside of the function that its called in.
function FilteringFunction(username,inputString){
  //Sets a string to output if there is an error
  const errormessage = 'sorry there has been an error processing your message'
  user = username;
  //sets a const to the input string
  const input = inputString;
  //resets the filtered message when the function is called to make sure the pipeline is clear
  let filteredMessage
  let finalMessage = ' ';
  //debugging
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

  //basic filtering - Planned features: 
  //add a way of adjusting the peramiters for the filtered message clientside 
  //possibly wrap the message in an object along with the clients preferences or
  // add it at the beginning of the message and devise a way of removing it from the string and then inputting it into the filtering system
  // positive reinforcement through suggestions of tone changes and recognition of that 
  //review sent message - offer alternate suggestions. 
  function setUser (username) {
    user = username;
  }

  if (arrayified[0][1] >= 0.5){
    //debugging
    console.log('very sad message')
    //sets the message to a filtered message
    filteredMessage = 'High levels of sadness detected - message removed - ' + filterGenerator(2); 
    io.emit('message',formatMessage(user,filteredMessage))
  } else if (arrayified[3][1] >= 0.5){
    console.log('very disgusted message')
    filteredMessage = 'high levels of disgusted detected - message removed - ' + filterGenerator(3);
    io.emit('message',formatMessage(user,filteredMessage))
  } else if (arrayified[4][1] >= 0.5){
    console.log('very angry message')
    filteredMessage = 'high levels of anger detected - message removed - ' + filterGenerator(1);
    io.emit('message',formatMessage(user,filteredMessage))
  } else {
    (async function(){
      filteredMessage = await BackupFiltering(input);
      console.log('Woo done!', filteredMessage)
      io.emit('message',formatMessage(user,filteredMessage))
    })()
  } 
  
  
  //emits the message from the server to the rest of the clients, formats the message into an object and filters the text inside it  
  
  //catch error async function 
}).catch(err => {
  //since js supports .catch, when watson NLU throws an error, it will default to this parameter.
  //console.log('error:', err.code);

  //emits a predefined message when an error occurs
  /*error logs:
  400 = no content or unsupported text language 
  422 = too little content 
  */
  if (err.code == 422){
    (async function(){
      filteredMessage = await BackupFiltering(input);
      console.log('Woo done!', filteredMessage)
      io.emit('message',formatMessage(user,filteredMessage))
    })()
  } else if (err.code == 400){
    if(input == ""){
      io.emit('message',formatMessage(serverName, "You have not entered any text!"))
    }else {
      io.emit('message',formatMessage(serverName, "We have detected a forien language, this server only supports English!"))
    }
    
  }else{
    io.emit('message', formatMessage(serverName, "There has been an error, please try again. Error Code: " + err.code))
  }
  
  //planned feature - add a backup method for filtering via keywords when a 422 error is given
  })
}
//sets the deafult static page for express by using the path.join function to get the top level directory and the public folder and combine them
app.use(express.static(path.join(__dirname, 'public')));
//sets a variable named server name to server, this is used for system messages like the greeting and disconnect messages.
const serverName = 'Server '
//tells socket io on a new connection assign a new websocket ID
let user = '';



io.on('connection', socket => {
  
  socket.emit('message', formatMessage(serverName, `welcome ${user} to the chat`));
  // greets the user  by emmiting a message to the websocket from the server
  //tells the users in the chat that there is a new user joining
  socket.broadcast.emit('message', formatMessage(serverName,`${user} has joined the chat`));
  //emits a message to the websockets, formatting the message 

  socket.on('disconnect', () => {
    io.emit('message', formatMessage(serverName,  `${user} has left the chat`))
  })

  socket.on('chatUsername', username => {
    user = username.username;
  })
  //when the server recieves a chat message, emit to other clients connected to the websocket
  socket.on('chatMessage', msg => { 
    //logs the starting point

    //logs the message
    console.log(msg)
    //calls the filtering function
    console.log(user)
    FilteringFunction(user, msg)
  });
    
})

//looks to see if there is a environment variable named port and if not use port 3000
const PORT = process.env.PORT || 3000;
//listens for a port and will bind the server to it if there isn't 
server.listen(PORT, () => console.log(`Server Running on port ${PORT}`))




