// Keeping track of the chat room users
const users = []

const addUser = ({ id, username, room }) => {
    // Clean the data provided by the client
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()
    // Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }
    // Check for existing user in the same room
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })
    // Validate username
    if (existingUser) {
        return {
            error: 'Username is already in use!'
        }
    }
    // Store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    // Search for the user's ID in the users array
    const index = users.findIndex((user) => {
        return user.id === id
    })
    // If we found a match, remove the user from the array
    if (index !== -1) {
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    // Search for the user's ID in the users array and return the user
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    // Search for the user's ID inside the room and return the user
    return users.filter((user) => user.room === room)
}

module.exports = {
    addUser, 
    removeUser, 
    getUser, 
    getUsersInRoom
}