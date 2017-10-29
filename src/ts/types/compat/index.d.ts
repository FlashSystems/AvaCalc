/*
 * Interface declarations that should be within TypeScript. But currently are not.
 * Reconsult this file on every TypeScript upgrade and replace everything that is now
 * natively supported. With the native classes and interfaces.
 */
declare interface FileReaderEventTarget extends EventTarget {
    result: string;
}

declare interface FileReaderEvent extends Event {
    target: FileReaderEventTarget;
    getMessage(): string;
}