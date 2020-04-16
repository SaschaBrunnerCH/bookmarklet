console.log("Bookmarklet");
require(["esri/views/View","esri/widgets/Home"], function (View,Home) {
	const view = View.views.getItemAt(0);
	var homeBtn = new Home({
	  view: view
	});
	view.ui.add(homeBtn, "top-left");
});
