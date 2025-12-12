"use client";

import * as React from "react";
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { DashboardProfileState } from "./DashboardProfileColumn";

type Props = {
  open: boolean;
  profile: DashboardProfileState;
  setProfile: React.Dispatch<React.SetStateAction<DashboardProfileState>>;
  uploading: boolean;
  previewUrl: string;
  fileName?: string;
  onClose: () => void;
  onSave: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function ProfileEditDialog({
  open,
  profile,
  setProfile,
  uploading,
  previewUrl,
  fileName,
  onClose,
  onSave,
  onFileChange,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: COLORS.navyDark, fontWeight: 700 }}>
        Edit profile
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Full name"
            value={profile.name}
            onChange={(e) =>
              setProfile((p) => ({ ...p, name: e.target.value }))
            }
          />
          <TextField label="Email" value={profile.email} disabled />
          <TextField
            label="Phone"
            value={profile.phone}
            onChange={(e) =>
              setProfile((p) => ({ ...p, phone: e.target.value }))
            }
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="City"
              value={profile.city}
              onChange={(e) =>
                setProfile((p) => ({ ...p, city: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Country"
              value={profile.country}
              onChange={(e) =>
                setProfile((p) => ({ ...p, country: e.target.value }))
              }
              fullWidth
            />
          </Stack>
          <TextField
            label="Languages spoken"
            value={profile.languages}
            onChange={(e) =>
              setProfile((p) => ({ ...p, languages: e.target.value }))
            }
          />
          <TextField
            label="Years of experience"
            type="number"
            value={profile.yearsOfExperience}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                yearsOfExperience: e.target.value,
              }))
            }
          />
          <TextField
            label="Short bio"
            multiline
            minRows={3}
            value={profile.bio}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
          />

          {/* Profile image upload */}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Profile picture
            </Typography>
            <Button
              component="label"
              variant="contained"
              sx={{
                backgroundColor: COLORS.navyDark,
                color: COLORS.white,
                textTransform: "none",
                "&:hover": { backgroundColor: COLORS.navy },
                alignSelf: "flex-start",
              }}
            >
              Choose image
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={onFileChange}
              />
            </Button>

            {(previewUrl || profile.profileImage) && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  src={previewUrl || profile.profileImage}
                  alt="Profile"
                  sx={{ width: 56, height: 56 }}
                />
                <Typography variant="body2">
                  {fileName || "Current profile picture"}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ color: COLORS.navyDark }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={uploading}
          sx={{
            backgroundColor: COLORS.accent,
            color: COLORS.navyDark,
            "&:hover": { backgroundColor: "#f6a76a" },
          }}
        >
          {uploading ? "Saving..." : "Save changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
