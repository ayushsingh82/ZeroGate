import { NextRequest, NextResponse } from "next/server";
import { checkGate } from "../gate";

export async function GET(req: NextRequest) {
  const gateResp = checkGate(req);
  if (gateResp) return gateResp;

  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "28.6139");
  const lon = parseFloat(searchParams.get("lon") ?? "77.2090");

  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weathercode`,
      { next: { revalidate: 300 } }
    );
    const raw = await r.json() as { current?: { temperature_2m: number; wind_speed_10m: number; weathercode: number } };
    const cur = raw.current;
    return NextResponse.json({
      data: {
        temperature_c: cur?.temperature_2m ?? 28,
        wind_kmh:      cur?.wind_speed_10m ?? 12,
        condition:     codeToCondition(cur?.weathercode ?? 0),
        lat,
        lon,
      },
      anonymous: true,
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json({
      data: { temperature_c: 28, wind_kmh: 12, condition: "Clear", lat, lon },
      anonymous: true,
      timestamp: Date.now(),
    });
  }
}

function codeToCondition(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 49) return "Foggy";
  if (code <= 69) return "Drizzle";
  if (code <= 79) return "Snow";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}
