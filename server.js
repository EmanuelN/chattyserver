// server.js

const express = require('express');
const WebSocket = require('ws')
const SocketServer = require('ws').Server;
const uuidv1 = require('uuid/v1');

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

// Keep track of colors for users
const userColors = {

}
const colors = ['#00008b',  '#458b00', '#006400', '#b23aee']

function randomColor(){
  return colors[Math.floor(Math.random() * colors.length)];
};

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
  console.log('Client connected');
  let userCount = {
    number: 0,
    type: 'userCount'
  };
  wss.clients.forEach((client)=>{
    userCount.number ++;
    client.send(JSON.stringify(userCount));
    console.log('sent', userCount);
  });

  ws.on('message', (message)=>{
    messageJSON = JSON.parse(message);
    messageJSON.id = uuidv1();
    console.log(messageJSON)
    if(!userColors[messageJSON.username]){
      userColors[messageJSON.username] = randomColor();
    }
    messageJSON.userColor = userColors[messageJSON.username]
    console.log(messageJSON)

    switch(messageJSON.type){
      case "postMessage":
        messageJSON.type = "incomingMessage"
      break;
      case "postNotification":
        messageJSON.type = "incomingNotification"
        const oldUser = messageJSON.content.oldUser;
        const newUser = messageJSON.content.newUser;
        if (userColors[oldUser]){
          userColors[newUser] = userColors[oldUser];
        }
        messageJSON.content = `${oldUser} has changed their name to ${newUser}`
      break;
    }
    wss.clients.forEach((client)=>{
      if (client !== ws || client.readyState === WebSocket.OPEN){
        client.send(JSON.stringify(messageJSON));
        console.log('sent ', messageJSON)
      }
    })
  });
  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected');
    userCount.number --;
    wss.clients.forEach((client)=>{
      client.send(JSON.stringify(userCount));
      console.log('sent', userCount);
    })
  });
});

