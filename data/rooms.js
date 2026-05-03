exports.rooms = {};

exports.initRoom = (room) => {
    if (!exports.rooms[room]) {
        exports.rooms[room] = {
            welcome: false,
            masters: [],
            quiz: null,
            cricket: null
        };
    }
};
