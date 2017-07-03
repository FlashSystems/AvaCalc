'use strict';

class Tools {
	static attachClick(parent, clickEvents) {
		$.each(clickEvents, function(id, fc) {			
			parent.find("#" + id).off("click").on("click", fc);
		});
	}

	static translateViewport(element, posOrBox)
	{
		var result = {};

		var elementPos = element.position();

		if ("x1" in posOrBox) result.x1 = elementPos.left + posOrBox.x1;
		if ("x2" in posOrBox) result.x2 = elementPos.left + posOrBox.x2;
		if ("y1" in posOrBox) result.y1 = elementPos.top + posOrBox.y1;
		if ("y2" in posOrBox) result.y2 = elementPos.top + posOrBox.y2;
		if ("x" in posOrBox) result.x = elementPos.left + posOrBox.x;
		if ("y" in posOrBox) result.y = elementPos.top + posOrBox.y;

		return result;
	}
};