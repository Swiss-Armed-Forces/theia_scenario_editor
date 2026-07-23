import createClient from "openapi-fetch";
import type { paths } from "../types/schema";
import type { GeoJSONFeature, MonostaticSensor } from "../types/types";

const client = createClient<paths>({ baseUrl: "http://localhost:8000" });

export interface MonostaticCoverageCalcConf {
  targetAlt: number;
  targetRcs: number;
  probabilityThreshold: number;
  azimuthResolution: number;
  rangeOnly: boolean;
}

export async function calculateMonostaticCoverage(
  sensor: MonostaticSensor,
  conf: MonostaticCoverageCalcConf,
): Promise<GeoJSONFeature> {
  const { data, error } = await client.POST("/calculate_monostatic_coverage", {
    params: {
      query: {
        target_alt: conf.targetAlt,
        rcs: conf.targetRcs,
        probability_threshold: conf.probabilityThreshold,
        azimuth_resolution_degree: conf.azimuthResolution,
        range_only: conf.rangeOnly,
      },
    },
    body: sensor,
  });

  if (error) {
    throw new Error(JSON.stringify(error));
  }

  return data;
}

export async function elevationAt(lat: number, lon: number): Promise<number> {
  const { data, error } = await client.GET("/elevation_at/{lat}_{lon}", {
    params: {
      query: undefined,
      header: undefined,
      path: {
        lat: lat,
        lon: lon,
      },
      cookie: undefined,
    },
  });

  if (error) {
    throw new Error(JSON.stringify(error));
  }

  return data;
}
