console.log("Hello, World!")

var mosca = require('mosca')

var ascoltatore = {
  //using ascoltatore
  type: 'mongo',        
  url: 'mongodb://localhost:27017/mqtt',
  pubsubCollection: 'ascoltatori',
  mongo: {}
};

var moscaSettings = {
  port: 1883,
  backend: ascoltatore,
  persistence: {
    factory: mosca.persistence.Mongo,
    url: 'mongodb://localhost:27017/mqtt'
  }
};

var server = new mosca.Server(moscaSettings);
server.on('ready', setup);

// fired whena  client is connected
server.on('clientConnected', function(client) {
  console.log('client connected', client.id);
});
 
// fired when a message is received
server.on('published', function(packet, client) {
    console.log('Published : ', packet.topic + " --- " + packet.payload);
    
    if(packet.topic.indexOf("input") !== -1){
        var clientID = packet.topic.substring(packet.topic.indexOf('/')+1)
        
        fs.writeFile(__dirname+"/"+clientID+"_input", packet.payload, function(err) {
            if(err) {
                return console.log(err);
            }

            console.log("The file was saved!");
        }); 
    }
    
});
 
// fired when a client subscribes to a topic
server.on('subscribed', function(topic, client) {
  console.log('subscribed : ', topic);
});
 
// fired when a client subscribes to a topic
server.on('unsubscribed', function(topic, client) {
  console.log('unsubscribed : ', topic);
});
 
// fired when a client is disconnecting
server.on('clientDisconnecting', function(client) {
  console.log('clientDisconnecting : ', client.id);
});
 
// fired when a client is disconnected
server.on('clientDisconnected', function(client) {
  console.log('clientDisconnected : ', client.id);
});

// fired when the mqtt server is ready
function setup() {
  console.log('Mosca server is up and running')
}
      
  
//REST API

var express = require('express');
var app = express();
var fs = require("fs");

var http = require('http');
var httpServ = http.createServer(app);

app.get('/open', function (req, res) {
    var message = {
      topic: '/d1',
      payload: '1', // or a Buffer
      qos: 0, // 0, 1, or 2
      retain: false // or true
    };

    server.publish(message, function() {
      console.log('done!');
    });
    
    res.end("DONE");
})

app.get('/close', function (req, res) {
    var message = {
      topic: '/d1',
      payload: '0', // or a Buffer
      qos: 0, // 0, 1, or 2
      retain: false // or true
    };

    server.publish(message, function() {
      console.log('done!');
    });
    
    res.end("DONE");
})

app.get('/output', function (req, res) {
    
    var id = req.param('id');
    var mode = req.param('mode');
    var pin = req.param('pin');
    var intensity = req.param('intensity');
    
    console.log( "Output API called: "+id+" "+mode+" "+pin+" "+intensity);
    
    var json_created = '{"mode": "'+mode+'", "pin": "'+pin+'", "intensity": "'+intensity+'"}'
    
    var message = {
      topic: 'output/'+id,
      payload: json_created, // or a Buffer
      qos: 0, // 0, 1, or 2
      retain: false // or true
    };

    server.publish(message, function() {
      console.log('done!');
    });
    
    res.end("DONE");
})

app.get('/read', function (req, res) {
    
    var user_id = req.param('id');
    console.log( "user_id: "+user_id );
    
    
    fs.readFile( __dirname + "/" + user_id+"_input", 'utf8', function (err, data) {
       console.log( data );
       res.end( data );
   });
})

server.attachHttpServer(httpServ);

httpServ.listen(3000);
