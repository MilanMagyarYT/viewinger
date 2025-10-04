"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [searchField, setSearchField] = useState("");
  const router = useRouter();

  return (
    <div>
      <input
        onChange={(event) => {
          console.log(event.target.value);
          setSearchField(event.target.value);
        }}
      ></input>
      <button
        onClick={() => {
          router.push("/create-account");
        }}
      >
        Create Account
      </button>
    </div>
  );
}
