// app/api/city-search/route.ts
import { NextRequest, NextResponse } from "next/server";

const PHOTON_ENDPOINT = "https://photon.komoot.io/api/";
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") || "";
  const limit = searchParams.get("limit") || "10";
  const lang = searchParams.get("lang") || "en";
  const countryCode = searchParams.get("countryCode") || "";

  if (!q.trim()) {
    return NextResponse.json({ features: [] }, { status: 200 });
  }

  try {
    const photonParams = new URLSearchParams({
      q,
      limit,
      lang,
    });

    // Photon has country filtering via 'osm_tag' etc, but simplest:
    // we’ll still filter by country in the client (as you already do),
    // so we don't add extra params here.

    const photonRes = await fetch(
      `${PHOTON_ENDPOINT}?${photonParams.toString()}`,
      {
        cache: "no-store",
      }
    );

    if (photonRes.ok) {
      const data = await photonRes.json();
      return NextResponse.json(data, { status: 200 });
    } else {
      console.error(
        "[city-search] Photon non-OK",
        photonRes.status,
        await safeText(photonRes)
      );
    }
  } catch (err) {
    console.error("[city-search] Photon fetch failed", err);
  }

  // --- 2) Fallback: Nominatim (OpenStreetMap) ---
  try {
    const nomParams = new URLSearchParams({
      q,
      format: "json",
      addressdetails: "1",
      limit,
      "accept-language": lang,
    });

    if (countryCode) {
      nomParams.append("countrycodes", countryCode.toLowerCase());
    }

    const nomRes = await fetch(
      `${NOMINATIM_ENDPOINT}?${nomParams.toString()}`,
      {
        cache: "no-store",
        headers: {
          // Nominatim requires a valid User-Agent + contact
          "User-Agent": "viewinger-app/1.0 (your-email@example.com)",
        },
      }
    );

    if (!nomRes.ok) {
      console.error(
        "[city-search] Nominatim non-OK",
        nomRes.status,
        await safeText(nomRes)
      );
      // Still just fall through to empty result
    } else {
      const rows = (await nomRes.json()) as any[];

      // Adapt Nominatim JSON into the same shape PhotonAutocomplete expects:
      const features = rows.map((row, idx) => {
        const lat = parseFloat(row.lat);
        const lon = parseFloat(row.lon);
        const addr = row.address || {};
        const cityName =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.hamlet ||
          addr.suburb ||
          row.display_name;

        return {
          geometry: {
            type: "Point" as const,
            coordinates: [lon, lat] as [number, number],
          },
          properties: {
            name: cityName,
            city: cityName,
            country: addr.country || "",
            countrycode: addr.country_code || "",
            state: addr.state || "",
            osm_key: "place",
            osm_value: "city",
            // fake osm_id so your code's 'id' generation works:
            osm_id: row.osm_id ?? idx,
          },
        };
      });

      return NextResponse.json({ features }, { status: 200 });
    }
  } catch (err) {
    console.error("[city-search] Nominatim fetch failed", err);
  }

  // --- 3) Both failed → respond with empty list, but NOT 502 ---
  return NextResponse.json({ features: [] }, { status: 200 });
}

// Small helper so we don't throw when reading text from a bad response
async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "<no-body>";
  }
}
