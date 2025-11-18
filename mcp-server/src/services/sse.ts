/**
 * @fileoverview Server-Sent Events (SSE) service for real-time updates
 * @module src/services/sse
 */

import type { SseClient, FileChangeEvent } from '@/types';

export class SseService {
  private clients: Map<string, SseClient> = new Map();
  private pingInterval: number | null = null;

  constructor() {
    // Start ping interval to keep connections alive
    this.startPingInterval();
  }

  /**
   * Add a new SSE client
   */
  addClient(clientId: string, controller: ReadableStreamDefaultController<Uint8Array>): void {
    const client: SseClient = {
      id: clientId,
      controller,
      lastPing: Date.now(),
    };

    this.clients.set(clientId, client);

    // Send initial connection message
    this.sendToClient(clientId, {
      type: 'connected',
      timestamp: new Date().toISOString(),
      clientId,
    });
  }

  /**
   * Remove an SSE client
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.controller.close();
      } catch (error) {
        // Ignore errors when closing
      }
      this.clients.delete(clientId);
    }
  }

  /**
   * Send message to a specific client
   */
  sendToClient(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      const encoder = new TextEncoder();
      client.controller.enqueue(encoder.encode(message));
      client.lastPing = Date.now();
    } catch (error) {
      // Client disconnected, remove it
      this.removeClient(clientId);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(data: any): void {
    for (const clientId of this.clients.keys()) {
      this.sendToClient(clientId, data);
    }
  }

  /**
   * Notify clients about file changes
   */
  notifyFileChange(event: FileChangeEvent): void {
    this.broadcast({
      type: 'file_change',
      ...event,
    });
  }

  /**
   * Get connected clients count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Start ping interval to keep connections alive
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 seconds timeout

      for (const [clientId, client] of this.clients.entries()) {
        if (now - client.lastPing > timeout) {
          this.removeClient(clientId);
        } else {
          // Send ping
          this.sendToClient(clientId, {
            type: 'ping',
            timestamp: new Date().toISOString(),
          });
        }
      }
    }, 15000); // Check every 15 seconds
  }

  /**
   * Stop ping interval
   */
  stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    this.stopPingInterval();
    for (const clientId of this.clients.keys()) {
      this.removeClient(clientId);
    }
  }
}