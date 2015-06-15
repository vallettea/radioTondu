'use strict';

var React = require('react');
var io = require('socket.io-client');

// var socket = io('http://localhost:4000');
var socket = io('http://192.168.1.9:4000');


var Application = React.createFactory(require('./Components/Application.js'));


socket.on('currentState', function (currentState) {

  currentState["toggleBroadcast"] = function(state){
      socket.emit("broadcasting", state);
    }

  React.render(new Application(currentState), document.getElementById("app"));
});


