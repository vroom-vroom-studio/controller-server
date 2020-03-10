import http from "http";
import socketIO from "socket.io";
import ControllerManager from "./ControllerManager";

const PORT = 8080;
const server = http.createServer();
server.listen(PORT);
const io = socketIO(server);

const controllerManager = new ControllerManager(io, {
  name: "VroomVroomDevice",
  port: PORT
});

controllerManager.start();

export default ControllerManager;
