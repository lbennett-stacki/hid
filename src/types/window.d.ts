import { ApiGateway } from '../preload';

declare global {
  interface Window {
    api: ApiGateway;
  }
}
