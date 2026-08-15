"use client";

import dynamic from "next/dynamic";

const MapScreenDynamic = dynamic(() => import("./MapScreen"), {
  ssr: false,
});

export default MapScreenDynamic;
