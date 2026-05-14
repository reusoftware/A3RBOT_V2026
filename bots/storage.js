const fs = require("fs");

function ensureFile(path, defaultData = []) {

    if (!fs.existsSync(path)) {

        fs.writeFileSync(
            path,
            JSON.stringify(defaultData, null, 2)
        );

    }

}

function loadJSON(path, defaultData = []) {

    ensureFile(path, defaultData);

    return JSON.parse(
        fs.readFileSync(path)
    );

}

function saveJSON(path, data) {

    fs.writeFileSync(
        path,
        JSON.stringify(data, null, 2)
    );

}

module.exports = {
    loadJSON,
    saveJSON
};
