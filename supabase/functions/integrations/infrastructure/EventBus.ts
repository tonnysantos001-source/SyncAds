// =========================================================================
// MÓDULO DE INTEGRAÇÕES GLOBAL - BARRAMENTO DE COMANDOS E EVENTOS (Deno)
// =========================================================================

import {
  EventBusInterface,
  Command,
  Event,
  CommandHandler,
  EventHandler,
} from "../types.ts";

export class EventBus implements EventBusInterface {
  private commandHandlers: Map<string, CommandHandler>;
  private eventHandlers: Map<string, EventHandler[]>;

  constructor() {
    this.commandHandlers = new Map<string, CommandHandler>();
    this.eventHandlers = new Map<string, EventHandler[]>();
  }

  /**
   * Registra o único tratador para um comando específico (Ponto a Ponto)
   */
  registerCommandHandler(commandName: string, handler: CommandHandler): void {
    if (this.commandHandlers.has(commandName)) {
      throw new Error(
        `[EVENT-BUS] Command handler for "${commandName}" is already registered. Only one handler is allowed per command.`
      );
    }
    console.log(`[EVENT-BUS] Registered command handler for: ${commandName}`);
    this.commandHandlers.set(commandName, handler);
  }

  /**
   * Executa um comando e retorna o resultado da execução (Ponto a Ponto)
   */
  async sendCommand(command: Command): Promise<any> {
    const handler = this.commandHandlers.get(command.commandName);
    
    if (!handler) {
      throw new Error(
        `[EVENT-BUS] No command handler registered for command: "${command.commandName}"`
      );
    }

    console.log(
      `[EVENT-BUS] Dispatching command: ${command.commandName} at ${command.timestamp}`
    );
    
    return await handler(command);
  }

  /**
   * Assina um evento (Broadcast - Múltiplos subscribers)
   */
  subscribe(eventName: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventName) ?? [];
    handlers.push(handler);
    this.eventHandlers.set(eventName, handlers);
    console.log(`[EVENT-BUS] Subscribed to event: ${eventName} (Total: ${handlers.length})`);
  }

  /**
   * Dispara um evento para todos os assinantes em paralelo (Broadcast)
   */
  async publish(event: Event): Promise<void> {
    const handlers = this.eventHandlers.get(event.eventName) ?? [];
    
    if (handlers.length === 0) {
      console.log(`[EVENT-BUS] No subscribers registered for event: "${event.eventName}"`);
      return;
    }

    console.log(
      `[EVENT-BUS] Publishing event: ${event.eventName} to ${handlers.length} subscribers`
    );

    // Executa todos os handlers em paralelo. Tratamos erros individualmente para que falha de um não interrompa os outros.
    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (err: any) {
        console.error(
          `[EVENT-BUS] Error in event subscriber for "${event.eventName}":`,
          err.message
        );
      }
    });

    await Promise.all(promises);
  }
}
