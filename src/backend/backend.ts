import createClient from "openapi-fetch";
import type { paths } from "../types/schema";
import type {
  GeoJSONFeature,
  LatLonHeightGrid,
  MonostaticSensor,
  PclSensor,
  Point,
  Transmitter,
} from "../types/types";

const client = createClient<paths>({ baseUrl: "http://localhost:8000" });

export interface MonostaticCoverageCalcConf {
  targetAlt: number;
  targetRcs: number;
  probabilityThreshold: number;
  azimuthResolution: number;
  rangeOnly: boolean;
}

export interface PclCoverageCalcConf {
  grid: LatLonHeightGrid;
  snrThreshold: number;
  dopplerThreshold: number;
  delayThreshold: number;
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

export async function calculatePclMinimumDetectableRcs(
  sensor: PclSensor,
  conf: PclCoverageCalcConf,
): Promise<number[][][]> {
  const { data, error } = await client.POST("/calculate_min_detectable_rcs", {
    query: {
      snr_threshold: conf.snrThreshold,
      doppler_threshold: conf.dopplerThreshold,
      delay_threshold: conf.delayThreshold,
    },
    body: { sensor: sensor, grid: conf.grid },
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

export async function fetchFmTransmitters(): Promise<Transmitter[]> {
  const { data, error } = await client.GET("/fm_transmitters");

  if (error) {
    throw new Error(error);
  }

  return data;
}

export async function lineOfSightDistance(
  p1: Point,
  p2: Point,
): Promise<number> {
  const { data, error } = await client.GET(
    "/line_of_sight_distance/{lat1}_{lon1}_{alt1}/{lat2}_{lon2}_{alt2}",
    {
      params: {
        path: {
          lat1: p1.lat,
          lon1: p1.lon,
          alt1: p1.alt,
          lat2: p2.lat,
          lon2: p2.lon,
          alt2: p2.alt,
        },
      },
    },
  );

  if (error) {
    throw new Error(JSON.stringify(error));
  }

  return data;
}
