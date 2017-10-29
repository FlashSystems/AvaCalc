import * as Events from "./events"
import * as Model from "../shared/model"

export class ProgressInfo {
	public readonly progress: number;
	public readonly activeWorkers: number;

	constructor(progress: number, activeWorkers: number) {
		this.progress = progress;
		this.activeWorkers = activeWorkers;
	}
}

class WorkerThread extends Events.Events {
	private worker: Worker;
	private readonly numWorkers: number;
	private readonly thisWorkerNumber: number;	
	private progress: number = 0;
	private simResult: Model.SimResult | null = null;

	constructor(numWorkers: number, thisWorkerNumber: number) {
		super();

		this.numWorkers = numWorkers;
		this.thisWorkerNumber = thisWorkerNumber;
		this.worker = new Worker("js/worker/loader.js");
		$(this.worker).on("message", this.onMessage.bind(this));
	}

	run(jsonModel: string): void {
		this.progress = 0;
		this.simResult = null;
		this.worker.postMessage({"model": jsonModel, "numThreads": this.numWorkers, "thisThreadNumber": this.thisWorkerNumber}); //FIXME: !!!
	}

	getProgress(): number {
		return this.progress;
	}

	getResult(): Model.SimResult | null {
		return this.simResult;
	}

	isRunning(): boolean {
		return this.simResult === null;
	}

	private onMessage(e: JQuery.Event) {
		let data = (<MessageEvent>(e.originalEvent)).data;

		if (data.event === "start") {
			this.simResult = null;
			this.trigger("start");			
		} else if (data.event === "progress") {
			this.progress = <number>data.progress;
			this.trigger("progress", this.progress);
		} else if (data.event === "done") {
			this.simResult = <Model.SimResult>(JSON.parse(data.result, Model.inflater));
			this.progress = 100;

			this.trigger("done", this.simResult);
		}		
	}
}

export class SimHandler extends Events.Events {
	private workers: WorkerThread[] = [];
	private numWorkers: number;
	private started: boolean = false;

	constructor() {
		super();

		if ("hardwareConcurrency" in window.navigator) {
			this.numWorkers = window.navigator.hardwareConcurrency;
			if (this.numWorkers < 1) this.numWorkers = 1;
		} else {
			console.log("Browser does not support determination of hardware concurrency. Using 1 worker only.")
			this.numWorkers = 1;
		}

		for (let i = 0; i < this.numWorkers; i++) {
			this.workers[i] = new WorkerThread(this.numWorkers, i);
			this.workers[i].on("start", this.onStart.bind(this));
			this.workers[i].on("progress", this.onProgress.bind(this));
			this.workers[i].on("done", this.onDone.bind(this));
		}
	}

	getNumWorkers(): number {
		return this.numWorkers;
	}

	private onStart(): void {
		if (!this.started) {
			this.trigger("start");
			this.started = true;
		}
	}

	private onProgress(): void {
		let progress = 0;
		let activeWorkers = 0;

		for (let worker of this.workers) {
			progress += worker.getProgress();
			if (worker.isRunning()) activeWorkers++;
		}
		progress = progress / this.numWorkers;

		this.trigger("progress", new ProgressInfo(progress, activeWorkers));
	}

	private onDone(): void {
		let done: boolean = true;
		for (let worker of this.workers) {
			if (worker.isRunning()) {
				done = false;
				break;
			}
		}

		if (done) {
			let result: Model.SimResult = null;

			for (let worker of this.workers) {
				if (result == null) {
					result = worker.getResult();
				} else {
					result = result.combine(worker.getResult());
				}
			}

			this.trigger("done", result);
			this.started = false;		
		}
	}

	run(model: Model.Model): void {
		this.started = false;

		let jsonModel = JSON.stringify(model);

		for (let i = 0; i < this.numWorkers; i++) {
			this.workers[i].run(jsonModel);
		}
	}
}