import { Server, Socket, Namespace } from "socket.io";
import mdns from "mdns";
import ip from "ip";
import { v4 as uuid } from "uuid";

export interface IController {
  id: string;
  socketId: string;
  data?: any;
}

export interface IScreen {
  id: string;
  socketId: string;
}

export interface IControllerManagerConfig {
  name?: string;
  namespace?: string;
  individualEvents?: boolean;
  updateFrequency?: number;
  autoStopTime?: number;
  port: number;
}

export default class ControllerManager {
  private io: Server;
  private name?: string;
  private port: number;
  public screenRoomName: string;
  public controllerRoomName: string;
  private screenRoom: Namespace;
  private screens: IScreen[];
  private controllerRoom: Namespace;
  private controllers: { [socketId: string]: IController };
  private individualEvents: boolean;
  private loop: NodeJS.Timeout | null;
  private shouldUpdate: boolean;
  private lastUpdate: number;
  private autoStopTime: number;
  private updateFrequency: number;

  constructor(io: Server, config?: IControllerManagerConfig) {
    // socket io initialization
    this.io = io;
    this.name = config?.name ?? undefined;
    this.port = config?.port ?? 8080;
    this.screenRoomName = config?.namespace
      ? `SCREEN_ROOM_${config.namespace}`
      : "SCREEN_ROOM";
    this.controllerRoomName = config?.namespace
      ? `CONTROLLER_ROOM_${config.namespace}`
      : "CONTROLLER_ROOM";
    this.screenRoom = io.of(this.screenRoomName);
    this.screens = [];
    this.controllerRoom = io.of(this.controllerRoomName);
    this.controllers = {};
    // global namespace
    this.io.on("connection", this.globalOnConnection);
    // screen namespace
    this.screenRoom.on("connection", this.screenOnConnection);
    // controller namespace
    this.controllerRoom.on("connection", this.controllerOnConnection);
    this.individualEvents = config?.individualEvents ?? false;
    // loop initialization
    this.loop = null;
    this.shouldUpdate = true;
    this.lastUpdate = 0;
    this.autoStopTime = config?.autoStopTime ?? Infinity;
    this.updateFrequency = config?.updateFrequency ?? 60;
  }
  // onConnects
  private globalOnConnection = (socket: Socket) => {
    // screen binding
    socket.on("screen-connection", this.onScreenConnection(socket));
    // controller binding
    socket.on("controller-connection", this.onControllerConnection(socket));
  };
  private screenOnConnection = (socket: Socket) => {
    socket.on("disconnect", this.onScreenDisconnection(socket));
  };
  private controllerOnConnection = (socket: Socket) => {
    socket.on("controller-update", this.onControllerUpdate(socket));
    socket.on("disconnect", this.onControllerDisconnection(socket));
  };
  // screen management
  private onScreenConnection = (socket: Socket) => () => {
    socket.join(this.screenRoomName);
    const id = uuid();
    this.screens.push({
      id,
      socketId: socket.id
    });
    socket.emit("connection-success", { id });
  };
  private onScreenDisconnection = (socket: Socket) => () => {
    socket.leave(this.screenRoomName);
    this.screens = this.screens.filter(screen => screen.socketId !== socket.id);
  };
  // controller management
  private onControllerConnection = (socket: Socket) => () => {
    socket.join(this.controllerRoomName);
    const id = uuid();
    const socketId = socket.id;
    this.controllers[socketId] = {
      id,
      socketId,
      data: null
    };
    socket.emit("connection-success", { id });
  };
  private onControllerDisconnection = (socket: Socket) => () => {
    socket.leave(this.controllerRoomName);
    delete this.controllers[socket.id];
  };
  private onControllerUpdate = (socket: Socket) => (data: any) => {
    const socketId = socket.id;
    this.controllers[socketId] = { ...this.controllers[socketId], data };
    this.shouldUpdate = true;
    if (this.individualEvents) {
      const { id, data } = this.controllers[socketId];
      this.screenRoom.emit(`controller-update-${socketId}`, { id, data });
    }
  };
  public start = () => {
    console.log("started");
    mdns.createAdvertisement(mdns.tcp("http"), this.port, {
      name: this.name,
      txtRecord: {
        type: "vroom-vroom-device",
        ip: ip.address(),
        port: this.port
      }
    });
  };
  // loop management
  public startLoop = () => {
    if (!this.loop) {
      this.loop = setInterval(this.loopHandler, this.updateFrequency);
    }
  };
  public stop = () => {
    this.loop && clearInterval(this.loop);
  };
  public update = () => {
    const controllerArray: Partial<
      IController
    >[] = Object.values(({ id, data }: IController) => ({ id, data }));
    this.screenRoom.emit("controller-update", controllerArray);
    this.shouldUpdate = false;
    this.lastUpdate = Date.now();
  };
  private loopHandler = () => {
    this.shouldUpdate && this.update();
    if (
      this.autoStopTime !== Infinity &&
      Date.now() - this.lastUpdate > this.autoStopTime
    ) {
      this.shouldUpdate = true;
      this.stop();
    }
  };
  // config management
  public setIndividualEvents = (value: boolean) =>
    (this.individualEvents = value);
  public setUpdateFrequency = (value: number) => {
    this.updateFrequency = value;
    if (this.loop) {
      this.stop();
      this.start();
    }
  };
  public enableAutoStopTime = (value: number) => (this.autoStopTime = value);
  public disableAutoStopTime = () => (this.autoStopTime = Infinity);
}
