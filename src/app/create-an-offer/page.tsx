"use client";

import { Avatar, Button, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase";

export default function CreateAnOffer() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  // Handles the data upload of the Offer created.
  async function handleDataUplaod(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const offer = {
        name,
        title,
        description,
        city,
        area: Number(area),
        price: Number(price),
        currency,
        email,
        phone: phone || null,
        imageURL: null,
        createdAt: serverTimestamp(),
      };

      const offersCol = collection(db, "offers");
      const docRef = await addDoc(offersCol, offer);

      if (file) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
        const unsignedPreset =
          process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET!;

        if (!cloudName || !unsignedPreset) {
          throw new Error("Missing Cloudinary env vars. Check .env.local");
        }

        const form = new FormData();
        form.append("file", file);
        form.append("upload_preset", unsignedPreset);
        form.append("folder", `offers/${docRef.id}`);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: form }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Cloudinary upload failed: ${text}`);
        }

        const data = await res.json();
        const imageURL = data.secure_url;

        await updateDoc(doc(db, "offers", docRef.id), {
          imageURL,
          cloudinaryPublicId: data.public_id,
        });
      }

      router.replace("/my-dashboard");
    } catch (err) {
      console.error("Offer submit failed:", err);
    }
  }

  // Hnadles the uploaded files size, and compresses it in case it is too big.
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const MAX = 10 * 1024 * 1024;
    let toUse: File = f;

    if (f.size > MAX) {
      toUse = await compressImage(f, { maxWidth: 1600, quality: 0.8 });
      if (toUse.size > MAX) {
        alert(
          "Image is still too large after compression. Try a smaller image."
        );
        return;
      }
    }

    setFile(toUse);
    setPreview(URL.createObjectURL(toUse));
  };

  // Handles the compressing logic for the files uploaded as the Images for the offer cover picture.
  async function compressImage(
    file: File,
    { maxWidth = 1600, quality = 0.8 } = {}
  ): Promise<File> {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = rej;
    });

    const scale = Math.min(1, maxWidth / img.width);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error("Compression failed (got null blob)"));
        },
        "image/jpeg",
        quality
      );
    });

    URL.revokeObjectURL(img.src);
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
    });
  }

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 420 }}>
      <Typography variant="h5">Create An Offer</Typography>

      <form
        onSubmit={handleDataUplaod}
        style={{ display: "grid", gap: "1rem" }}
      >
        <TextField
          label="Name of the Person FulFilling Offer"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        <TextField
          label="Title of the Offer"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoComplete="title"
          required
        />
        <TextField
          label="Description of the Offer"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autoComplete="description"
          required
        />
        <TextField
          label="City where I will go for Viewings"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          autoComplete="city"
          required
        />
        <TextField
          label="Distance from City Center of the City"
          type="number"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          autoComplete="area"
          required
        />
        <TextField
          label="Price for a Viewing"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          autoComplete="price"
          required
        />
        <TextField
          label="Currency of the Offer"
          type="text"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          autoComplete="currency"
          required
        />
        <TextField
          label="Email where to be Contacted"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <TextField
          label="Phone where to be Contacted"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          required={false}
        />

        <Stack spacing={2}>
          <Typography>
            Images for the Offer Cover Picture - Portfolio
          </Typography>
          <Button component="label" variant="contained">
            Choose image
            <input
              hidden
              type="file"
              name="image"
              accept="image/*"
              onChange={handleFile}
            />
          </Button>

          {preview && (
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                src={preview}
                alt="preview"
                sx={{ width: 56, height: 56 }}
              />
              <span>{file?.name}</span>
            </Stack>
          )}
        </Stack>

        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}
