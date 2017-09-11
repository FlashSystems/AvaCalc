module CytoscapeApi {
	class CyNodeData {
		[key: string]: string | number;	//FIXME: I don't linke this construct. It's not explicit enough.

		public readonly name: string;
		public availability?: number;	//FIXME: I don't like the sound of this.
		public capacity?: number;	//FIXME: I don't like the sound of this.

		constructor(name: string = "") {
			this.name = name;			
		}
	}

	class CyInternal {
		static wrap(node: Cytoscape.Node): CyNode {
			switch (node.data("type")) {
				case "device":
					return new CyDevice(node);
				case "service":
					return new CyService(node);
				case "stp":
					return new CyStp(node);
				default:
					throw "Invalid node type";				
			}
		}
	}

	export class CyNode {
		protected node: Cytoscape.Node;
		protected data: CyNodeData;

		protected constructor(node: Cytoscape.Node | null) {
			this.node = node;

			if (node != null) {
				this.data = new CyNodeData(<string>(node.data("label")));
			} else {
				this.data = new CyNodeData();
			}
		}

		isBound(): boolean {
			return (this.node != null);
		}

		id(): string {
			if (this.node == null) throw "Can not get id of unbound node";
			return this.node.id();
		}

		boundingBox(): Cytoscape.BoundingBox {
			if (this.node == null) throw "Can not get bounding box of unbound node";
			return this.node.boundingBox();
		}

		getName(): string {
			return this.data.name;
		}

		getData(): CyNodeData {
			return this.data;
		}

		commit(node?: Cytoscape.Node) {
			if (node != null) this.node = node;
			if (this.node == null) throw "Commit can only be called without an argument for already bound nodes.";

			if (this.data.name.length === 0) throw "Please specify a device name.";
			this.node.data("label", this.data.name);		
		}

		protected getPercentage(value: number|string, errorMessage: string): number {
			if (!isFinite(<number>value) || isNaN(<number>value)) throw errorMessage;
			let numValue: number = parseFloat(<string>value);
			if (isNaN(numValue) || (numValue < 0) || (numValue > 100)) throw errorMessage;
			return numValue;
		}
	}

	class CyStp extends CyNode {
		constructor(node: Cytoscape.Node) {
			super(node);
		}
	}

	export class CyDevice extends CyNode {
		constructor(node?: Cytoscape.Node) {
			super(node);

			if (node != null) {
				this.data.availability = <number>(this.node.data("ava")) * 100;
			} else {
				this.data.availability = 99.5;
			}
		}

		enumServices(): CyService[] {
			return this.node.children("node[type = 'service']").map((entry: Cytoscape.Node): CyService => {
				return CyInternal.wrap(entry);
			});
		}

		commit(node?: Cytoscape.Node) {
			// First run all checks and then call super. There all checks will be run, too. After all checks are run
			// we're at the deepest recursion level and begin saving on our way out. This way if any check throws an
			// exception, nothing is saved.
			let availability: number = this.getPercentage(this.data.availability, "Availability must be between 0 and 100%.");		

			super.commit(node);		

			this.node.data("ava", availability / 100);
		}
	}

	export class CyService extends CyNode {
		constructor(node?: Cytoscape.Node) {
			super(node);

			if (node != null) {
				this.data.capacity = <number>(this.node.data("capacity"));
			} else {
				this.data.capacity = 100;
			}
		}

		commit(node?: Cytoscape.Node) {
			// First run all checks and then call super. There all checks will be run, too. After all checks are run
			// we're at the deepest recursion level and begin saving on our way out. This way if any check throws an
			// exception, nothing is saved.
			let capacity = this.getPercentage(this.data.capacity, "Capacity must be between 0 and 100%.");		

			super.commit(node);

			this.node.data("capacity", capacity);
		}
	}

	class ButtonsTypeMap {
		[nodeType: string]: Popup.Buttons;
	}

	export class CytoscapeApi extends Events {
		private cy: Cytoscape;
		private buttonsForType: ButtonsTypeMap = {};
		private linkSource: Cytoscape.Node | null = null;

		constructor() {
			super();

			this.cy = cytoscape({
				container: $("#cycanvas"),
				minZoom: 0.2,
				maxZoom: 5,
				style: [
					// Style for all nodes
					{
						selector: "node",
						style: {
							'label': "data(label)",
							'text-halign': "center",
							'text-valign': "bottom",
							'text-margin-y': "4px",
							'background-repeat': "no-repeat",
							'background-color': "#f0f0f0",
							'background-fit': "none",
							'background-image-opacity': 0.4,
							'border-width': "1px",
							'border-style': "solid",
							'border-color': "#a0a0a0"
						}
					},

					// Style for all edges
					{
						selector: "edge",
						style: {
						}
					},

					// Selected style for nodes
					{
						selector: "node:selected",
						style: {
							'border-width': "4px",
							'border-style': "double",
							'border-color': "#800000"
						}
					},

					// Selected style for edges
					{
						selector: "edge:selected",
						style: {						
						}
					},

					// Style for device nodes
					{
						selector: "node.device",
						style: {
							'shape': "rectangle",
							'background-image': [ "images/device.svg" ],
							'width': "12em",
							'min-width': "12em",
							'height': "4em",
							'min-height': "4em",
							'background-color': "#a0c0ff",
							'background-width': "80%",
							'background-height': "80%",						
							'compound-sizing-wrt-labels': "include",
						}
					},

					// Style for device nodes containing services.
					// This hides the background image.
					{
						selector: "$node.device > node",
						style: {
							'background-image': []
						}
					},

					// Edge style for device nodes
					{
						selector: "edge.device",
						style: {
							'curve-style': "haystack",
							'line-style': "dashed",
							'line-color': "#a0c0ff"
						}
					},

					// Style for service nodes
					{
						selector: "node.service",
						style: {
							'shape': "roundrectangle",
							'background-color': "#a0ffaf",
							'background-width': "2em",
							'background-height': "2em",
							'background-image': [ "images/service.svg" ],
							'width': "4em",
							'height': "2em"
						}
					},

					// Special style for STP service nodes
					{
						selector: "node.stp",
						style: {
							'shape': "roundrectangle",
							'background-color': "#ffa0af",
							'background-width': "2em",
							'background-height': "2em",
							'background-image': [ "images/stp.svg" ],
							'width': "4em",
							'height': "2em"
						}
					},

					// Edge style for service nodes
					{
						selector: "edge.service",
						style: {
							'curve-style': "bezier",
							'line-style': "solid",
							'line-color': "#004000",
							'arrow-scale': 2,
							'target-arrow-shape': "triangle",
							'target-arrow-color': "#004000"
						}
					},

					// Style for edges in the neighborhood of a selected device
					{
						selector: "edge.selneighborhood",
						style: {
							'line-color': "#800000",
							'target-arrow-color': "#800000"
						}
					},


					// Style for service nodes
					{
						selector: "node.service",
						style: {
							'shape': "roundrectangle",
							'background-color': "#a0ffaf",
							'background-width': "2em",
							'background-height': "2em",
							'background-image': [ "images/service.svg" ],
							'width': "4em",
							'height': "2em"
						}
					}
				]
			});

			this.cy.snapToGrid({
				'gridSpacing': 30,
				'lineDash': [ 2, 2 ],
				'zoomDash': true
			});

			// Define which buttons are shown on the popup for each node type.
			this.buttonsForType = {
				'device': Popup.Buttons.Add|Popup.Buttons.Edit|Popup.Buttons.Link|Popup.Buttons.Delete|Popup.Buttons.Clone,
				'service': Popup.Buttons.Edit|Popup.Buttons.Link|Popup.Buttons.Delete,
				'stp': Popup.Buttons.Link,
				'edge': Popup.Buttons.Delete
			};

			this.cy.on("select", "node", (event: Cytoscape.Event) => { this.onSelectNode(event) });
			this.cy.on("select", "edge", (event: Cytoscape.Event) => { this.onSelectEdge(event) });
			this.cy.on("unselect", "*", (event: Cytoscape.Event) => { this.onUnSelect(event) });
			this.cy.on("drag", "node", (event: Cytoscape.Event) => { this.onDrag(event) });
			this.cy.on("free", "node", (event: Cytoscape.Event) => { this.onFree(event) });
			this.cy.on("pan", (event: Cytoscape.Event) => { this.onPan(event) });
			this.cy.on("zoom", (event: Cytoscape.Event) => { this.onZoom(event) });
			this.cy.on("mouseover", (event: Cytoscape.Event) => { this.onMouseOver(event) });
			this.cy.on("mouseout", (event: Cytoscape.Event) => { this.onMouseOut(event) });
			this.cy.on("click", (event: Cytoscape.Event) => { this.onClick(event) });

			this.linkSource = null;
		}

		private getNodeLabels(filter: string): string[] {
			let nodeLabels: string[] = [];
			for (let node of this.cy.nodes(filter)) {
				let label = <string>node.data("label");
				if (nodeLabels.indexOf(label) == -1) nodeLabels.push(label);
			}

			return nodeLabels;
		}

		private getSelectedCyNode(): Cytoscape.NodeCollection {
			return this.cy.$(":selected");
		}

		private showPopup(target: Cytoscape.Node): void {
			// If we're linking at the moment. We can't show a popup.
			if (this.linkSource) return;

			// If there is already a popup for this target. Do nothing.
			if (target.scratch("popup")) return;

			// Get the bounding box of the element for positioning
			let absBBox = Tools.translateViewport($("#cycanvas"), target.renderedBoundingBox());

			// Popups for Nodes and Edges are different
			let popup = undefined;
			if (target.isNode()) {
				// Determin which buttons to show. If the type is unknown, show no popup.
				let buttonFlags = this.buttonsForType[target.data("type")];
				if (!buttonFlags) return;

				popup = new Popup.Popup(buttonFlags, CyInternal.wrap(target));
				target.scratch("popup", popup);

				// Position the popup		
				popup.show(absBBox.x1 + (absBBox.x2 - absBBox.x1 - popup.width()) / 2, absBBox.y1 - popup.height());
			} else {
				popup = new Popup.Popup(Popup.Buttons.Delete, CyInternal.wrap(target));
				target.scratch("popup", popup);

				// Position the popup		
				popup.show(absBBox.x1 + (absBBox.x2 - absBBox.x1 - popup.width()) / 2, absBBox.y1 + (absBBox.y2 - absBBox.y1 - popup.height()) / 2);			
			}

			// Link events
			popup.pass("add", this);
			popup.pass("link", this);
			popup.pass("edit", this);
			popup.pass("delete", this);
			popup.pass("clone", this);
		}

		private clearPopup(target: Cytoscape.Node): void {
			let popup = <Popup.Popup>target.scratch("popup");
			if (popup) popup.destroy();
			target.removeScratch("popup");
		}

		private isLinkable(src: Cytoscape.Node, dst: Cytoscape.Node): boolean {
			if (src && dst && src.isNode() && dst.isNode()) {
				let srcType = src.data("type");
				let dstType = dst.data("type");
				if (src.edgesTo(dst).length || dst.edgesTo(src).length) return false;			
				return ((srcType === dstType) || (srcType === "stp") || (srcType === "device" && (dstType === "stp"))) && (src.id() !== dst.id());
			} else {
				return false;
			}
		}

		addSTP(): void {
			this.cy.add({
				group: "nodes",
				classes: "stp",
				position: { x: this.cy.width() / 2, y: 30 },
				data: {
					'label': "Service Transfer Point",
					'type': "stp"
				}
			});		
		}

		addDevice(device: CyDevice): void {
			// If a device is cloned there may be a popp pending for this CyDevice instance.
			// The popup must be cleared before the instance is reattached to the new node or
			// the popup will be connected to the new node.
			if (device.isBound()) {
				let node = this.cy.getElementById(device.id());
				node.unselect();
				this.clearPopup(node);
			}

			let newDevice = this.cy.add({
				'group': "nodes",
				'classes': "device",
				'position': { x: this.cy.width() / 2, y: this.cy.height() / 2 },
				'data': {
					'type': "device"
				}
			});

			try {
				device.commit(newDevice);
			}
			catch (ex) {
				this.cy.remove(newDevice);
				throw ex;
			}
		}

		addService(parent: CyDevice, service: CyService): void {
			// See addDevice
			if (service.isBound()) {
				let node = this.cy.getElementById(service.id());
				node.unselect();
				this.clearPopup(node);
			}

			let parentBBox = parent.boundingBox();

			let newService = this.cy.add({
				'group': "nodes",
				'classes': "service",
				'position': { x: parentBBox.x1 + parentBBox.w / 2, y: parentBBox.y1 + parentBBox.h / 2 },
				'data': {
					'parent': parent.id(),
					'type': "service"
				}
			});

			try {
				service.commit(newService);
			}
			catch (ex) {
				this.cy.remove(newService);
				throw ex;
			}
		}

		getNodeById(id: string): CyNode {
			return CyInternal.wrap(this.cy.getElementById(id));
		}

		getNameCompletions(node: CyDevice | CyService): string[] {		
			if (node instanceof CyDevice) {
				return this.getNodeLabels("node[type = 'device']");
			}
			else if (node instanceof CyService) {
				return this.getNodeLabels("node[type = 'service']");
			}
			else
				throw "Invalid parameter";
		}

		deleteNode (node: CyNode): void	{
			this.getSelectedCyNode().unselect();
			this.cy.remove(this.cy.getElementById(node.id()));
		}

		getSelected(): CyNode[] {
			return this.getSelectedCyNode().map((entry: Cytoscape.Node) => {
				return CyInternal.wrap(entry)
			});
		}

		startLinking(startNode: CyNode): void {

			this.linkSource = this.cy.getElementById(startNode.id());
			$("#cycanvas").css("cursor", "no-drop");
			this.getSelectedCyNode().unselect();
		}

		save(): string {
			return JSON.stringify(this.cy.json().elements);
		}

		load(jsonData: string): void {
			this.getSelectedCyNode().unselect();
			this.linkSource = undefined;
			this.clear();
			this.cy.json({'elements': JSON.parse(jsonData) });
		}

		clear(): void {
			this.getSelectedCyNode().unselect();
			this.cy.elements().remove();
		}

		resetZoom(): void {
			this.cy.reset();
		}

		getModel(): Model.Model {
			let stp = new Model.Stp(this.cy.nodes('[type = "stp"]').first().id());
			let model = new Model.Model(stp);


			for (let node of this.cy.nodes('node[type = "device"]')) {
				let device = new Model.Device(node.id(), node.data("ava"));

				let services = node.children('node[type = "service"]').map((node: Cytoscape.Node) => {
					device.addService(new Model.Service(node.id(), node.data("label"), node.data("capacity")));
				});

				model.addDevice(device);
			}

			for (let edge of this.cy.edges()) {
				let linkType = edge.data("type");
				let linkTypeName: string = linkType.charAt(0).toUpperCase() + linkType.substr(1).toLowerCase();

				let edgeType = <Model.LinkType>Model.LinkType[<keyof typeof Model.LinkType>linkTypeName];

				model.addLink(new Model.Link(edgeType, edge.source().id(), edge.target().id()));
			}

			return model;
		}

		private onSelectNode(event: Cytoscape.Event) {
			if (this.linkSource != null) {
				let linkDestination = <Cytoscape.Node>(event.target);
				if (this.isLinkable(this.linkSource, linkDestination)) {
					let linkType = linkDestination.data("type");

					// If the destination is the STP use a device-link. Only devices can have
					// the STP as a destination. Services can not. This is blocked within _isLinkable.
					if (linkType == "stp") linkType = "device";

					this.cy.add({
						group: "edges",
						classes: linkType,
						data: {
							type: linkType,
							source: this.linkSource.id(),
							target: linkDestination.id()
						}
					});
				} else {
					this.trigger("error", "Invalid target selected.");				
				}

				// Clear the link source and reset the cursor
				$("#cycanvas").css("cursor", "");
				this.linkSource = null;
			} else {
				if (this.getSelectedCyNode().length != 1)
				{
					for (let node of this.getSelectedCyNode())  {
						this.clearPopup(node);
					}
				} else {			
					this.showPopup(<Cytoscape.Node>(event.target));
				}

				(<Cytoscape.Node>(event.target)).neighborhood().addClass("selneighborhood");				
			}
		}

		private onSelectEdge(event: Cytoscape.Event) {
			this.showPopup(<Cytoscape.Node>(event.target));
		}

		private onUnSelect(event: Cytoscape.Event) {
			this.clearPopup(<Cytoscape.Node>(event.target));

			// Remove all neighborhood markers.
			(<Cytoscape.Node>(event.target)).neighborhood().removeClass("selneighborhood");			
		}

		private onDrag(event: Cytoscape.Event) {
			this.clearPopup(<Cytoscape.Node>(event.target));
		}

		private onFree(event: Cytoscape.Event) {
			if (this.getSelectedCyNode().length == 1) {
				this.showPopup(this.getSelectedCyNode().first());
			}
		}

		private onPan(event: Cytoscape.Event) {
			this.getSelectedCyNode().unselect();
		}

		private onZoom(event: Cytoscape.Event) {
			this.getSelectedCyNode().unselect();
		}

		private onMouseOver(event: Cytoscape.Event) {
			if (this.linkSource != null) {		
				if ((event.target) && (event.target !== this.cy)) {				
					if (this.isLinkable(this.linkSource, <Cytoscape.Node>(event.target))) {
						$("#cycanvas").css("cursor", "alias");
					} else {
						$("#cycanvas").css("cursor", "no-drop");
					}
				}
			}
		}

		private onMouseOut(event: Cytoscape.Event) {
			if (this.linkSource) {			
				$("#cycanvas").css("cursor", "no-drop");
			}
		}

		private onClick(event: Cytoscape.Event) {
			if (this.linkSource != null) {		
				// Clicking on the background will cancel linking.
				if ((event.target) && (event.target === this.cy)) {
					this.linkSource = null;
					$("#cycanvas").css("cursor", "");
				}
			}			
		}
	}
}