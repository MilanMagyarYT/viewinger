"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TextField } from "@mui/material";

type TestDoc = {
  name?: string;
  lastName?: string;
  country?: string;
  city?: string;
  cityArea?: string;
  personalBackground?: string;
  personalTraits?: string;
  email?: string;
  phone?: string;
};
type Row = TestDoc & { id: string };

export default function Home() {
  const [searchField, setSearchField] = useState("");
  const [startSearch, setStartSearch] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!startSearch) return;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/tests", { cache: "no-store" });
      const data = (await res.json()) as Row[];
      setRows(data);
      setLoading(false);
    })();
  }, [startSearch]);

  const filtered = useMemo(() => {
    const q = searchField.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.city, r.country, r.name, r.lastName, r.cityArea]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q))
    );
  }, [rows, searchField]);

  return (
    <main style={{ padding: 24 }}>
      <h1>People</h1>
      <div style={{ display: "flex", gap: 8 }}>
        <TextField
          placeholder="Search by city, name, country…"
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          size="small"
        />
        <button onClick={() => setStartSearch(true)}>Search</button>
      </div>

      {startSearch && (
        <div style={{ marginTop: 16 }}>
          {loading && <div>Loading…</div>}
          {!loading && filtered.length === 0 && <div>No results.</div>}
          {!loading &&
            filtered.map((item) => (
              <div
                key={item.id}
                style={{ padding: 12, borderBottom: "1px solid #eee" }}
              >
                <div>
                  <strong>
                    {item.name} {item.lastName}
                  </strong>
                </div>
                <div>
                  {[item.city, item.cityArea, item.country]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                {item.personalBackground && (
                  <p style={{ margin: 0 }}>{item.personalBackground}</p>
                )}

                {/* The important part: stable route by id */}
                <Link href={`/tests/${item.id}`} prefetch>
                  <button style={{ marginTop: 8 }}>View</button>
                </Link>
              </div>
            ))}
        </div>
      )}
    </main>
  );
}
