//! Configure the Express server with socket.io
const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
// Create a socket.io instance and pass the Express server
const io = socketio(server)

// Fall back on the port 3000 if no env variable exists
const port = process.env.PORT || 3000

// Define the public directory path
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))

//!
//! TL;DR
//!
//! This file acts as the server, and chat.js acts as the client
//! - socket.emit sends an event to the client only
//! - socket.broadcast.emit sends an event to all clients except this one
//! - io.emit sends an event to all clients 
//! - callback() is used in this instance to aknowledge that the message has been received
//! - join allows the user to join using the room provided
//! - io.to.emit sends an event to the users of a room only, without being visible in other rooms
//! - socket.broadcast.to.emit sends an event to the users of a room only, without being visible in other rooms or us

// When a client connects
io.on('connection', (socket) => {
    console.log('New WebSocket connection')
    // Listen to events from the client
    // Join event
    socket.on('join', ({username, room}, callback) => {
        // Add the user to the users array (utils/users.js)
        const { error, user} = addUser({ id: socket.id, username, room })
        if (error) {
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message',  generateMessage('Admin', `${user.username} has joined!`))
        // Send an event with the list of all users to all users
        io.to(user.room).emit('roomData', {
            room: user.room, 
            users: getUsersInRoom(user.room)
        })
        callback()
    })
    // Send message event
    socket.on('sendMessage', (message, callback) => {
        // Retrieve the user
        const user = getUser(socket.id)
        // Uses the profanity filter (bad-words) npm module
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        // Acknowledge the callback from the client
        callback()
    })
    // Send Location Event
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
    // When a client disconnects
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message',  generateMessage(`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room, 
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log('Server is up on port ' + port)
})