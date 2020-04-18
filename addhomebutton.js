try {
  require("esri/kernel");
} catch (ex) {
  throw new Error("no ArcGIS JS API page");
}

var viewGlobal;
var arcgisjsversion = require("esri/kernel").version
if (versionCompare(arcgisjsversion, "4.0") == -1){
    throw new Error(
        "ArcGIS JS API Version not supported: " + arcgisjsversion
      );
}

if (typeof view == "object" && (view.type == "2d" || view.type == "3d")) {
    console.log("view globally defined, ArcGIS JS API Version: " + arcgisjsversion);
    viewGlobal = view;
} else {
  console.log("ArcGIS JS API Version: " + arcgisjsversion);
  if (versionCompare(arcgisjsversion, "4.11") == -1) {
    throw new Error(
      "Version is lower then 4.11 - no static view exist. Update the ArcGIS JS API or make view global."
    );
  }
}

/**
 * Returns:
 * -1 = left is LOWER than right
 *  0 = they are equal
 *  1 = left is GREATER = right is LOWER
 **/
function versionCompare(left, right) {
  var leftarray = left.split(".").map((e) => parseInt(e, 10));
  var rightarray = right.split(".").map((e) => parseInt(e, 10));
  var i = 0,
    len = Math.max(leftarray.length, rightarray.length);
  for (; i < len; i++) {
    if (
      (leftarray[i] && !rightarray[i] && parseInt(leftarray[i]) > 0) ||
      parseInt(leftarray[i]) > parseInt(rightarray[i])
    ) {
      return 1;
    } else if (
      (rightarray[i] && !leftarray[i] && parseInt(rightarray[i]) > 0) ||
      parseInt(leftarray[i]) < parseInt(rightarray[i])
    ) {
      return -1;
    }
  }
  return 0;
}

require(["esri/views/View", "esri/widgets/Home"], function (
  View,
  Home
) {
  if (viewGlobal) {
    addHomeButton(viewGlobal);
  } else {
    addHomeButton(View.views.getItemAt(0));
  }

  function addHomeButton(view) {
    console.log("ArcGIS JS API - Add home button");
    var homeBtn = new Home({
      view: view,
    });
    view.ui.add(homeBtn, "bottom-right");
  }
});
