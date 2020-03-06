import { Server, Socket } from 'socket.io'
import uuid from 'uuid'

export interface Controller {
  id: string;
  socketId: string;
  data: any;
}

export interface Client {
  id: string;
  socketId: string;
}

export default class ControllerManager {
  private controllers: Controller[];
  private clients: Client[];

  constructor(io: Server) {
    this.controllers = []
    this.clients = []
    io.on('connection', this.manageSocket)
  }

  private manageSocket = (socket: Socket) => {
    // client events
    socket.on('client-connection', this.onClientConnection(socket))
    socket.on('client-disconnection', this.onClientDisconnection(socket))
    // controller events
    socket.on('controller-disconnection', this.onControllerDisconnection(socket))
    socket.on('controller-connection', this.onControllerConnection(socket))
    socket.on('controller-update', this.onControllerUpdate(socket))
  }
  // client management
  private onClientConnection = (socket: Socket) => () => { }
  private onClientDisconnection = (socket: Socket) => () => { }
  // controller management
  private onControllerConnection = (socket: Socket) => () => { }
  private onControllerDisconnection = (socket: Socket) => () => { }
  private onControllerUpdate = (socket: Socket) => () => { }
}