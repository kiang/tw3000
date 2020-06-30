var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });

var sidebarTitle = document.getElementById('sidebarTitle');
var content = document.getElementById('sidebarContent');

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.20345985889435, 22.994906062625773]),
  zoom: 14
});

var pointRedStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 10,
    fill: new ol.style.Fill({
      color: [243, 0, 80, 0.7]
    })
  })
});
var pointGreenStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 10,
    fill: new ol.style.Fill({
      color: [0, 243, 80, 0.7]
    })
  })
});

var pointLayer = new ol.layer.Vector({
  style: function(f) {
    var fStyle;
    if(parseInt(f.get('total')) > 0) {
      fStyle = pointGreenStyle.clone();
    } else {
      fStyle = pointRedStyle.clone();
    }
    return fStyle;
  }
});

var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(20);
var matrixIds = new Array(20);
for (var z = 0; z < 20; ++z) {
    // generate resolutions and matrixIds arrays for this WMTS
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = z;
}

var baseLayer = new ol.layer.Tile({
    source: new ol.source.WMTS({
        matrixSet: 'EPSG:3857',
        format: 'image/png',
        url: 'https://wmts.nlsc.gov.tw/wmts',
        layer: 'EMAP',
        tileGrid: new ol.tilegrid.WMTS({
            origin: ol.extent.getTopLeft(projectionExtent),
            resolutions: resolutions,
            matrixIds: matrixIds
        }),
        style: 'default',
        wrapX: true,
        attributions: '<a href="https://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>'
    }),
    opacity: 0.5
});

var map = new ol.Map({
  layers: [baseLayer, pointLayer],
  target: 'map',
  view: appView
});

map.addControl(sidebar);
var pointClicked = false;
var previousFeature = false;
var currentFeature = false;

map.on('singleclick', function(evt) {
  content.innerHTML = '';
  pointClicked = false;
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    if(false === pointClicked) {
      pointClicked = true;
      var p = feature.getProperties();
      var message = '<table class="table table-dark"><tbody>';
      for(k in p) {
        if(k !== 'geometry') {
          message += '<tr><th scope="row">' + k + '</th><td>' + p[k] + '</td></tr>';
        }
      }
      message += '</tbody></table>';
      sidebarTitle.innerHTML = p.storeNm;
      content.innerHTML = message;
      sidebar.open('home');

      currentFeature = feature;
      feature.setStyle(pointStyleFunction(feature));
      if(false !== previousFeature) {
        previousFeature.setStyle(pointStyleFunction(previousFeature));
      }
      previousFeature = feature;
    }
  });
});

map.once('rendercomplete', function() {
  if(window.location.hash === '') {
    var lonLat = ol.proj.toLonLat(appView.getCenter());
    window.location.hash = '#' + lonLat[0].toString() + '/' + lonLat[1].toString();
  }
  map.on('moveend', function(evt) {
    var lonLat = ol.proj.toLonLat(appView.getCenter());
    window.location.hash = '#' + lonLat[0].toString() + '/' + lonLat[1].toString();
  })
})

var geolocation = new ol.Geolocation({
  projection: appView.getProjection()
});

geolocation.setTracking(true);

geolocation.on('error', function(error) {
  console.log(error.message);
});

var positionFeature = new ol.Feature();

positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

var firstPosDone = false;
geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
  if(false === firstPosDone) {
    if(window.location.hash === '') {
      appView.setCenter(coordinates);
    }
    firstPosDone = true;
  }
});

new ol.layer.Vector({
  map: map,
  source: new ol.source.Vector({
    features: [positionFeature]
  })
});

$('#btn-geolocation').click(function () {
  var coordinates = geolocation.getPosition();
  if(coordinates) {
    appView.setCenter(coordinates);
  } else {
    alert('Your device could not provide information of current location');
  }
  return false;
});

$.getJSON('https://3000.gov.tw/hpgapi-openmap/api/getPostData', {}, function(c) {
  var pointsFc = [];
  for(k in c) {
    var p = c[k];
    p.geometry = new ol.geom.Point(ol.proj.fromLonLat([parseFloat(p.longitude), parseFloat(p.latitude)]));
    var f = new ol.Feature(p);
    pointsFc.push(f);
  }
  pointLayer.setSource(new ol.source.Vector({
    features: pointsFc
  }));
});

var showPoints = function(lng, lat) {
  
}

routie(':lng/:lat', showPoints);