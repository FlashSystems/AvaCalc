module Tools {
	export interface Position {
		x: number;
		y: number;
	}

	export interface Box {
		x1: number;
		x2: number;
		y1: number;
		y2: number;
	}

	export interface EventMap {
		[eventName: string]: Event;
	}

	export function attachClick(parent: JQuery<Element>, clickEvents: JQuery.EventHandler<Element>): void {
		$.each(clickEvents, function(id, fc) {			
			parent.find("#" + id).off("click").on("click", fc);
		});
	}

	export function translateViewport<T extends Position | Box>(element: JQuery<Element>, posOrBox: T): T
	{
		let result:T = <T>{};

		let elementPos = element.position();

		if ((<Box>posOrBox).x1) (<Box>result).x1 = elementPos.left + (<Box>posOrBox).x1;
		if ((<Box>posOrBox).x2) (<Box>result).x2 = elementPos.left + (<Box>posOrBox).x2;
		if ((<Box>posOrBox).y1) (<Box>result).y1 = elementPos.top + (<Box>posOrBox).y1;
		if ((<Box>posOrBox).y2) (<Box>result).y2 = elementPos.top + (<Box>posOrBox).y2;
		if ((<Position>posOrBox).x) (<Position>result).x = elementPos.left + (<Position>posOrBox).x;
		if ((<Position>posOrBox).y) (<Position>result).y = elementPos.top + (<Position>posOrBox).y;

		return result;
	}
}