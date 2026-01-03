
export type DOMSignal = {
    signal:
    | "URL_CHANGED"
    | "DOCUMENT_CREATED"
    | "EDITOR_READY"
    | "CONTENT_INSERTED"
    | "TITLE_SET"
    | "UNEXPECTED_NAVIGATION"
    | "DOM_STALE"
    | "TAB_RELOADED"
    | "TIMEOUT"
    | "ERROR";

    url?: string;
    documentId?: string;
    title?: string;
    editorReady?: boolean;
    contentLength?: number;
    timestamp: number;
};
