import * as Events from "./events"

export enum Buttons { Add=0x01, Edit=0x02, Link=0x04, Delete=0x08, Clone=0x10 };

export class Popup extends Events.Events {
	private target: any;

	private container: JQuery<HTMLElement>;

	private addMenuItem(parent: JQuery<HTMLElement>, addClasses: string[], icon: string, eventName: string): void {
		let listItem = $('<li></li>');
		let iconElement = $("<i></i>", {
			'class': "mdi " + icon
		});

		let classString = addClasses.reduce((cssClassStr, cssClass) => { return cssClassStr + " " + cssClass; }, "btn-floating waves-effect waves-light");

		let link = $("<a></a>", {
			'class': classString,
			'on': {
				'click': () => { this.trigger(eventName, this.target); }
			}
		});

		link.append(iconElement);
		listItem.append(link);
		parent.append(listItem);
	}

	constructor (itemFlags: Buttons, target: any) {
		super();

		this.container = $("<div></div>", {
			'class': "options"
		});


		this.target = target;

		let options = $('<ul><ul>');

		if (itemFlags & Buttons.Add) this.addMenuItem(options, ["green"], "mdi-plus", "add");
		if (itemFlags & Buttons.Clone) this.addMenuItem(options, ["light-green"], "mdi-content-duplicate", "clone");
		if (itemFlags & Buttons.Edit) this.addMenuItem(options, ["lime", "darken-2"], "mdi-pen", "edit");
		if (itemFlags & Buttons.Link) this.addMenuItem(options, ["blue"], "mdi-link", "link");
		if (itemFlags & Buttons.Delete) this.addMenuItem(options, ["red"], "mdi-delete", "delete");

		this.container.append(options);

		$("body").append(this.container);
	}

	destroy(): void {
		// Fade out the container and dispose it off
		this.container.fadeOut({
			duration: 330,
			always: () => { this.container.remove(); }
		});
	}

	show(x: number, y: number): void {
		this.container.css("left", x.toString() + "px");
		this.container.css("top", y.toString() + "px");
		this.container.fadeIn({
			duration: 330
		});
	}

	width(): number {
		return this.container.width();
	}

	height(): number {
		return this.container.height();
	}
}