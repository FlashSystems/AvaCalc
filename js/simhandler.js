var SimHandler = Events({
	_init: function() {
		this.worker = new Worker("js/simworker.js");
		$(this.worker).on("message", this._message.bind(this));
	},

	_message: function(e) {
		var data = e.originalEvent.data;

		if (data.event === "start") {
			this.trigger("start");
		} else if (data.event === "progress") {
			this.trigger("progress", data.progress);
		} else if (data.event === "done") {
			this.trigger("done", data.result);
		}
	},

	run(model) {
		this.worker.postMessage(model);
	}
});