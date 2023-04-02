import React, { useEffect } from "react";
const cesium = require('cesium');

export default function App(){
  useEffect(() => {
    var viewer = new cesium.Viewer("cesiumContainer");
    
    
  },[])
  return(
    <div className = "cesiumContainer" id = "cesiumContainer">

    </div>
  )
}