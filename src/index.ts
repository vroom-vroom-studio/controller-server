import http from 'http'
import socketIO from 'socket.io'
import ControllerManager from './ControllerManager'

const PORT = 8080

const server = http.createServer()
server.listen(PORT)
const io = socketIO(server);

const cm = new ControllerManager(io)

export default ControllerManager