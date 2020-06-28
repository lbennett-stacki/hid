import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { devices, HID } from 'node-hid';

let mainWindow: BrowserWindow;

export class Api {
  constructor(
    private readonly window: BrowserWindow,
    private readonly client = ipcMain
  ) {}

  listen() {
    this.on('versions', (event, args) => {
      this.emit('versions', process.versions);
    });

    this.on('devices', (event, args) => {
      const list = devices();
      this.emit('devices', list);

      const deviceInfo = list.find((d) => {
        return (
          d.vendorId === 0xfeed &&
          d.productId === 0x1307 &&
          d.usagePage === 0xff60 &&
          d.usage === 0x61
        );
      });

      if (deviceInfo && deviceInfo.path) {
        try {
          const d = new HID(deviceInfo.path);
          d.write([0x00, ...'lol'.split('').map((s) => Buffer.from(s)[0])]);
          d.close();

          d.on('data', (data) => console.log(data.toString('hex')));
          d.on('error', console.error);
        } catch (e) {
          console.log(e);
        }
      }
    });
  }

  private on(channel: string, callback: (...args: any[]) => void) {
    ipcMain.on(channel, (event, args) => callback({ event, args }));
  }

  private emit(channel: string, data: any) {
    this.window.webContents.send(channel, data);
  }
}

export function createWindow() {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  mainWindow.webContents.openDevTools();

  const api = new Api(mainWindow);
  api.listen();
}

app.on('ready', () => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
