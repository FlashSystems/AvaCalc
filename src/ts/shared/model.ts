module Model {
	export enum LinkType { Device, Service };

	interface SerializerData {
		[key: string]: any;
	}

	export class Stp {
		public readonly id: string;

		constructor(id: string) {
			this.id = id;
		}

		toJSON(): SerializerData {
			return {
				"_class": "Stp",
				"id": this.id
			};
		}

		/**
		 * @brief Called by the inflater function to inflate this type of
		 * object.
		 * @details This function is called when JSON.parse is used to
		 * create a new model.
		 * 
		 * @param value Unserialized proto object.
		 */
		static fromJSON(value: SerializerData): Stp {
			return new Stp(value.id);
		}
	}

	export class Service {
		public readonly id: string;
		public readonly name: string;
		public readonly capacity: number;

		constructor(id: string, name: string, capacity: number) {
			this.id = id;
			this.name = name;
			this.capacity = capacity;
		}

		toJSON(): SerializerData {
			return {
				"_class": "Service",
				"id": this.id,
				"name": this.name,
				"capacity": this.capacity
			};
		}

		/**
		 * @brief Called by the inflater function to inflate this type of
		 * object.
		 * @details This function is called when JSON.parse is used to
		 * create a new model.
		 * 
		 * @param value Unserialized proto object.
		 */
		static fromJSON(value: SerializerData): Service {
			return new Service(value.id, value.name, value.capacity);
		}
	}

	export class Device {
		public readonly id: string;
		public readonly ava: number;

		private serviceList: Service[] = [];

		get services(): Service[] {
			return this.serviceList.slice();	// Return a copy of the list to prevent accidential changes.
		}

		constructor(id: string, ava: number) {
			this.id = id;
			this.ava = ava;
		}

		addService(service: Service): void {
			this.serviceList.push(service);
		}

		toJSON(): SerializerData {
			return {
				"_class": "Device",
				"id": this.id,
				"ava": this.ava,
				"services": this.serviceList
			};
		}

		/**
		 * @brief Called by the inflater function to inflate this type of
		 * object.
		 * @details This function is called when JSON.parse is used to
		 * create a new model.
		 * 
		 * @param value Unserialized proto object.
		 */
		static fromJSON(value: SerializerData): Device {
			let device = new Device(value.id, value.ava);

			for (let service of value.services) device.addService(service);

			return device;
		}
	}

	export class Link {
		public readonly type: LinkType;
		public readonly from: string;
		public readonly to: string;

		constructor(type: LinkType, from: string, to: string) {
			this.type = type;
			this.from = from;
			this.to = to;
		}

		toJSON(): SerializerData {
			return {
				"_class:": "Link",
				"type": this.type,
				"from": this.from,
				"to": this.to
			};
		}

		/**
		 * @brief Called by the inflater function to inflate this type of
		 * object.
		 * @details This function is called when JSON.parse is used to
		 * create a new model.
		 * 
		 * @param value Unserialized proto object.
		 */
		static fromJSON(value: SerializerData): Link {
			return new Link(value.type, value.from, value.to);
		}
	}

	export class Model {
		public readonly stp: Stp;

		private deviceList: Device[] = [];
		private linkList: Link[] = [];

		get devices(): Device[] {
			return this.deviceList.slice();
		}

		get links(): Link[] {
			return this.linkList.slice();
		}

		constructor(stp: Stp) {
			this.stp = stp;
		}

		addDevice(device: Device): void {
			this.deviceList.push(device);
		}

		addLink(link: Link): void {
			this.linkList.push(link);
		}

		toJSON(): SerializerData {
			return {
				"_class": "Model",
				"stp": this.stp,
				"devices": this.deviceList,
				"links": this.linkList
			};
		}

		/**
		 * @brief Called by the inflater function to inflate this type of
		 * object.
		 * @details This function is called when JSON.parse is used to
		 * create a new model.
		 * 
		 * @param value Unserialized proto object.
		 */
		static fromJSON(value: SerializerData): Model {
			let model = new Model(value.stp);

			for (let device of value.devices) model.addDevice(device);
			for (let link of value.links) model.addLink(link);

			return model;
		}
	}

	export class SimResult {
		public readonly error?: string;
		public readonly availability: number;
		public readonly singlePointsOfFailure: string[];

		constructor(availability: number, singlePointsOfFailure: string[], error?: string) {
			this.error = error;
			this.availability = availability;
			this.singlePointsOfFailure = singlePointsOfFailure;
		}

		
		/**
		 * @brief Combines two SimResult instances into one.
		 * @details Combines the two SimResult instances by adding their SPOFs and availability. If one of them is in an error state only this instance is returned without combining anything.
		 * @param input The SimResult instance that should be combinded with thins one.
		 * @return Returns a new SimResult instance containing the combination of this one and the input parameter. If one of the instances is in an error state, only this instance is returned.
		 */
		combine(input: SimResult): SimResult {
			if (this.error != null) {
				return this;
			} else if (input.error != null) {
				return input;
			} else {
				return new SimResult(this.availability + input.availability, this.singlePointsOfFailure.concat(input.singlePointsOfFailure));
			}
		}

		toJSON(): SerializerData {
			return {
				"_class": "Result",
				"availability": this.availability,
				"singlePointsOfFailure": this.singlePointsOfFailure,
				"error": this.error
			};
		}

		static fromJSON(value: SerializerData): SimResult {
			return new SimResult(value.availability, value.singlePointsOfFailure, value.error);
		}
	}

	export function inflater(key: string, value: any): Model | Link | Device | Service | Stp | SimResult | any {
		if ((value instanceof Object) && ("_class" in value)) {
			switch (value._class) {
				case "Model":
					return Model.fromJSON(value);
				case "Link":
					return Link.fromJSON(value);
				case "Device":
					return Device.fromJSON(value);
				case "Service":
					return Service.fromJSON(value);
				case "Stp":
					return Stp.fromJSON(value);
				case "Result":
					return SimResult.fromJSON(value);
			}
		} else {
			return value;
		}
	}
}