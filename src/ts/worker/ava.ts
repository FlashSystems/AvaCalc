interface ChildTypeMap {	//CHECK
	[childName:string]: number
}

export type ProgressCallback = (done: number, count: number) => void;

export class Result {
	public readonly error?: string;
	public readonly availability: number;
	public readonly singlePointsOfFailure: number[];

	constructor(availability: number, singlePointsOfFailure: number[], error?: string) {
		this.error = error;
		this.availability = availability;
		this.singlePointsOfFailure = singlePointsOfFailure;
	}
}

class Ctx {
	public deviceMask: boolean[];
	public deviceAva: number[];
	public deviceNoSpof: boolean[];
	public visitedDevices: boolean[];
	public requiredSvcCount: number[];
	public activeSvcCount: number[];
	public activeSvcMap: ChildTypeMap[];
	public availability: number;
	public singlePointsOfFailure: number[];

	constructor(numDevices: number, numServices: number) {
		this.deviceMask = new Array(numDevices);
		this.deviceAva = new Array(numDevices);
		this.deviceNoSpof = new Array(numDevices);
		this.visitedDevices = new Array(numDevices);
		this.requiredSvcCount = new Array(numServices);
		this.activeSvcCount =  new Array(numServices);
		this.activeSvcMap = new Array(numServices);
		this.availability = 0;
		this.singlePointsOfFailure = [];

		// Initialize arrays
		this.deviceMask.fill(true);		
		this.requiredSvcCount.fill(0);
	}

	reset(): void {
		this.visitedDevices.fill(false);
		this.activeSvcCount.fill(0);
		for (let i = 0; i < this.activeSvcMap.length; i++) this.activeSvcMap[i] = {};	//fill can not be used because it fills all slots with the _same_ instance
	}
}

export class Service {
	private parents: Service[] = [];
	private serviceName: string;
	private serviceId: number;
	private capacityPct: number;
	// This letiable contains a map of child names and a counter with the number of children of this type.
	private childrenOfType: ChildTypeMap = {};

	constructor(stp: Stp, serviceName: string, capacityPct: number) {
		this.serviceName = serviceName;
		this.serviceId = stp.getNextServiceId();
		this.capacityPct = capacityPct;
	}

	addChild(newChild: Service): void {
		newChild.addParent(this);
	}

	addParent(newParent: Service): void {
		this.parents.push(newParent);
	}

	getName(): string {
		return this.serviceName;
	}

	id(): number {
		return this.serviceId;
	}

	getCapacityPct(): number {
		return this.capacityPct;
	}

	isActive(avaCtx: Ctx): boolean {
		return avaCtx.activeSvcCount[this.serviceId] > avaCtx.requiredSvcCount[this.serviceId];
	}

	/**
	 * Will be called once for every serviec instance at the start of the availability calcuation.
	 * This function will update the statistics information within the avaCtx structure that is used
	 * while computing the availability in the next step.
	 */
	initCtx(avaCtx: Ctx): void {		
		// Count the number of different services necessary to consider a device as up.
		// this._activeSvcMap.lengh is not used because we have to reset the map for every
		// simulation run and clearing every map entry is much more time consuming that just
		// throwing it away and string the count seperatly.
		for (let parent of this.parents) {
			if (!(this.serviceName in avaCtx.activeSvcMap[parent.id()])) {
				avaCtx.requiredSvcCount[parent.id()]++;
				avaCtx.activeSvcMap[parent.id()][this.serviceName] = 0;
			}
		}
	}

	private propagateActivation(avaCtx: Ctx): void {
		// The activation is only propagated if the activeSvcCount is more than the required svc count.
		// This takes into account hat the device must be activated too, leading to an activeSvcCount of one more
		// the the number of required services.
		if (this.isActive(avaCtx)) {
			for (let parent of this.parents) {
				parent.simulateContribute(avaCtx, this);
			}
		}
	}

	simulateDeviceActivate(avaCtx: Ctx): void {
		avaCtx.activeSvcCount[this.serviceId]++;

		this.propagateActivation(avaCtx);
	}

	simulateContribute(avaCtx: Ctx, childService: Service): void {
		let childServiceName = childService.getName();

		if (!(childServiceName in avaCtx.activeSvcMap[this.serviceId])) avaCtx.activeSvcMap[this.serviceId][childServiceName] = 0;

		if (avaCtx.activeSvcMap[this.serviceId][childServiceName] < 100) {
			avaCtx.activeSvcMap[this.serviceId][childServiceName] += childService.getCapacityPct();

			// If this service is now active (all dependencies are active) notify its parents
			if (avaCtx.activeSvcMap[this.serviceId][childServiceName] >= 100) {
				avaCtx.activeSvcCount[this.serviceId]++;

				this.propagateActivation(avaCtx);
			}
		}
	}
}

export class Device {
	private children: Device[] = [];
	private services: Service[] = [];
	private stpInstance: Stp;
	private ava: number;
	private deviceId: number;
	private selfRedundant: boolean;

	constructor(stp: Stp, ava: number, selfRedundant: boolean) {
		this.stpInstance = stp;
		this.ava = ava;
		this.selfRedundant = selfRedundant;
		this.deviceId = this.stpInstance.getNextDeviceId();
	}

	newDevice(ava: number, selfRedundant: boolean = false): Device {
		let newDevice = this.stpInstance.newDevice(ava, selfRedundant);
		this.link(newDevice);
		return newDevice;
	}

	newService(serviceName: string, capacityPct: number): Service {
		if (this.services.some(service => service.getName() === serviceName)) throw "Duplicate service name";

		let newService = new Service(this.stpInstance, serviceName, capacityPct);
		this.services.push(newService);
		return newService;
	}

	link(destination: Device, oneWay: Boolean = false): void {

		this.children.push(destination);

		if (!oneWay) destination.link(this, true);
	}

	id(): number {
		return this.deviceId;
	}

	/**
	 * Initializes the statistics information within the AvaCtx structure before a run of
	 * simulate. Uses avaCtx.visitedDevices.
	 */
	initCtx(avaCtx: Ctx): void {
		// If this device was already visited, just skip it.
		if (avaCtx.visitedDevices[this.deviceId]) return;
		avaCtx.visitedDevices[this.deviceId] = true;

		// Save the availability value for this device
		avaCtx.deviceAva[this.deviceId] = this.ava;

		// If the device is self redundant it can not be a single point of failure
		avaCtx.deviceNoSpof[this.deviceId] = this.selfRedundant;

		// Sort children that have services to the front.
		// This, in combination with aborting the search as soon as the STP gets activated,
		// shortens simulation time significantly.
		this.children.sort((a: Device, b: Device): number => {
			return (b.services.length - a.services.length);
		});

		for (let service of this.services) {
			service.initCtx(avaCtx);
		}

		for (let child of this.children) {
			child.initCtx(avaCtx);
		}
	}

	simulate(avaCtx: Ctx, rootService: Service): void {
		// If this device was already visited, just skip it.
		if (avaCtx.visitedDevices[this.deviceId]) return;
		avaCtx.visitedDevices[this.deviceId] = true;

		// If this device is enabled, it can contact it's subordinaries and use
		// their services.
		if (avaCtx.deviceMask[this.deviceId]) {
			// The device is active. Notify it's services.
			for (let service of this.services) {
				service.simulateDeviceActivate(avaCtx);
			}

			// If the root-service is active we're done. We exit out of the recursion.
			if ((rootService == null) || (!rootService.isActive(avaCtx))) {
				for (let childDevice of this.children) {
					// Walk the children of this device
					childDevice.simulate(avaCtx, rootService);
				}
			}
		}
	}
}

export class Stp {
	private numDevices: number = 0;
	private numServices: number = 0;
	private rootDevice: Device;
	private rootService: Service;

	constructor() {
		this.rootDevice = new Device(this, 1, true);
		this.rootService = new Service(this, ".", 100);
	}

	getNextDeviceId(): number {
		let deviceId = this.numDevices;
		this.numDevices++;
		return deviceId;
	}

	getNextServiceId(): number {
		let serviceId = this.numServices;
		this.numServices++;
		return serviceId;
	}

	getRootDevice(): Device {
		return this.rootDevice;
	}

	getRootService(): Service {
		return this.rootService;
	}

	newDevice(ava: number, selfRedundant: boolean): Device {
		if (isNaN(ava) || !isFinite(ava) || ava < 0 || ava > 1) throw "Invalid argument";
		let newDevice = new Device(this, ava, selfRedundant);
		return newDevice;
	}

	private recurseMask(avaCtx: Ctx, progressCallback: ProgressCallback, level: number, currentDeviceIdx: number, numThreads: number, outerVisitedMask: boolean[]): void {

		let thisVisitedMask: boolean[];
		let simulationResult: boolean;

		// If the mask disables a device that was not reached by the previous iteration the device can not influence
		// the current iteration. Because we're here we know that the previous iteration was successfull (good configuration)
		// and if we're now disabling an unreachable device this iteration will be successfull, too. No need to simulate it.
		// Just set the result to ok and continue.
		// This will not influence the SPOF detection because the first iteration gets an outerVisibilityMask with all nodes
		// set to visible.
		if (outerVisitedMask[currentDeviceIdx]) {
			// Initialize the AvaContext for the next run			
			avaCtx.reset();

			//console.log("== Simulation ==");
			//console.log(avaCtx.deviceMask);
			this.getRootService().simulateDeviceActivate(avaCtx); // The Root-Service (STP) has no associated device. It must be manually activated.
			this.getRootDevice().simulate(avaCtx, level == 0 ? null : this.getRootService());
			simulationResult = this.getRootService().isActive(avaCtx);

			// Do some sanity checks after the first run. This run will initialize the different parameters
			// of the avaCtx structure. Therefore we can do the test only after the first iteration.
			if (level === 0) {
				let visitedDevicesCount = 0;
				for (let visited of avaCtx.visitedDevices) {
					if (visited) visitedDevicesCount++;
				}

				if (visitedDevicesCount !== avaCtx.visitedDevices.length) throw "Not all devices are reachable from the STP. Please check the connections between the devices and the STP.";

				if (simulationResult === false) throw "Your design does not work with all devices available. Please check the capacity of the services.";
			}

			// If we're at level 1 and the simulation result is false we found a single point of failure
			if (!simulationResult && (level === 1)) {
				// Search for the disabled device and put it's number into the SPOF list.
				for (let i = 1; i < this.numDevices; i++) {
					if (!(avaCtx.deviceMask[i] || avaCtx.deviceNoSpof[i])) {
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

		// If the simulation was successfull, try disabling one
		// more device
		if (simulationResult) {
			let propability = 1;
			for (let i = 0; i < this.numDevices; i++) {
				if (avaCtx.deviceMask[i]) {
					// The device is enabled. Add the propability of this to occure to the over all propability.
					propability = propability * avaCtx.deviceAva[i];
				} else {
					// The device has failed. Add the propability of this happening (1 - ava) to the over all propability.
					propability = propability * (1 - avaCtx.deviceAva[i]);
				}
			}

			
			// Make sure that only the first thread is accounting for the probability of the "all well" configuration.
			// It must be calculated for every thread because it initializes some informations. But must only be
			// accumulated once!
			if ((level > 0) || (currentDeviceIdx == 1)) {
				// If the configuration is alive and well. Add the propability to the over all propability of a good configuration.
				avaCtx.availability = avaCtx.availability + propability;
			}

			// We only try disabling devices that where not already covered by the
			// outer loop (recursion). Therefore we start at currentDeviceIdx and not at 1.
			let stepSize = (level == 0) ? numThreads : 1;
			for (let i = currentDeviceIdx; i < this.numDevices; i+=stepSize) {
				// If a progress callback is set, inform him
				if (progressCallback) {
					progressCallback(i, this.numDevices);
				}

				if (avaCtx.deviceMask[i]) {
					avaCtx.deviceMask[i] = false;
					this.recurseMask(avaCtx, undefined, level + 1, i, numThreads, thisVisitedMask);
					avaCtx.deviceMask[i] = true;
				}
			}
		}
	}

	calculate(numThreads: number, thisThreadNumber: number, progressCallback?: ProgressCallback): Result {
		// Create a calculation context
		let avaCtx = new Ctx(this.numDevices, this.numServices);

		// Check the thread settings
		if (numThreads <= thisThreadNumber) throw "Invalid number of threads or thread number.";

		// Initialize context information used for init run.
		avaCtx.reset();

		// Initialize the avaCtx with statistics information
		this.rootDevice.initCtx(avaCtx);
	
		try
		{
			// Start the simulation by disabling device 1.
			// The Root-Device (ID 0) is always present and will never be disabled.
			this.recurseMask(avaCtx, progressCallback, 0, thisThreadNumber + 1, numThreads, (new Array(this.numDevices).fill(true)));

			return new Result(avaCtx.availability, avaCtx.singlePointsOfFailure);
		}
		catch (err)
		{
			return new Result(0, [], err);
		}
	}
}