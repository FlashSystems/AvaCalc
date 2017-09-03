class SimHandler extends Events {
	private worker: Worker;

	constructor() {
		super();

		this.worker = new Worker("js/simworker.js");
		$(this.worker).on("message", this.message.bind(this));
	}

	private message(e: JQuery.Event) {
		let data = (<MessageEvent>(e.originalEvent)).data;

		if (data.event === "start") {
			this.trigger("start");
		} else if (data.event === "progress") {
			this.trigger("progress", data.progress);
		} else if (data.event === "done") {
			this.trigger("done", <Model.SimResult>(JSON.parse(data.result, Model.inflater)));
		}
	}

	run(model: Model.Model) {
		this.worker.postMessage(JSON.stringify(model));
	}
}