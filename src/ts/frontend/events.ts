class Events {
	events: Events.EventMap;

	constructor() {
		this.events = {};
	}

	on(eventName: string, callback: Events.EventCallback)	{
		this.events[eventName] = callback;
	}

	off(eventName: string, callback: Events.EventCallback) {
		delete this.events[eventName];
	}

	get(eventName: string) {
		return this.events[eventName];
	}

	trigger(eventName: string, eventData?: any) {
		if (eventName in this.events) {
			this.events[eventName](eventData);
		}
	}

	pass(eventName: string, passToTarget: any) {
		let eventFunc: Events.EventCallback = passToTarget.get(eventName);
		if (eventFunc) this.events[eventName] = eventFunc;
	}
}

namespace Events {
	export type EventCallback = (eventData: any) => void;

	export class EventMap {
		[key: string]: EventCallback;
	}
}
