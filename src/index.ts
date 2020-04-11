import http from "http";
import socketIO from "socket.io";
import ControllerManager from "./ControllerManager";
import DoubleJoystick from "./DoubleJoystick";
const PORT = 8686;
const server = http.createServer();
server.listen(PORT);
const io = socketIO(server);

const controllerManager = new ControllerManager(io, {
  name: "VroomVroomDevice",
  port: PORT,
  controllers: [],
});

controllerManager.start();

export default ControllerManager;
