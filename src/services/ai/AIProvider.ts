import type { AIContext, ChatMessage } from './types';

export interface AIProvider {
    readonly name: string;
    chat(messages: ChatMessage[], context?: AIContext): Promise<string>;
}
