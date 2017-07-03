const POPUP_ADD=0x01;
const POPUP_EDIT=0x02;
const POPUP_LINK=0x04;
const POPUP_DELETE=0x08;

var Popup = Events({
	_addMenuItem: function(parent, addClasses, icon, eventName) {
		var listItem = $('<li></li>');
		var icon = $("<i></i>", {
			'class': "material-icons",
			'text': icon
		});

		var classString = addClasses.reduce((cssClassStr, cssClass) => { return cssClassStr + " " + cssClass; }, "btn-floating waves-effect waves-light");

		var link = $("<a></a>", {
			'class': classString,
			'on': {
				'click': () => { this.trigger(eventName, this._target); }
			}
		});

		link.append(icon);
		listItem.append(link);
		parent.append(listItem);
	},

	_init: function(itemFlags, target) {
		this._container = $("<div></div>", {
			'class': "options"
		});


		this._target = target;

		var options = $('<ul><ul>');

		if (itemFlags & POPUP_ADD) this._addMenuItem(options, ["green"], "add", "add");
		if (itemFlags & POPUP_EDIT) this._addMenuItem(options, ["lime", "darken-2"], "edit", "edit");
		if (itemFlags & POPUP_LINK) this._addMenuItem(options, ["blue"], "settings_ethernet", "link");
		if (itemFlags & POPUP_DELETE) this._addMenuItem(options, ["red"], "delete", "delete");

		this._container.append(options);

		$("body").append(this._container);
	},

	_dispose: function() {
		// Fade out the container and dispose it off
		this._container.fadeOut({
			duration: 330,
			always: () => { this._container.remove(); }
		});
	},

	show: function(x, y) {
		this._container.css("left", x.toString() + "px");
		this._container.css("top", y.toString() + "px");
		this._container.fadeIn({
			duration: 330
		});
	},

	width: function() {
		return this._container.width();
	},

	height: function() {
		return this._container.height();
	}
});