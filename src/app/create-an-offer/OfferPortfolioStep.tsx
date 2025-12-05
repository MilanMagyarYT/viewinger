// src/app/create-an-offer/OfferPortfolioStep.tsx
"use client";

import * as React from "react";
import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";

export type PortfolioState = {
  coverImageFile: File | null;
  coverImagePreviewUrl: string;
  videoFile: File | null;
  videoName: string;
  pdfFile: File | null;
  pdfName: string;
};

type Props = {
  value: PortfolioState;
  onChange: (state: PortfolioState) => void;
};

// ---- Size limits (approximate, tuned for base Cloudinary + 30–60s 1080p) ----
// Image: high-quality cover, but not huge
const MAX_IMAGE_MB = 8;
const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;

// Video: keep under ~90MB so most 30–60s 1080p clips (with reasonable compression) pass,
// and we stay comfortably under typical 100MB Cloudinary upload limits.
const MAX_VIDEO_MB = 90;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

// PDF: a few pages with screenshots / text
const MAX_PDF_MB = 10;
const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;

export default function OfferPortfolioStep({ value, onChange }: Props) {
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [videoError, setVideoError] = React.useState<string | null>(null);
  const [pdfError, setPdfError] = React.useState<string | null>(null);

  // ---- Handlers ----

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // clear previous error
    setImageError(null);

    if (file.size > MAX_IMAGE_BYTES) {
      const sizeMb = file.size / (1024 * 1024);
      setImageError(
        `Image is ${sizeMb.toFixed(
          1
        )} MB. Maximum allowed size is ${MAX_IMAGE_MB} MB.`
      );
      // clear invalid value in parent state
      if (value.coverImagePreviewUrl) {
        URL.revokeObjectURL(value.coverImagePreviewUrl);
      }
      onChange({
        ...value,
        coverImageFile: null,
        coverImagePreviewUrl: "",
      });
      return;
    }

    // valid image -> create preview
    if (value.coverImagePreviewUrl) {
      URL.revokeObjectURL(value.coverImagePreviewUrl);
    }
    const previewUrl = URL.createObjectURL(file);

    onChange({
      ...value,
      coverImageFile: file,
      coverImagePreviewUrl: previewUrl,
    });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoError(null);

    if (file.size > MAX_VIDEO_BYTES) {
      const sizeMb = file.size / (1024 * 1024);
      setVideoError(
        `Video is ${sizeMb.toFixed(
          1
        )} MB. Maximum allowed size is ${MAX_VIDEO_MB} MB. Please upload a shorter or compressed clip.`
      );
      onChange({
        ...value,
        videoFile: null,
        videoName: "",
      });
      return;
    }

    onChange({
      ...value,
      videoFile: file,
      videoName: file.name,
    });
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfError(null);

    if (file.size > MAX_PDF_BYTES) {
      const sizeMb = file.size / (1024 * 1024);
      setPdfError(
        `PDF is ${sizeMb.toFixed(
          1
        )} MB. Maximum allowed size is ${MAX_PDF_MB} MB.`
      );
      onChange({
        ...value,
        pdfFile: null,
        pdfName: "",
      });
      return;
    }

    onChange({
      ...value,
      pdfFile: file,
      pdfName: file.name,
    });
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Portfolio
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
        Add a strong cover image and optional extras so buyers understand your
        style and past work.
      </Typography>

      <Stack spacing={3}>
        {/* Cover image (required) */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
            Cover image{" "}
            <Typography component="span" color="error">
              *
            </Typography>
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
            This is the main image shown on your offer card.
            <br />
            Recommended: 16:9 or 4:3, at least 1200px wide. Max {
              MAX_IMAGE_MB
            }{" "}
            MB.
          </Typography>

          <Button
            component="label"
            variant="contained"
            sx={{
              backgroundColor: COLORS.accent,
              color: COLORS.navyDark,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#f6a76a" },
            }}
          >
            Choose cover image
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={handleCoverImageChange}
            />
          </Button>

          {value.coverImagePreviewUrl && (
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mt: 2 }}
            >
              <Avatar
                src={value.coverImagePreviewUrl}
                alt="Cover preview"
                variant="rounded"
                sx={{ width: 72, height: 72 }}
              />
              <Typography variant="body2">
                {value.coverImageFile?.name || "Selected image"}
              </Typography>
            </Stack>
          )}

          {imageError && (
            <Typography
              variant="caption"
              sx={{ color: "error.main", display: "block", mt: 1 }}
            >
              {imageError}
            </Typography>
          )}
        </Box>

        {/* Optional video */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
            Presentation video (optional)
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
            A 30–60 second video introducing yourself or showing how you work.
            <br />
            Accepted: MP4 / MOV. Max {MAX_VIDEO_MB} MB.
          </Typography>

          <Button
            component="label"
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: 500,
              borderColor: COLORS.muted,
              color: COLORS.navyDark,
              "&:hover": {
                borderColor: COLORS.accent,
                backgroundColor: "rgba(248,187,132,0.05)",
              },
            }}
          >
            {value.videoFile ? "Change video" : "Upload video"}
            <input
              hidden
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
            />
          </Button>

          {value.videoName && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected: {value.videoName}
            </Typography>
          )}

          {videoError && (
            <Typography
              variant="caption"
              sx={{ color: "error.main", display: "block", mt: 1 }}
            >
              {videoError}
            </Typography>
          )}
        </Box>

        {/* Optional PDF */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5 }}>
            Previous work (PDF, optional)
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
            A short PDF case study of a previous viewing and what you delivered.
            <br />
            Max {MAX_PDF_MB} MB.
          </Typography>

          <Button
            component="label"
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: 500,
              borderColor: COLORS.muted,
              color: COLORS.navyDark,
              "&:hover": {
                borderColor: COLORS.accent,
                backgroundColor: "rgba(248,187,132,0.05)",
              },
            }}
          >
            {value.pdfFile ? "Change PDF" : "Upload PDF"}
            <input
              hidden
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
            />
          </Button>

          {value.pdfName && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected: {value.pdfName}
            </Typography>
          )}

          {pdfError && (
            <Typography
              variant="caption"
              sx={{ color: "error.main", display: "block", mt: 1 }}
            >
              {pdfError}
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
