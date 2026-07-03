declare module 'node-fetch' {
  import { RequestInfo, RequestInit, Response } from 'node-fetch';
  function fetch(url: RequestInfo, init?: RequestInit): Promise<Response>;
  export = fetch;
}