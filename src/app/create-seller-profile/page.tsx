"use client";

import { db } from "@/firebase";
import { FirebaseError } from "firebase/app";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import TextField from "@mui/material/TextField";
import { Button, LinearProgress, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

export default function CreateSellerProfile() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [cityArea, setCityArea] = useState("");
  const [personalBackground, setPersonalBackground] = useState("");
  const [personalTraits, setPersonalTraits] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [step, setStep] = useState(0);

  async function submitData() {
    try {
      await addDoc(collection(db, "test"), {
        name: firstName,
        lastName: lastName,
        country: country,
        city: city,
        cityArea: cityArea,
        personalBackground: personalBackground,
        personalTraits: personalTraits,
        phoneNumber: phoneNumber,
        emailAddress: emailAddress,
      });
    } catch (err) {
      const e = err as unknown;
      if (e instanceof FirebaseError) {
        console.error("FirebaseError:", e.code, e.message, e.customData);
      } else {
        console.error("Unknown error:", e);
      }
    } finally {
      router.replace("/");
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
              value={city}
              label="City"
              variant="outlined"
              onChange={(event) => {
                setCity(event.target.value);
              }}
            />
            <TextField
              value={cityArea}
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
              value={personalBackground}
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
              value={personalTraits}
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

      case 4:
        return (
          <div
            className="contact"
            style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}
          >
            <TextField
              value={phoneNumber}
              label="Phone Number"
              variant="outlined"
              onChange={(event) => {
                setPhoneNumber(event.target.value);
              }}
            />
            <TextField
              value={emailAddress}
              label="Email Address"
              variant="outlined"
              onChange={(event) => {
                setEmailAddress(event.target.value);
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
    return Math.round((step * 100) / 5);
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
        <Typography>{phoneNumber}</Typography>
        <Typography>{emailAddress}</Typography>
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
      {step === 5 && reviewDataEntered()}
    </div>
  );
}
