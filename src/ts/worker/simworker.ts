importScripts("fraction.min.js")
importScripts("ava.js")
importScripts("model.js")

namespace SimWorker {
	class StringMap<T> {
		[id: string]: T;
	}

	export class Worker {
		private expandModel(model: Model.Model) {
			let stp = new Ava.Stp();

			let devices: StringMap<Ava.Device> = {};
			let services: StringMap<Ava.Service> = {};
			let deviceIdMap: string[] = [];

			devices[model.stp.id] = stp.getRootDevice();
			services[model.stp.id] = stp.getRootService();

			// Create all devices
			for (let device of model.devices) {
				let deviceInstance = stp.newDevice(device.ava);
				devices[device.id] = deviceInstance;
				deviceIdMap[deviceInstance.id()] = device.id;

				// Create the services for each device
				for (let service of device.services) {				
					services[service.id] = deviceInstance.newService(service.name, service.capacity);
				}
			}
			
			// Link devices and services
			for (let link of model.links) {
				if (link.type === Model.LinkType.Device) {
					devices[link.from].link(devices[link.to]);
				} else if (link.type === Model.LinkType.Service) {
					services[link.from].addChild(services[link.to]);
				}
			}

			return {
				'stp': stp,
				'deviceIdMap': deviceIdMap
			};
		}

		constructor() {
		}

		run(model: Model.Model, progressCallback: Ava.ProgressCallback): Model.SimResult {
			let expandedModel = this.expandModel(model);
			let result = expandedModel.stp.calculate(progressCallback);

			// Map the internal IDs to Element-IDs
			let spofIds = result.singlePointsOfFailure.map((id) => { return expandedModel.deviceIdMap[id]; });

			return new Model.SimResult(result.availability, spofIds, result.error);
		}
	}
}

let simWorker = new SimWorker.Worker();

self.addEventListener('message', (e: MessageEvent) => {
	postMessage({ 'event': 'start' });	//FIXME: In klassen auslagern

	let model = <Model.Model>JSON.parse(e.data, Model.inflater);

	let lastProgress = 0;
	let result = simWorker.run(model, (num: number, cnt: number) => {
		let progress = Math.floor((num * 100) / cnt);
		if (progress > lastProgress) {
			postMessage({ 'event': "progress", 'progress': progress});
		}
	});
	postMessage({ 'event': "progress", 'progress': 100});

	postMessage({ 'event': "done", 'result': JSON.stringify(result) });  	
  }, false);