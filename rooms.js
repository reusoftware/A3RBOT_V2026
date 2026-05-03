const rooms = {};

function initRoom(room) {
    if (!rooms[room]) {
        rooms[room] = {
            welcome: false,
            quiz: null,
            cricket: null,
            masters: []
        };
    }
}

module.exports = { rooms, initRoom };