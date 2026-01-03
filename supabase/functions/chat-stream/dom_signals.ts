
export type DomSignalType =
    | "EDITOR_READY"
    | "DOCUMENT_CREATED"
    | "URL_CHANGED"
    | "CONTENT_INSERTED"
    | "UNEXPECTED_NAVIGATION"
    | "TIMEOUT"
    | "DOM_STALE";

export interface DomSignal {
    type: DomSignalType;
    timestamp: number;
    payload?: {
        url?: string;
        content_length?: number;
        editor_selector?: string;
    };
}

export interface DomSignalsReport {
    signals: DomSignal[];
    final_url: string;
    editor_detected: boolean;
    content_length: number;
}
