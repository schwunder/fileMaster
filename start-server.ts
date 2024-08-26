import { spawn, ChildProcess } from 'child_process';
import http from 'http';

function startServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const server = spawn('pnpm', ['dev']);

    server.stdout?.on('data', (data: Buffer) => {
      console.log(`Server output: ${data}`);
      if (data.toString().includes('Local:   http://localhost:5173/')) {
        resolve(server);
      }
    });

    server.stderr?.on('data', (data: Buffer) => {
      console.error(`Server error: ${data}`);
    });

    server.on('error', (error: Error) => {
      console.error(`Failed to start server: ${error}`);
      reject(error);
    });
  });
}

function waitForServer(
  url: string,
  timeout: number = 30000,
  interval: number = 1000
): Promise<void> {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const checkServer = () => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            retry();
          }
        })
        .on('error', retry);
    };

    const retry = () => {
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Server didn't respond within ${timeout}ms`));
      } else {
        setTimeout(checkServer, interval);
      }
    };

    checkServer();
  });
}

export { startServer, waitForServer };
