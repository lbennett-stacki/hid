import { contextBridge, ipcRenderer } from 'electron';
import { Exception } from './exception';

export interface Channels {
  [key: string]: boolean | undefined;
}

export interface ApiGateway {
  channels: { emit: Channels; on: Channels };
  isValidChannel(channel: string, direction: 'emit' | 'on'): boolean;
  emit(channel: string, data: any): void;
  on(channel: string, callback: (...args: any[]) => void): void;
}

export class UnauthorizedChannelException extends Exception {
  message = 'unauthorized channel';
}

export class ApiGatewayBuilder {
  static build(): ApiGateway {
    const gateway: ApiGateway = {
      channels: {
        emit: { versions: true, devices: true },
        on: { versions: true, devices: true },
      },

      isValidChannel(channel: string, direction: 'emit' | 'on'): boolean {
        return Boolean(gateway.channels[direction][channel]);
      },

      emit(channel: string, data: any) {
        if (gateway.isValidChannel(channel, 'emit')) {
          ipcRenderer.send(channel, data);
        } else {
          throw new UnauthorizedChannelException();
        }
      },

      on(channel: string, callback: (...args: any[]) => void) {
        if (gateway.isValidChannel(channel, 'on')) {
          ipcRenderer.on(channel, (event, ...args) => callback(...args));
        } else {
          throw new UnauthorizedChannelException();
        }
      },
    };

    return gateway;
  }
}

contextBridge.exposeInMainWorld('api', ApiGatewayBuilder.build());
