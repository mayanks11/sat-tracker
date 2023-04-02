import React, { useEffect } from "react";
const Cesium = require('cesium');
const satellite = require("satellite.js");
const tle1 =
`1 13552U 82092A   22360.46036218  .00007527  00000+0  21129-3 0  9998
2 13552  82.5715  75.4867 0025529 138.7275 221.5904 15.36026074 62183`
export default function App(){
  
  const satrec = satellite.twoline2satrec(
    tle1.split('\n')[0].trim(), 
    tle1.split('\n')[1].trim()
  );
  // Get the position of the satellite at the given date
  const date = new Date();
  const positionAndVelocity = satellite.propagate(satrec, date);
  const gmst = satellite.gstime(date);
  const position = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
  
  console.log(position.longitude);// in radians
  console.log(position.latitude);// in radians
  console.log(position.height);// in km
  useEffect(() => {
    const viewer = new Cesium.Viewer('cesiumContainer', {
      imageryProvider: new Cesium.TileMapServiceImageryProvider({
        url: Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
      }),
      baseLayerPicker: false, geocoder: false, homeButton: false, infoBox: false,
      navigationHelpButton: false, sceneModePicker: false
    });
    // This causes a bug on android, see: https://github.com/CesiumGS/cesium/issues/7871
    // viewer.scene.globe.enableLighting = true;
    // These 2 lines are published by NORAD and allow us to predict where
    // the ISS is at any given moment. They are regularly updated.
    // Get the latest from: https://celestrak.com/satcat/tle.php?CATNR=25544. 
    const ISS_TLE = 
    `1 25544U 98067A   21121.52590485  .00001448  00000-0  34473-4 0  9997
    2 25544  51.6435 213.5204 0002719 305.2287 173.7124 15.48967392281368`;
    const satrec = satellite.twoline2satrec(
      ISS_TLE.split('\n')[0].trim(), 
      ISS_TLE.split('\n')[1].trim()
    );
    // Give SatelliteJS the TLE's and a specific time.
    // Get back a longitude, latitude, height (km).
    // We're going to generate a position every 10 seconds from now until 6 seconds from now. 
    const totalSeconds = 60 * 60 * 6;
    const timestepInSeconds = 10;
    const start = Cesium.JulianDate.fromDate(new Date());
    const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());
    viewer.clock.startTime = start.clone();
    viewer.clock.stopTime = stop.clone();
    viewer.clock.currentTime = start.clone();
    viewer.timeline.zoomTo(start, stop);
    viewer.clock.multiplier = 40;
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    
    const positionsOverTime = new Cesium.SampledPositionProperty();
    for (let i = 0; i < totalSeconds; i+= timestepInSeconds) {
      const time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
      const jsDate = Cesium.JulianDate.toDate(time);

      const positionAndVelocity = satellite.propagate(satrec, jsDate);
      const gmst = satellite.gstime(jsDate);
      const p   = satellite.eciToGeodetic(positionAndVelocity.position, gmst);

      const position = Cesium.Cartesian3.fromRadians(p.longitude, p.latitude, p.height * 1000);
      positionsOverTime.addSample(time, position);
    }
    
    // Visualize the satellite with a red dot.
    const satellitePoint = viewer.entities.add({
      position: positionsOverTime,
      point: { pixelSize: 5, color: Cesium.Color.RED }
    });
    
  },[])
  return(
    <div className = "cesiumContainer" id = "cesiumContainer">

    </div>
  )
}