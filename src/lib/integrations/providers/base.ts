import { IntegrationProvider } from '../types';

export abstract class BaseIntegrationProvider implements IntegrationProvider {
  abstract slug: string;
  abstract name: string;

  async connect(userId: string, credentials?: any): Promise<any> {
    throw new Error(`connect not implemented for ${this.name}`);
  }

  async disconnect(userId: string): Promise<void> {
    throw new Error(`disconnect not implemented for ${this.name}`);
  }

  async validate(credentials: any): Promise<boolean> {
    throw new Error(`validate not implemented for ${this.name}`);
  }

  async sync(userId: string): Promise<any> {
    throw new Error(`sync not implemented for ${this.name}`);
  }

  async healthCheck(userId: string): Promise<boolean> {
    throw new Error(`healthCheck not implemented for ${this.name}`);
  }
}
