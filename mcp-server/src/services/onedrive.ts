/**
 * @fileoverview OneDrive API service for FODI MCP Server
 * @module src/services/onedrive
 */

import type { OneDriveFile, OneDriveResponse } from '@/types';
import config from '@/config';

export class OneDriveService {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseUrl = config.onedriveApiHost;
  }

  /**
   * Set OAuth access token
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: config.onedriveClientId,
      response_type: 'code',
      redirect_uri: config.onedriveRedirectUri,
      scope: 'offline_access Files.ReadWrite.All',
      response_mode: 'query',
    });

    return `${config.onedriveApiHost}/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{ access_token: string; refresh_token?: string }> {
    const response = await fetch(`${config.onedriveApiHost}/common/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.onedriveClientId,
        client_secret: config.onedriveClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.onedriveRedirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List files in a directory
   */
  async listFiles(path: string = '/'): Promise<OneDriveResponse> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const encodedPath = encodeURIComponent(path);
    const url = `${this.baseUrl}/v1.0/me/drive/root:/${encodedPath}:/children?$select=id,name,size,lastModifiedDateTime,webUrl,parentReference,file,folder&$orderby=name`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get file metadata
   */
  async getFile(fileId: string): Promise<OneDriveFile> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const response = await fetch(`${this.baseUrl}/v1.0/me/drive/items/${fileId}?$select=id,name,size,lastModifiedDateTime,webUrl,parentReference,file,folder`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get file: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search files
   */
  async searchFiles(query: string): Promise<OneDriveResponse> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const response = await fetch(`${this.baseUrl}/v1.0/me/drive/root/search(q='${query}')?$select=id,name,size,lastModifiedDateTime,webUrl,parentReference,file,folder`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to search files: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get file download URL
   */
  async getDownloadUrl(fileId: string): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const response = await fetch(`${this.baseUrl}/v1.0/me/drive/items/${fileId}/createLink`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'view',
        scope: 'anonymous',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get download URL: ${response.statusText}`);
    }

    const result = await response.json();
    return result.link.webUrl;
  }
}