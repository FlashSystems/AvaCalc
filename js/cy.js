'use strict';

var CyNode = oo.Base({
	_init: function(node) {
		this._node = node;

		if (node) {
			this._data = {
				'name': node.data("label")
			};
		} else {
			this._data = {
				'name': ""
			};
		}
	},

	id: function() {
		if (!this._node) throw "Can not get id of unbound node";
		return this._node.id();
	},

	boundingBox: function() {
		if (!this._node) throw "Can not get bounding box of unbound node";
		return this._node.boundingBox();
	},

	getName: function() {
		return this._data.name;
	},

	getData: function() {
		return this._data;
	},

	commit: function(node) {
		if (node) this._node = node;
		if (!this._node) throw "Commit can only be called without an argument for already bound nodes.";

		if (this._data.name.length === 0) throw "Please specify a device name.";
		this._node.data("label", this._data.name);		
	},

	_getPercentage: function(value, errorMessage) {
		if (!isFinite(value) || isNaN(value)) throw errorMessage;
		var numValue = parseFloat(value);
		if (isNaN(numValue) || (numValue < 0) || (numValue > 100)) throw errorMessage;
		return numValue;
	}
});

var CyStp = CyNode({
});

var CyDevice = CyNode({
	_init: function(node) {
		if (node) {
			this._data.availability = this._node.data("ava") * 100;
		} else {
			this._data.availability = 99.5;
		}
	},

	commit: function(node) {
		// First run all checks and then call _super. There all checks will be run, too. After all checks are run
		// we're at the deepest recursion level and begin saving on our way out. This way if any check throws an
		// exception, nothing is saved.
		var availability = this._getPercentage(this._data.availability, "Availability must be between 0 and 100%.");		

		this._super("commit", node);		

		this._node.data("ava", availability / 100);
	}
});

var CyService = CyNode({
	_init: function(node) {
		if (node) {
			this._data.capacity = this._node.data("capacity");
		} else {
			this._data.capacity = 100;
		}
	},

	commit: function(node) {
		// First run all checks and then call _super. There all checks will be run, too. After all checks are run
		// we're at the deepest recursion level and begin saving on our way out. This way if any check throws an
		// exception, nothing is saved.
		var capacity = this._getPercentage(this._data.capacity, "Capacity must be between 0 and 100%.");		

		this._super("commit", node);		

		this._node.data("capacity", capacity);
	}
});

var CytoscapeApi = Events({
	_init: function() {
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
						"text-margin-y": "4px",
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
			]
		});

		this.cy.snapToGrid({
			'gridSpacing': 30,
			'lineDash': [ 2, 2 ],
			'zoomDash': true
		});

		// Define which buttons are shown on the popup for each node type.
		this._buttonsForType = {
			'device': POPUP_ADD|POPUP_EDIT|POPUP_LINK|POPUP_DELETE,
			'service': POPUP_EDIT|POPUP_LINK|POPUP_DELETE,
			'stp': POPUP_LINK,
			'edge': POPUP_DELETE
		};

		this.cy.on("select", "node", (event) => { this._onSelectNode(event) });
		this.cy.on("select", "edge", (event) => { this._onSelectEdge(event) });
		this.cy.on("unselect", "*", (event) => { this._onUnSelect(event) });
		this.cy.on("drag", "node", (event) => { this._onDrag(event) });
		this.cy.on("free", "node", (event) => { this._onFree(event) });
		this.cy.on("pan", (event) => { this._onPan(event) });
		this.cy.on("zoom", (event) => { this._onZoom(event) });
		this.cy.on("mouseover", (event) => { this._onMouseOver(event) });
		this.cy.on("mouseout", (event) => { this._onMouseOut(event) });

		this._linkSource = undefined;
	},

	_getNodeLabels: function(filter) {
		var nodeLabels = [];
		this.cy.nodes(filter).forEach((node) => {
			var label = node.data("label");
			if (nodeLabels.indexOf(label) == -1) nodeLabels.push(label);
		});

		return nodeLabels;
	},

	addSTP: function() {
		this.cy.add({
			group: "nodes",
			classes: "stp",
			position: { x: this.cy.width() / 2, y: 30 },
			data: {
				'label': "Service Transfer Point",
				'type': "stp"
			}
		});		
	},

	addDevice: function(device)	{
		if (!oo.isInterfaceOf(device, CyDevice)) throw "Invalid argument";

		var newDevice = this.cy.add({
			'group': "nodes",
			'classes': "device",
			'position': { x: this.cy.width() / 2, y: this.cy.height() / 2 },
			'data': {
				'type': "device"
			}
		});

		device.commit(newDevice);
	},

	addService: function(parent, service) {
		if (!oo.isInterfaceOf(parent, CyDevice)) throw "Invalid argument";
		if (!oo.isInterfaceOf(service, CyService)) throw "Invalid argument";

		var parentBBox = parent.boundingBox();

		var newService = this.cy.add({
			'group': "nodes",
			'classes': "service",
			'position': { x: parentBBox.x1 + parentBBox.w / 2, y: parentBBox.y1 + parentBBox.h / 2 },
			'data': {
				'parent': parent.id(),
				'type': "service"
			},
		});

		service.commit(newService);
	},

	getNodeById: function(id) {
		return this._wrap(this.cy.getElementById(id));
	},

	getNameCompletions: function(node) {		
		if (node.isInstanceOf(CyDevice)) {
			return this._getNodeLabels("node[type = 'device']");
		}
		else if (node.isInstanceOf(CyService)) {
			return this._getNodeLabels("node[type = 'service']");
		}
	},

	deleteNode: function(node)
	{
		if (!oo.isInterfaceOf(node, CyNode)) throw "Invalid argument";

		this._getSelected().unselect();
		this.cy.remove(this.cy.getElementById(node.id()));
	},

	_getSelected: function() {
		return this.cy.$(":selected");
	},

	_wrap: function (node) {
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
	},

	getSelected: function() {
		return this._getSelected().map((entry) => {
			return this._wrap(entry)
		});
	},

	startLinking: function(startNode) {
		if (!oo.isInterfaceOf(startNode, CyNode)) throw "Invalid argument";

		this._linkSource = this.cy.getElementById(startNode.id());
		$("#cycanvas").css("cursor", "no-drop");
		this._getSelected().unselect();
	},

	_showPopup: function(target) {
		// If we're linking at the moment. We can't show a popup.
		if (this._linkSource) return;

		// If there is already a popup for this target. Do nothing.
		if (target.scratch("popup")) return;

		// Get the bounding box of the element for positioning
		var absBBox = Tools.translateViewport($("#cycanvas"), target.renderedBoundingBox());

		// Popups for Nodes and Edges are different
		var popup = undefined;
		if (target.isNode()) {
			// Determin which buttons to show. If the type is unknown, show no popup.
			var buttonFlags = this._buttonsForType[target.data("type")];
			if (!buttonFlags) return;

			popup = new Popup(buttonFlags, this._wrap(target));
			target.scratch("popup", popup);

			// Position the popup		
			popup.show(absBBox.x1 + (absBBox.x2 - absBBox.x1 - popup.width()) / 2, absBBox.y1 - popup.height());
		} else {
			popup = new Popup(POPUP_DELETE, this._wrap(target));
			target.scratch("popup", popup);

			// Position the popup		
			popup.show(absBBox.x1 + (absBBox.x2 - absBBox.x1 - popup.width()) / 2, absBBox.y1 + (absBBox.y2 - absBBox.y1 - popup.height()) / 2);			
		}

		// Link events
		popup.pass("add", this);
		popup.pass("link", this);
		popup.pass("edit", this);
		popup.pass("delete", this);
	},

	_clearPopup: function(target) {
		var popup = target.scratch("popup");
		if (popup) popup.destroy();
		target.removeScratch("popup");
	},

	_isLinkable: function(src, dst) {
		if (src && dst && src.isNode() && dst.isNode()) {
			var srcType = src.data("type");
			var dstType = dst.data("type");
			if (src.edgesTo(dst).length || dst.edgesTo(src).length) return false;			
			return ((srcType === dstType) || (srcType === "stp") || (srcType === "device" && (dstType === "stp"))) && (src.id() !== dst.id());
		} else {
			return false;
		}
	},

	save: function() {
		return JSON.stringify(this.cy.json().elements);
	},

	load: function(jsonData) {
		this._getSelected().unselect();
		this._linkSource = undefined;
		this.clear();
		this.cy.json({'elements': JSON.parse(jsonData) });
	},

	clear: function() {
		this._getSelected().unselect();
		this.cy.elements().remove();
	},

	resetZoom: function() {
		this.cy.reset();
	},

	getModel: function() {
		var stp = this.cy.nodes('[type = "stp"]');

		var devices = this.cy.nodes('node[type = "device"]').map((node) => {
			var services = node.children('node[type = "service"]').map((node) => {
				return {
					'id': node.id(),
					'name': node.data("label"),
					'capacity': node.data("capacity"),
				}
			});

			return {
				'id': node.id(),
				'ava': node.data("ava"),
				'services': services
			};			
		});

		var links = this.cy.edges().map((edge) => {
			return {
				'type': edge.data("type"),
				'from': edge.source().id(),
				'to': edge.target().id()
			};
		});

		var model = {
			'stp': {
				'id': stp.id(),
			},
			'devices': devices,
			'links': links
		};

		return model;
	},

	_onSelectNode: function(event) {
		if (this._linkSource) {
			var linkDestination = event.target[0];
			if (this._isLinkable(this._linkSource, linkDestination)) {
				var linkType = linkDestination.data("type");

				// If the destination is the STP use a device-link. Only devices can have
				// the STP as a destination. Services can not. This is blocked within _isLinkable.
				if (linkType == "stp") linkType = "device";

				this.cy.add({
					group: "edges",
					classes: linkType,
					data: {
						type: linkType,
						source: this._linkSource.id(),
						target: linkDestination.id()
					}
				});
			} else {
				this.trigger("error", "Invalid target selected.");				
			}

			// Clear the link source and reset the cursor
			$("#cycanvas").css("cursor", "");
			this._linkSource = undefined;
		} else {
			if (this._getSelected().length != 1)
			{
				this._clearPopup(this._getSelected());
			} else {			
				this._showPopup(event.target);
			}
		}
	},

	_onSelectEdge: function(event) {
		this._showPopup(event.target);
	},

	_onUnSelect: function(event) {
		this._clearPopup(event.target);
	},

	_onDrag: function(event) {
		this._clearPopup(event.target);
	},

	_onFree: function(event) {
		if (this._getSelected().length == 1) {
			this._showPopup(this._getSelected());
		}
	},

	_onPan: function(event) {
		this._getSelected().unselect();
	},

	_onZoom: function(event) {
		this._getSelected().unselect();
	},

	_onMouseOver: function(event) {
		if (this._linkSource) {		
			if (event.target[0]) {				
				if (this._isLinkable(this._linkSource, event.target[0])) {
					$("#cycanvas").css("cursor", "alias");
				} else {
					$("#cycanvas").css("cursor", "no-drop");
				}
			}
		}
	},

	_onMouseOut: function(event) {
		if (this._linkSource) {			
			$("#cycanvas").css("cursor", "no-drop");
		}
	}
});