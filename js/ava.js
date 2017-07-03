'use strict';

var AvaService = oo.Base({
	_init: function(stp, serviceName, contributionPct) {
		this._parents = [];

		// This variable contains a map of child names and a counter with the number of children of this type.
		this._childrenOfType = {};

		this._serviceName = serviceName;
		this._serviceId = stp._getNextServiceId();
		this._contributionPct = contributionPct;
	},

	addChild: function(newChild) {
		if (!oo.isInterfaceOf(newChild, AvaService)) throw "Invalid argument";
		newChild.addParent(this.iface);
	},

	addParent: function(newParent) {
		if (!oo.isInterfaceOf(newParent, AvaService)) throw "Invalid argument";		
		this._parents.push(newParent);
	},

	getName: function() {
		return this._serviceName;
	},

	id: function() {
		return this._serviceId;
	},

	getContributionPct: function() {
		return this._contributionPct;
	},

	isActive: function(avaCtx) {
		return avaCtx.activeSvcCount[this._serviceId] > avaCtx.requiredSvcCount[this._serviceId];
	},

	/**
	 * Will be called once for every serviec instance at the start of the availability calcuation.
	 * This function will update the statistics information within the avaCtx structure that is used
	 * while computing the availability in the next step.
	 */
	initCtx: function(avaCtx) {		
		// Count the number of different services necessary to consider a device as up.
		// this._activeSvcMap.lengh is not used because we have to reset the map for every
		// simulation run and clearing every map entry is much more time consuming that just
		// throwing it away and string the count seperatly.
		this._parents.forEach((parent) => {
			if (!(this._serviceName in avaCtx.activeSvcMap[parent.id()])) {
				avaCtx.requiredSvcCount[parent.id()]++;
				avaCtx.activeSvcMap[parent.id()][this._serviceName] = 0;
			}
		});
	},

	_propagateActivation: function(avaCtx) {
		// The activation is only propagated if the activeSvcCount is more than the required svc count.
		// This takes into account hat the device must be activated too, leading to an activeSvcCount of one more
		// the the number of required services.
		if (this.isActive(avaCtx)) {
			this._parents.forEach((parent) => {
				parent.simulateContribute(avaCtx, this);
			})
		}
	},

	simulateDeviceActivate: function(avaCtx) {
		avaCtx.activeSvcCount[this._serviceId]++;

		this._propagateActivation(avaCtx);
	},

	simulateContribute: function(avaCtx, childService) {
		var childServiceName = childService.getName();

		if (!(childServiceName in avaCtx.activeSvcMap[this._serviceId])) avaCtx.activeSvcMap[this._serviceId][childServiceName] = 0;

		if (avaCtx.activeSvcMap[this._serviceId][childServiceName] < 100) {
			avaCtx.activeSvcMap[this._serviceId][childServiceName] += childService.getContributionPct();

			// If this service is now active (all dependencies are active) notify its parents
			if (avaCtx.activeSvcMap[this._serviceId][childServiceName] >= 100) {
				avaCtx.activeSvcCount[this._serviceId]++;

				this._propagateActivation(avaCtx);
			}
		}
	}
});

var AvaDevice = oo.Base({
	_init: function(stp, ava) {
		this._children = [];
		this._services = [];

		// This class can only be instanciated by calling newChild because
		// we want to pass a raw instance of AvaStp around and doing it without
		// a factory method whould leak the instance.
		if (!stp.isInstanceOf(AvaStp)) throw "Invalid argument";
		
		this._stpInstance = stp;
		this._ava = new Fraction(ava);
		this._deviceId = this._stpInstance._getNextDeviceId();
	},

	newDevice: function(ava) {
		var newDevice = this._stpInstance.newDevice(ava);
		this.link(newDevice);
		return newDevice;
	},

	newService: function(serviceName, contributionPct) {
		if (this._services.some(service => service.getName() === serviceName)) throw "Duplicate service name";

		var newService = new AvaService(this._stpInstance, serviceName, contributionPct);
		this._services.push(newService);
		return newService;
	},

	link: function(destination, oneWay = false) {
		if (!oo.isInterfaceOf(destination, AvaDevice)) throw "Invalid argument";

		this._children.push(destination);

		if (!oneWay) destination.link(this.iface, true);
	},

	id: function() {
		return this._deviceId;
	},

	/**
	 * Initializes the statistics information within the AvaCtx structure before a run of
	 * simulate. Uses avaCtx.visitedDevices.
	 */
	initCtx: function(avaCtx) {
		// If this device was already visited, just skip it.
		if (avaCtx.visitedDevices[this._deviceId]) return;
		avaCtx.visitedDevices[this._deviceId] = true;

		// Save the availability value for this device
		avaCtx.deviceAva[this._deviceId] = this._ava;

		this._services.forEach((service) => {
			service.initCtx(avaCtx);
		});

		this._children.forEach((child) => {
			child.initCtx(avaCtx);
		});
	},

	simulate: function(avaCtx) {
		// If this device was already visited, just skip it.
		if (avaCtx.visitedDevices[this._deviceId]) return;
		avaCtx.visitedDevices[this._deviceId] = true;

		// If this device is enabled, it can contact it's subordinaries and use
		// their services.
		if (avaCtx.deviceMask[this._deviceId]) {
			// The device is active. Notify it's services.
			this._services.forEach((service) => {
				service.simulateDeviceActivate(avaCtx);
			});

			this._children.forEach((childDevice) => {
				// Walk the children of this device
				childDevice.simulate(avaCtx);
			});
		}
	}
});

var AvaStp = oo.Base({
	_init: function() {
		this._numDevices = 0;
		this._numServices = 0;
		this._rootDevice = new AvaDevice(this, 1);
		this._rootService = new AvaService(this, ".");
	},

	_getNextDeviceId: function() {
		var deviceId = this._numDevices;
		this._numDevices++;
		return deviceId;
	},

	_getNextServiceId: function() {
		var serviceId = this._numServices;
		this._numServices++;
		return serviceId;
	},

	getRootDevice: function() {
		return this._rootDevice;
	},

	getRootService: function() {
		return this._rootService;
	},

	newDevice: function(ava) {
		if (isNaN(parseFloat(ava)) || !isFinite(ava) || ava < 0 || ava > 1) throw "Invalid argument";
		var newDevice = new AvaDevice(this, ava);
		return newDevice;
	},

	_recurseMask: function(avaCtx, progressCallback, level, currentDeviceIdx, outerVisitedMask) {

		var thisVisitedMask;

		// If the mask disables a device that was not reached by the previous iteration the device can not influence
		// the current iteration. Because we're here we know that the previous iteration was successfull (good configuration)
		// and if we're now disabling an unreachable device this iteration will be successfull, too. No need to simulate it.
		// Just set the result to ok and continue.
		// This will not influence the SOPF detection because the first iteration gets an outerVisibilityMask with all nodes
		// set to visible.
		if (outerVisitedMask[currentDeviceIdx]) {
			// Initialize the AvaContext for the next run			
			avaCtx.visitedDevices.fill(false);
			avaCtx.activeSvcCount.fill(0);
			for (var i = 0; i < this._numServices; i++) avaCtx.activeSvcMap[i] = {};	//fill can not be used because it fills all slots with the _same_ instance

			//console.log("== Simulation ==");
			//console.log(avaCtx.deviceMask);
			this.getRootDevice().simulate(avaCtx);
			this.getRootService().simulateDeviceActivate(avaCtx); // The Root-Service (STP) has no associated device. It must be manually activated.
			var simulationResult = this.getRootService().isActive(avaCtx);

			// If we're at level 1 and the simulation result is false we found a single point of failure
			if (!simulationResult && (level == 1)) {
				// Search for the disabled device and put it's number into the SPOF list.
				for (var i = 1; i < this._numDevices; i++) {
					if (!avaCtx.deviceMask[i]) {
						avaCtx.singlePointsOfFailure.push(i);
						break;
					}
				}
			}

			// Create a backup copy of the visited mask. The mask within the context is modified within the following loop.
			thisVisitedMask = avaCtx.visitedDevices.slice();
		} else {
			// The result can be predicted by the previous results. So reuse the outerVisibilityMask as the current one
			// and set the simulation result to true.
			simulationResult = true;
			thisVisitedMask = outerVisitedMask;
		}

		//console.log("Over all propability of this " + (simulationResult?"good":"bad") + " configuration: " + avaCtx.propability.toFraction());

		// If the simulation was successfull, try disabling one
		// more device
		if (simulationResult) {
			var propability = new Fraction(1);
			for (var i = 0; i < this._numDevices; i++) {
				if (avaCtx.deviceMask[i]) {
					// The device is enabled. Add the propability of this to occure to the over all propability.
					propability = propability.mul(avaCtx.deviceAva[i]);
				} else {
					// The device has failed. Add the propability of this happening (1 - ava) to the over all propability.
					propability = propability.mul((new Fraction(1)).sub(avaCtx.deviceAva[i]));
				}
			}

			// If the configuration is alive and well. Add the propability to the over all propability of a good configuration.
			avaCtx.availability = avaCtx.availability.add(propability);

			// We only try disabling devices that where not already covered by the
			// outer loop (recursion). Therefore we start at currentDeviceIdx and not at 1.
			for (var i = currentDeviceIdx; i < this._numDevices; i++) {
				// If a progress callback is set, inform him
				if (progressCallback) {
					progressCallback(i, this._numDevices);
				}

				if (avaCtx.deviceMask[i]) {
					avaCtx.deviceMask[i] = false;
					this._recurseMask(avaCtx, undefined, level + 1, i, thisVisitedMask);
					avaCtx.deviceMask[i] = true;
				}
			}
		}
	},

	calculate: function(progressCallback) {
		// Create a calculation context
		var avaCtx = {
			deviceMask: new Array(this._numDevices),
			deviceAva: new Array(this._numDevices),
			visitedDevices: new Array(this._numDevices),
			requiredSvcCount: new Array(this._numServices),
			activeSvcCount: new Array(this._numServices),		
			activeSvcMap: new Array(this._numServices),
			availability: new Fraction(0),
			singlePointsOfFailure: []
		};

		// Initialize global context information
		avaCtx.deviceMask.fill(true);		
		avaCtx.requiredSvcCount.fill(0);

		// Initialize context information used for init run.
		avaCtx.visitedDevices.fill(false);
		avaCtx.activeSvcCount.fill(0);
		for (var i = 0; i < this._numServices; i++) avaCtx.activeSvcMap[i] = {};	//fill can not be used because it fills all slots with the _same_ instance

		// Initialize the avaCtx with statistics information
		this._rootDevice.initCtx(avaCtx);
	
		// Start the simulation by disabling device 1.
		// The Root-Device (ID 0) is always present and will never be disabled.
		this._recurseMask(avaCtx, progressCallback, 0, 1, (new Array(this._numDevices).fill(true)));

		return {
			'availability': avaCtx.availability,
			'singlePointsOfFailure': avaCtx.singlePointsOfFailure
		};
	}
});