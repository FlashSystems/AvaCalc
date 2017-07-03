importScripts("libs/oolib.min.js")
importScripts("libs/fraction.min.js")
importScripts("ava.js")

var SimWorker = oo.Base({
	_expandModel(model) {
		var stp = new AvaStp();

		var devices = {};
		var services = {};
		var deviceIdMap = [];

		devices[model.stp.id] = stp.getRootDevice();
		services[model.stp.id] = stp.getRootService();

		// Create all devices
		model.devices.forEach((device) => {
			var deviceInstance = stp.newDevice(device.ava);
			devices[device.id] = deviceInstance;
			deviceIdMap[deviceInstance.id()] = device.id;

			// Create the services for each device
			device.services.forEach((service) => {				
				services[service.id] = deviceInstance.newService(service.name, service.capacity);
			});
		});		

		// Link devices and services
		model.links.forEach((link) => {
			if (link.type === "device") {
				devices[link.from].link(devices[link.to]);
			} else if (link.type === "service") {
				services[link.from].addChild(services[link.to]);
			}
		});

		return {
			'stp': stp,
			'deviceIdMap': deviceIdMap
		};
	},

	_init: function() {
	},

	run: function(model, progressCallback) {
		var expandedModel = this._expandModel(model);
		result = expandedModel.stp.calculate(progressCallback);

		// Map the internal IDs to Element-IDs
		spofIds = result.singlePointsOfFailure.map((id) => { return expandedModel.deviceIdMap[id]; });

		return {
			'availability': result.availability.valueOf(),
			'singlePointsOfFailure': spofIds
		}
	}
});

var simWorker = new SimWorker();

self.addEventListener('message', (e) => {
	postMessage({ 'event': 'start' });

	var lastProgress = 0;
	var result = simWorker.run(e.data, (num, cnt) => {
		var progress = Math.floor((num * 100) / cnt);
		if (progress > lastProgress) {
			postMessage({ 'event': "progress", 'progress': progress});
		}
	});
	postMessage({ 'event': "progress", 'progress': 100});

	postMessage({ 'event': "done", 'result': result });  	
  }, false);