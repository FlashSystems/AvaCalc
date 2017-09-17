declare namespace Cytoscape {
	interface BoundingBox {
		x1: number;
		x2: number;
		y1: number;
		y2: number;
		w: number;
		h: number;
	}

	interface Point {
		x: number;
		y: number;
	}

	interface Event {
		cy: Cytoscape;
		target: Node | Cytoscape;
		type: string;
		namespace: string;
		timeStamp: number;

		// Fields for only user input device events
		position?: Position;
		renderedPosition?: Position;
		originalEvent?: Event;

		// Fields for only layout events
		layout: string;

	}

	type EventCallback = (event: Event) => void;
	type PositioningCallback = (ele: Node, i: number) => Point;

	interface Node {
		id(): string;

		isParent(): boolean;
		children(selector?: string): NodeCollection;
		neighborhood(selector?: string): NodeCollection;

		data(key: string): any;
		data(key: string, value: any): void;
		scratch(key: string): any;
		scratch(key: string, value: any): void;
		removeScratch(key: string): void;

		unselect(): void;

		boundingBox(): BoundingBox;
		renderedBoundingBox(): BoundingBox;

		edgesTo(dst: Node): NodeCollection;
		source(): Node;
		target(): Node;

		position(): Point;
		position(point: Point): void;
		position(positioningCallback: PositioningCallback): void;
		shift(offset: Point): void;

		isNode(): boolean;
	}

	interface NodeCollection extends Array<Node>{
		unselect(): void;
		remove(): void;
		first(): Node;
		last(): Node;

		positions(point: Point): void;
		positions(positioningCallback: PositioningCallback): void;

		addClass(cssClass: string): void;
		removeClass(cssClass: string): void;
	}
}

declare interface Cytoscape {
	snapToGrid(config: any): void;
	add(nodeDefinition: any): Cytoscape.Node;

	$(selector: string): Cytoscape.NodeCollection;

	on(eventName: string, selector: string,  event: Cytoscape.EventCallback): this;
	on(eventName: string, event: Cytoscape.EventCallback): this;

	nodes(selector?: string): Cytoscape.NodeCollection;
	edges(selector?: string): Cytoscape.NodeCollection;
	getElementById(id: string): Cytoscape.Node;
	elements(): Cytoscape.NodeCollection;
	remove(node: Cytoscape.Node): void;
	reset(): void;

	width(): number;
	height(): number;

	json(): any;
	json(data: any): void;
}

declare function cytoscape(setupInfo: any) : Cytoscape;
