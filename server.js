const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const fs = require("fs");
const axios = require("axios");

// 🔑 RapidAPI config
const API_KEY = "c39543eeaffb41c6bb23bae19ad1fff1";



const io = new Server(http);

const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

const FILE = "chat.json";

let chatHistory = [];

// load chat từ file
if (fs.existsSync(FILE)) {
    chatHistory = JSON.parse(fs.readFileSync(FILE, "utf8"));
}

let online = 0;

async function getMatches() {
    try {
        const res = await axios.get(
            "https://api.football-data.org/v4/matches?status=SCHEDULED",
            {
                headers: {
                    "X-Auth-Token": API_KEY
                }
            }
        );

        const matches = res.data?.matches || [];

        return matches.map(m => ({
            id: m.id,
            home: m.homeTeam?.name,
            away: m.awayTeam?.name,
            time: m.utcDate,
            status: m.status
        }));

    } catch (err) {
        console.log("API ERROR:", err.response?.data || err.message);
        return [];
    }
}
io.on("connection", (socket) => {

    online++;
    io.emit("online", online);

    // gửi chat cũ
    socket.emit("load chat", chatHistory);
    // ✅ GỬI CACHE NGAY, KHÔNG CALL API
    socket.emit("matches:update", cacheMatches);

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
let cacheMatches = [];
let lastFetch = 0;
const CACHE_TIME = 15 * 60 * 1000; // 15 phút



// xoá chat sau 5 phút
setInterval(() => {
    const now = Date.now();
    chatHistory = chatHistory.filter(m => now - m.time < 5 * 60 * 1000);

    fs.writeFileSync(FILE, JSON.stringify(chatHistory, null, 2));
}, 30000);


app.get("/api/matches", async (req, res) => {
    const data = await updateMatches();
    res.json(data);
});
async function updateMatches(force = false) {
    const now = Date.now();

    // ⛔ CHẶN spam API
    if (!force && now - lastFetch < CACHE_TIME) {
        return cacheMatches;
    }

    console.log("CALL API GET MATCHES...");

    const matches = await getMatches();

    if (matches && matches.length) {
        cacheMatches = matches;
        lastFetch = now;

        io.emit("matches:update", matches);
    }

    return cacheMatches;
}

// chạy ngay khi server start
updateMatches(true);


http.listen(8080, () => {
    console.log("Server running http://localhost:8080");
});