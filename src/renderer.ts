enum Types {
  CHROME = 'chrome',
  NODE = 'node',
  ELECTRON = 'electron',
}

class Versions {
  constructor(private readonly types = Types) {}

  setVersions(versions: { [key: string]: string }) {
    Object.values(this.types).forEach((type) => {
      this.replaceText(`${type}-version`, versions[type]);
    });
  }

  private replaceText(selector: string, text: string) {
    const element = document.getElementById(selector);
    if (element) {
      element.innerText = text;
    }
  }
}

class Client {
  constructor(private readonly client: typeof window.api) {}

  on(channel: string, callback: (...args: any[]) => void) {
    this.client.on(channel, (event, args) => callback({ event, args }));
  }

  emit(channel: string, data?: any) {
    this.client.emit(channel, data);
  }
}

class App {
  constructor(
    private readonly client: Client,
    private readonly versions: Versions
  ) {}

  bootstrap() {
    this.client.on('versions', ({ event }) => {
      this.versions.setVersions(event);
    });
    this.client.emit('versions');

    this.client.on('devices', ({ event }) => {
      document.body.innerHTML += JSON.stringify(event);
    });
    this.client.emit('devices');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new App(new Client(window.api), new Versions());

  app.bootstrap();
});
