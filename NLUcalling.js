//requiring the NLU / IBM Watson Dependancies
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
// calling the authenticator method through Watson
const { IamAuthenticator } = require('ibm-watson/auth');

const nlu = new NaturalLanguageUnderstandingV1({
  //sets NLU version
  version: '2020-08-01',
  //sets the authenticator to IAM, IBMS method of AUTH  
  authenticator: new IamAuthenticator({
  //Sets the API key
    apikey: 'GDhr6B-P0-zjN_NU_hAbqy-jNTYxRV3fuXrAIxnF-ahO',}),
  //sets the service URL
  serviceUrl: 'https://api.eu-gb.natural-language-understanding.watson.cloud.ibm.com/instances/392ccbd3-d571-4040-857a-198ce11f962a',});

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

//sets the string thats going to be analyised by the NLU
let inputString = 'As time fell thru life the gay dad was slowly fading away';

//sets the parameters for watson, potentially will add context depending on time but not sure how to factor this in yet
let analyzeParams = {
  //feeds the text in via a variable
  'text': inputString,
  //setting the required params 
  'features': {
    'emotion': {
    }
  }
};
//calling for the NLU to analyse the text
nlu.analyze(analyzeParams)
//async call to wait for this to finsh, one it has feed the data into the function
  .then(analysisResults => {
//calls the outputRemove Function
    outputRemoveParam(analysisResults);
//Calls the Arrayified function    
    arrayified = arrayify(analysisResults);
//logs the array to console for easy reading    
    console.log(arrayified);
    //From here it will decide wether or not to transmit the message depending on the emotional responses it detected within the next
  })
  .catch(err => {
    //since js supports .catch, when watson NLU throws an error, it will default to this parameter.
    console.log('error:', err);
    
    /*error logs:
    400 = no content or unsupported text language 
    422 = too little content 
    */

  });


  


 