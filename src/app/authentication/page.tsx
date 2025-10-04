"use client";

import { auth } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Authentication() {
  const [authenticationStatus, setAuthenticationStatus] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleLogIn() {
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      router.replace("/create-seller-profile");
      console.log(user);
    } catch (error) {
      console.log(error);
    }
  }

  async function handleAccountCreation() {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User created:", user.uid);
      router.replace("/create-seller-profile");
    } catch (error) {
      console.log("Create account failed:", error);
    }
  }

  return (
    <div>
      <div
        className={"authenticationStatus"}
        style={{ display: "flex", gap: "1rem", marginBottom: "3rem" }}
      >
        <button
          onClick={() => {
            setAuthenticationStatus("log-in");
          }}
        >
          Log-in
        </button>
        <button
          onClick={() => {
            setAuthenticationStatus("create-account");
          }}
        >
          Create Account
        </button>
      </div>
      {authenticationStatus !== "" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          Email:
          <input
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          ></input>
          Password
          <input
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          ></input>
          {authenticationStatus === "log-in" ? (
            <div>
              <button
                onClick={() => {
                  handleLogIn();
                }}
              >
                Log-in
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={() => {
                  handleAccountCreation();
                }}
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
