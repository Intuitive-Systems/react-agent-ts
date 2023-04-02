const iMessage = require("imessage");
export const foo = 1;

async function main() {
    var im = new iMessage();
    im
        .getAll()
        .keyword(["love", "happy"], ["sad", "hate"])
        .limit(10)
        .exec(function(err, rows) {
            console.log(rows);
        })

}

