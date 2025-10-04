"use client";

import { db } from "@/firebase";
import { FirebaseError } from "firebase/app";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import TextField from "@mui/material/TextField";
import { Button, LinearProgress, Typography } from "@mui/material";

export default function CreateSellerProfile() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [cityArea, setCityArea] = useState("");
  const [personalBackground, setPersonalBackground] = useState("");
  const [personalTraits, setPersonalTraits] = useState("");
  const [step, setStep] = useState(0);

  async function submitData() {
    try {
      await addDoc(collection(db, "test"), {
        name: firstName,
        country: lastName,
      });
    } catch (err) {
      const e = err as unknown;
      if (e instanceof FirebaseError) {
        console.error("FirebaseError:", e.code, e.message, e.customData);
      } else {
        console.error("Unknown error:", e);
      }
    } finally {
      console.log("Document has been added");
    }
  }

  function contentPicker(step: number) {
    switch (step) {
      case 0:
        return (
          <div
            className="fullName"
            style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}
          >
            <TextField
              value={firstName}
              label="First Name"
              variant="outlined"
              onChange={(event) => {
                setFirstName(event.target.value);
              }}
            />
            <TextField
              label="Last Name"
              variant="outlined"
              onChange={(event) => {
                setLastName(event.target.value);
              }}
            />
            <Button
              onClick={() => {
                setStep(step + 1);
              }}
              variant="contained"
            >
              Next
            </Button>
          </div>
        );
      case 1:
        return (
          <div
            className="areaOfResidence"
            style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}
          >
            <TextField
              value={country}
              label="Country"
              variant="outlined"
              onChange={(event) => {
                setCountry(event.target.value);
              }}
            />
            <TextField
              label="City"
              variant="outlined"
              onChange={(event) => {
                setCity(event.target.value);
              }}
            />
            <TextField
              label="City Area(opt.)"
              variant="outlined"
              onChange={(event) => {
                setCityArea(event.target.value);
              }}
            />
            <Button
              onClick={() => {
                setStep(step + 1);
              }}
              variant="contained"
            >
              Next
            </Button>
          </div>
        );
      case 2:
        return (
          <div
            className="personalBackground"
            style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}
          >
            <TextField
              label="Personal Background"
              variant="outlined"
              style={{ textAlign: "left" }}
              multiline
              rows={3}
              onChange={(event) => {
                setPersonalBackground(event.target.value);
              }}
            />
            <Button
              onClick={() => {
                setStep(step + 1);
              }}
              variant="contained"
            >
              Next
            </Button>
          </div>
        );
      case 3:
        return (
          <div
            className="personalTraits"
            style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}
          >
            <TextField
              label="Personal Traits"
              variant="outlined"
              style={{ textAlign: "left" }}
              multiline
              rows={3}
              onChange={(event) => {
                setPersonalTraits(event.target.value);
              }}
            />
            <Button
              onClick={() => {
                setStep(step + 1);
              }}
              variant="contained"
            >
              Next
            </Button>
          </div>
        );
    }
  }

  function calculateProgress(step: number) {
    return Math.round((step * 100) / 4);
  }

  function reviewDataEntered() {
    return (
      <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
        <Typography>{firstName}</Typography>
        <Typography>{lastName}</Typography>
        <Typography>{city}</Typography>
        <Typography>{country}</Typography>
        <Typography>{cityArea}</Typography>
        <Typography>{personalBackground}</Typography>
        <Typography>{personalTraits}</Typography>
        <Button
          variant="contained"
          onClick={() => {
            submitData();
          }}
        >
          Submit Account Details
        </Button>
      </div>
    );
  }
  return (
    <div>
      <LinearProgress
        variant="determinate"
        value={calculateProgress(step)}
        sx={{ marginBottom: "1rem" }}
      />
      {calculateProgress(step)}
      {contentPicker(step)}
      {step === 4 && reviewDataEntered()}
    </div>
  );
}
