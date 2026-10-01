import type { ChatMessage } from './types';

export interface AIProvider {
    readonly name: string;
    chat(messages: ChatMessage[], context?: string): Promise<string>;
}
