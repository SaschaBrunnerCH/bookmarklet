var viewGlobal;
executeArcGISJSAPITool();

function executeArcGISJSAPITool(input) {
    if(typeof input!='undefined'){
        console.log("Script already added and executed.");
        return false;
    }
  try {
    require("esri/kernel");
  } catch (ex) {
    throw new Error("no ArcGIS JS API page");
  }

  var arcgisjsversion = require("esri/kernel").version;
  if (versionCompare(arcgisjsversion, "4.0") == -1) {
    throw new Error("ArcGIS JS API Version not supported: " + arcgisjsversion);
  }

  if (typeof view == "object" && (view.type == "2d" || view.type == "3d")) {
    console.log(
      "view globally defined, ArcGIS JS API Version: " + arcgisjsversion
    );
    viewGlobal = view;
  } else {
    console.log("ArcGIS JS API Version: " + arcgisjsversion);
    if (versionCompare(arcgisjsversion, "4.11") == -1) {
      throw new Error(
        "Version is lower then 4.11 - no static view exist. Update the ArcGIS JS API or make view global."
      );
    }
  }

  if (versionCompare(arcgisjsversion, "4.15") == -1) {
    throw new Error(
      "Version is lower then 4.15 - function performanceInfo not supported in this Version"
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

require(["esri/views/View", "esri/libs/amcharts4/index"], function (
  View,
  charts
) {
  if (!viewGlobal) {
    viewGlobal = View.views.getItemAt(0);
  }
  console.log("ArcGIS JS API - Add memory information");

  const stats = viewGlobal.performanceInfo;
  const am4core = charts.am4core;
  const am4themes_animated = charts.am4themes_animated;
  const am4charts = charts.am4charts;
  am4core.ready(function () {
    am4core.useTheme(am4themes_animated);
    const resourceTypes = [
      {
        type: "elevation",
        color: am4core.color("#f2b89b"),
        name: "Elevation layers",
      },
      {
        type: "scene",
        color: am4core.color("#b1e3be"),
        name: "Scene layers",
      },
      {
        type: "building-scene",
        color: am4core.color("#b1e3be"),
        name: "Building scene layers",
      },
      {
        type: "feature",
        color: am4core.color("#9bbbf2"),
        name: "Feature layers",
      },
      {
        type: "point-cloud",
        color: am4core.color("#eda8d2"),
        name: "Point cloud layers",
      },
      {
        type: "vector-tile",
        color: am4core.color("#cba8ed"),
        name: "Vector tile layers",
      },
      {
        type: "web-tile",
        color: am4core.color("#cba8ed"),
        name: "Web tile layers",
      },
      {
        type: "tile",
        color: am4core.color("#cba8ed"),
        name: "Tile layers",
      },
    ];

    const data = [
      {
        memory: "",
      },
    ];

    for (var res of resourceTypes) {
      data[0][res.type] = 0;
    }
    const container = document.createElement("div");
    container.setAttribute("style", "background-color: white;padding: 1em;");
    const title = document.createElement("h3");
    title.innerHTML = "Memory";
    container.appendChild(title);
    const chartContainer = document.createElement("div");
    chartContainer.setAttribute("style", "max-height: 100px;");
    container.appendChild(chartContainer);
    viewGlobal.ui.add(container, "bottom-left");
    const chart = am4core.create(chartContainer, am4charts.XYChart);
    chart.data = data;
    var categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "memory";
    var valueAxis = chart.xAxes.push(new am4charts.ValueAxis());
    valueAxis.min = 0;
    valueAxis.max = getMB(stats.totalMemory);
    valueAxis.strictMinMax = true;

    valueAxis.renderer.labels.template.adapter.add("text", function (text) {
      return text + "MB";
    });

    const tableContainer = document.createElement("table");
    tableContainer.setAttribute("style", "border-collapse:collapse;");
    container.append(tableContainer);

    resourceTypes.forEach(function (resource) {
      createSeries(resource);
    });

    const updateStatTimeoutTrigger = () => {
      const stats = viewGlobal.performanceInfo;
      updateMemoryTitle(stats.usedMemory, stats.totalMemory);
      updateData(stats);
      updateTable(stats);
      setTimeout(updateStatTimeoutTrigger, 1000);
    };

    updateStatTimeoutTrigger();

    function createSeries(resource) {
      var series = chart.series.push(new am4charts.ColumnSeries());
      series.dataFields.valueX = resource.type;
      series.dataFields.categoryY = "memory";
      series.columns.template.tooltipText = "{name}: {valueX}MB.";
      series.columns.template.fill = resource.color;
      series.columns.template.strokeWidth = 0;
      series.columns.template.maxHeight = 20;
      series.stacked = true;
      series.name = resource.name;
    }

    function updateData(newStats) {
      const agStats = getAggregatedStats(newStats);
      for (res of resourceTypes) {
        chart.data[0][res.type] = agStats[res.type];
      }
      valueAxis.max = getMB(newStats.totalMemory);
      chart.invalidateRawData();
    }

    function updateMemoryTitle(used, total) {
      title.innerHTML = `Memory: ${getMB(used)}MB/${getMB(total)}MB`;
    }

    function updateTable(stats) {
      const agStats = getAggregatedStats(stats);
      tableContainer.innerHTML = `<tr>
        <th>Layer</th>
        <th style="text-align:center;padding: 0 4px;">Memory<br>(MB)</th>
        <th style="text-align:center;padding: 0 4px;">Displayed<br>Features<br>(count)</th>
        <th style="text-align:center;padding: 0 4px;">Total<br>Features<br>(count)</th>
      </tr>`;
      for (res of resourceTypes) {
        if (typeof agStats[res.type] !== "undefined") {
          const row = document.createElement("tr");
          row.setAttribute("style", "background-color:" + res.color.hex);
          row.innerHTML = `<td>${res.name}</td><td style="text-align:center">${
            agStats[res.type]
          }</td><td></td><td></td>`;
          tableContainer.appendChild(row);
          for (let key in stats.layerPerformanceInfos) {
            const layerInfo = stats.layerPerformanceInfos[key];
            if (layerInfo.layer.type === res.type) {
              const row = document.createElement("tr");
              const color = res.color.rgb;
              row.setAttribute(
                "style",
                `background-color:rgba(${color.r},${color.g},${color.b},0.2)`
              );
              row.innerHTML = `<td>${
                layerInfo.layer.title
              }</td><td style="text-align:center">${getMB(
                layerInfo.memory
              )}</td>`;
              row.innerHTML += `<td style="text-align:center">${
                layerInfo.displayedNumberOfFeatures
                  ? layerInfo.displayedNumberOfFeatures
                  : "-"
              }</td>`;
              row.innerHTML += `<td style="text-align:center">${
                layerInfo.totalNumberOfFeatures
                  ? layerInfo.totalNumberOfFeatures
                  : "-"
              }</td>`;
              tableContainer.appendChild(row);
            }
          }
        }
      }
    }
  });

  function getAggregatedStats(stats) {
    const agStats = {};
    for (let key in stats.layerPerformanceInfos) {
      const layerInfo = stats.layerPerformanceInfos[key];
      if (agStats.hasOwnProperty(layerInfo.layer.type)) {
        agStats[layerInfo.layer.type] += getMB(layerInfo.memory);
      } else {
        agStats[layerInfo.layer.type] = getMB(layerInfo.memory);
      }
    }
    return agStats;
  }

  function getMB(bytes) {
    var kilobyte = 1024;
    var megabyte = kilobyte * 1024;
    return Math.round(bytes / megabyte);
  }
});
