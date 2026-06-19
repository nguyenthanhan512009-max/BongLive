const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const fs = require("fs");

const io = new Server(http);

app.use(express.static(__dirname));

const FILE = "chat.json";

let chatHistory = [];

// load chat từ file
if (fs.existsSync(FILE)) {
    chatHistory = JSON.parse(fs.readFileSync(FILE, "utf8"));
}

let online = 0;

io.on("connection", (socket) => {

    online++;
    io.emit("online", online);

    // gửi chat cũ
    socket.emit("load chat", chatHistory);

    // nhận chat mới
    socket.on("chat message", (data) => {

        const msg = {
            name: data.name,
            msg: data.msg,
            time: Date.now()
        };

        chatHistory.push(msg);
        console.log("saving chat...");

        fs.writeFileSync(FILE, JSON.stringify(chatHistory, null, 2), "utf8");

        io.emit("chat message", msg);
    });

    socket.on("disconnect", () => {
        online--;
        io.emit("online", online);
    });
});

// xoá chat sau 5 phút
setInterval(() => {
    const now = Date.now();
    chatHistory = chatHistory.filter(m => now - m.time < 5 * 60 * 1000);

    fs.writeFileSync(FILE, JSON.stringify(chatHistory, null, 2));
}, 30000);

const PORT = process.env.PORT || 8080;

http.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});