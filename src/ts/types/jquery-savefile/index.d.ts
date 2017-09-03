declare interface SaveFile {
	url(uri: string, filename: string): void;
	file(uri: string, filename: string, data: string): void;
}

declare interface JQueryStatic<TElement extends Node = HTMLElement> {
	savefile: SaveFile;
}