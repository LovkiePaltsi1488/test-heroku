"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const chalk = require("chalk");
const app = express();
const server = http.createServer(app);
const socketIO = require("socket.io");
const io = socketIO.listen(server);
const PORT = 5000;
const connections = [];
const rooms = {};
app.get("/", (req, res) => {
    res.end("<h1>Hello bruh</h1>");
});
server.listen(5000, () => {
    console.log(`Server has been started on ${chalk.rgb(93, 95, 255)("http://localhost:5000")}`);
});
io.sockets.on("connection", (socket) => {
    connections.push(socket);
    console.log(`Connected: ${connections.length} sockets connected`);
    socket.on("disconnect", (data) => {
        connections && connections.splice(connections.indexOf(socket), 1);
        rooms[socket.room] && rooms[socket.room].users.splice(rooms[socket.room].users.indexOf(socket), 1);
        console.log(`Disconnected: ${connections.length} sockets connected.`);
        if (rooms[socket.room] && rooms[socket.room].users && rooms[socket.room].users.length === 0) {
            delete rooms[socket.room];
        }
        rooms[socket.room] && rooms[socket.room].sockets.emit("send users", {
            usersList: rooms[socket.room].users.map((user) => ({
                id: user.uid,
                name: user.name,
            })),
        });
        rooms[socket.room] && rooms[socket.room].sockets.emit("new msg", {
            text: `${socket.name} left chat.`,
            infoId: socket.uid,
        });
    });
    socket.on("new client", ({ room, name, id }) => {
        socket.name = name;
        socket.room = room;
        socket.uid = id;
        if (socket.room in rooms) {
            rooms[socket.room] && rooms[socket.room].users.push(socket);
        }
        else {
            rooms[socket.room] = {
                users: [socket],
                sockets: {
                    emit: function (event, data) {
                        rooms[socket.room] && rooms[socket.room].users.forEach((user) => user.emit(event, data));
                    },
                },
            };
        }
        /* socket.emit("get id", { idUser: socket.uid }); */
        rooms[socket.room] && rooms[socket.room].sockets.emit("send users", {
            usersList: rooms[socket.room].users.map((user) => ({
                id: user.uid,
                name: user.name,
            })),
        });
        rooms[socket.room] && rooms[socket.room].sockets.emit("new msg", {
            text: `${socket.name} joined to chat.`,
            infoId: socket.uid,
        });
    });
    socket.on("send msg", ({ message }) => {
        rooms[socket.room] && rooms[socket.room].sockets.emit("new msg", {
            senderId: socket.uid,
            senderName: socket.name,
            text: message,
        });
    });
});
