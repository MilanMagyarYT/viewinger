"use client";

import * as React from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  IconButton,
  Divider,
  Button,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import { HostProfile, OfferDoc, PricingTier } from "./types";

import { db } from "@/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

type OfferReview = {
  id: string;
  bookingId?: string;
  offerId: string;
  authorUid: string;
  targetUid?: string;
  role?: "buyer" | "seller";
  rating: number;
  comment: string;
  createdAt?: any; // Firestore Timestamp
  // hydrated for UI:
  authorName?: string;
  authorCountry?: string;
  authorPhoto?: string;
};

function formatPrice(price?: number | null) {
  if (price == null) return "";
  return `€${price}`;
}

function formatReviewDate(ts: any) {
  const d = ts?.toDate?.() as Date | undefined;
  if (!d) return "";
  return d.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function getInitialLetter(name?: string) {
  const trimmed = (name || "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "U";
}

interface Props {
  offer: OfferDoc;
  host: HostProfile | null;
  pricingTiers: PricingTier[];
  onContact: () => void;
}

export default function OfferLeftColumn({
  offer,
  host,
  pricingTiers,
  onContact,
}: Props) {
  const hostName = host?.name || "Host";

  const coverImageSrc =
    offer.portfolio?.coverImageURL ||
    offer.coverImageURL ||
    offer.imageURL ||
    "/images/placeholder-cover.jpg";

  const videoUrl = offer.portfolio?.videoURL ?? offer.videoUrl ?? null;

  // ---------- Reviews (real) ----------
  const [reviews, setReviews] = React.useState<OfferReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setReviewsLoading(true);
      try {
        // Pull all reviews for this offer. (No orderBy to avoid needing an index.)
        const snap = await getDocs(
          query(collection(db, "reviews"), where("offerId", "==", offer.id))
        );

        // Only show buyer reviews on the offer page
        const base = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) } as OfferReview))
          .filter((r) => r.role === "buyer");

        // Sort client-side by createdAt desc
        base.sort((a, b) => {
          const am = a.createdAt?.toMillis?.() ?? 0;
          const bm = b.createdAt?.toMillis?.() ?? 0;
          return bm - am;
        });

        // Hydrate author info (name/country/photo) from users collection
        const uniqueAuthorUids = Array.from(
          new Set(base.map((r) => r.authorUid).filter(Boolean))
        );

        const authorMap = new Map<
          string,
          { name?: string; country?: string; photo?: string }
        >();

        await Promise.all(
          uniqueAuthorUids.map(async (uid) => {
            try {
              const uSnap = await getDoc(doc(db, "users", uid));
              if (!uSnap.exists()) return;

              const u = uSnap.data() as any;
              authorMap.set(uid, {
                name: u.name ?? u.displayName ?? u.legalName ?? "User",
                country:
                  u.baseCountry ?? u.country ?? u.countryOfResidence ?? "",
                photo: u.profileImage ?? u.photoURL ?? "",
              });
            } catch {
              // ignore per-user failures
            }
          })
        );

        const hydrated = base.map((r) => {
          const a = authorMap.get(r.authorUid);
          return {
            ...r,
            authorName: a?.name,
            authorCountry: a?.country,
            authorPhoto: a?.photo,
          };
        });

        if (!cancelled) setReviews(hydrated);
      } catch (err) {
        console.error("Error loading reviews:", err);
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [offer.id]);

  const ratingSummary = React.useMemo(() => {
    const count = reviews.length;
    if (!count) return { avg: null as number | null, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = sum / count;
    return { avg, count };
  }, [reviews]);

  // ---------- UI ----------
  return (
    <Box sx={{ flexBasis: { xs: "100%", md: "60%" }, flexGrow: 1 }}>
      {/* Title */}
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, mb: 2, color: COLORS.navyDark }}
      >
        {offer.title}
      </Typography>

      {/* Host summary */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2,
          borderRadius: "16px",
          border: `1px solid rgba(0,0,0,0.06)`,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar
          src={host?.profileImage || undefined}
          alt={hostName}
          sx={{
            width: 56,
            height: 56,
            bgcolor: COLORS.navy,
            flexShrink: 0,
          }}
        >
          {(hostName && hostName.charAt(0)) || "H"}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ color: COLORS.muted, mb: 0.2 }}>
            Offer listed by
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            {hostName}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <StarRoundedIcon sx={{ fontSize: 18, color: "#FFC857" }} />

            {reviewsLoading ? (
              <Typography variant="body2" sx={{ color: COLORS.muted }}>
                Loading…
              </Typography>
            ) : ratingSummary.count ? (
              <>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {ratingSummary.avg!.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.muted }}>
                  ({ratingSummary.count} review
                  {ratingSummary.count === 1 ? "" : "s"})
                </Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: COLORS.muted }}>
                No reviews yet
              </Typography>
            )}
          </Stack>
        </Box>
      </Paper>

      {/* Cover image "carousel" */}
      <Box sx={{ mb: 4, position: "relative" }}>
        <Paper
          elevation={2}
          sx={{
            borderRadius: "20px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            component="img"
            src={coverImageSrc}
            alt={offer.title}
            sx={{
              width: "100%",
              maxHeight: 420,
              objectFit: "cover",
              display: "block",
            }}
          />

          {/* Left/right buttons – no-op for now */}
          <IconButton
            sx={{
              position: "absolute",
              top: "50%",
              left: 12,
              transform: "translateY(-50%)",
              bgcolor: "rgba(45,50,80,0.8)",
              color: "#fff",
              "&:hover": { bgcolor: "rgba(45,50,80,1)" },
            }}
            onClick={() => {}}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <IconButton
            sx={{
              position: "absolute",
              top: "50%",
              right: 12,
              transform: "translateY(-50%)",
              bgcolor: "rgba(45,50,80,0.8)",
              color: "#fff",
              "&:hover": { bgcolor: "rgba(45,50,80,1)" },
            }}
            onClick={() => {}}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Box>

      {/* Reviews section (NOW REAL) */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 2, color: COLORS.navyDark }}
        >
          What people wrote about this offer
        </Typography>

        {reviewsLoading ? (
          <Typography variant="body2" sx={{ color: COLORS.muted }}>
            Loading reviews…
          </Typography>
        ) : reviews.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: "16px",
              border: `2px dashed rgba(0,0,0,0.12)`,
              p: 2.5,
              color: COLORS.muted,
            }}
          >
            No reviews yet — once a booking is completed, buyers can leave
            feedback here.
          </Paper>
        ) : (
          reviews.map((r) => (
            <Paper
              key={r.id}
              elevation={0}
              sx={{
                borderRadius: "16px",
                border: `2px solid ${COLORS.navyDark}`,
                p: 2.5,
                mb: 2,
              }}
            >
              <Stack direction="row" spacing={2}>
                <Avatar
                  src={r.authorPhoto || undefined}
                  sx={{
                    width: 44,
                    height: 44,
                    bgcolor: COLORS.navy,
                    flexShrink: 0,
                  }}
                >
                  {getInitialLetter(r.authorName)}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    sx={{ mb: 0.5 }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {r.authorName || "User"}
                      </Typography>
                      <Typography variant="body2" sx={{ color: COLORS.muted }}>
                        {r.authorCountry || "—"}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <StarRoundedIcon
                        sx={{ fontSize: 18, color: "#FFC857" }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {(Number(r.rating) || 0).toFixed(1)}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{
                      color: COLORS.muted,
                      mb: 1,
                    }}
                  >
                    {r.comment}
                  </Typography>

                  <Typography variant="caption" sx={{ color: COLORS.muted }}>
                    {formatReviewDate(r.createdAt)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))
        )}
      </Box>

      {/* About the offer */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 1.5, color: COLORS.navyDark }}
        >
          About the offer
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: 16,
            lineHeight: 1.6,
            color: COLORS.muted,
            whiteSpace: "pre-line",
          }}
        >
          {offer.description}
        </Typography>
      </Box>

      {/* Get to know host */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 2, color: COLORS.navyDark }}
        >
          Get to know {hostName}
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: "16px",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ mb: 2 }}
          >
            <Avatar
              src={host?.profileImage || undefined}
              alt={hostName}
              sx={{
                width: 72,
                height: 72,
                bgcolor: COLORS.navy,
                flexShrink: 0,
              }}
            >
              {(hostName && hostName.charAt(0)) || "H"}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {hostName}
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <StarRoundedIcon sx={{ fontSize: 20, color: "#FFC857" }} />

                {reviewsLoading ? (
                  <Typography variant="body2" sx={{ color: COLORS.muted }}>
                    Loading…
                  </Typography>
                ) : ratingSummary.count ? (
                  <>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {ratingSummary.avg!.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.muted }}>
                      ({ratingSummary.count} review
                      {ratingSummary.count === 1 ? "" : "s"})
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: COLORS.muted }}>
                    No reviews yet
                  </Typography>
                )}
              </Stack>

              <Button
                variant="contained"
                sx={{
                  mt: 0.5,
                  backgroundColor: COLORS.accent,
                  color: COLORS.navyDark,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "999px",
                  px: 3,
                  "&:hover": { backgroundColor: "#f6a76a" },
                }}
                onClick={onContact}
              >
                Contact me
              </Button>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            alignItems="flex-start"
          >
            <Box sx={{ flexBasis: { sm: "40%" } }}>
              <Typography variant="body2" sx={{ color: COLORS.muted, mb: 0.5 }}>
                From
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {host?.baseCity && host?.baseCountry
                  ? `${host.baseCity}, ${host.baseCountry}`
                  : host?.baseCountry || host?.baseCity || "—"}
              </Typography>

              <Typography variant="body2" sx={{ color: COLORS.muted, mb: 0.5 }}>
                Member since
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {host?.memberSinceLabel || "—"}
              </Typography>

              <Typography variant="body2" sx={{ color: COLORS.muted, mb: 0.5 }}>
                Languages
              </Typography>
              <Typography variant="body1">
                {host?.languagesText || "—"}
              </Typography>
            </Box>

            <Divider
              orientation="vertical"
              flexItem
              sx={{
                display: { xs: "none", sm: "block" },
                borderColor: "rgba(0,0,0,0.08)",
              }}
            />

            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: COLORS.muted, mb: 0.5 }}>
                Personal description
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: COLORS.muted,
                  whiteSpace: "pre-line",
                }}
              >
                {host?.bio ||
                  "This host hasn’t written a bio yet, but they’re ready to help with your property viewing."}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>

      {/* Video introduction */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 2, color: COLORS.navyDark }}
        >
          Video introduction
        </Typography>

        <Paper
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: "1px solid rgba(0,0,0,0.08)",
            p: 2,
          }}
        >
          {videoUrl ? (
            <Box
              component="video"
              src={videoUrl}
              controls
              sx={{ width: "100%", borderRadius: "12px" }}
            />
          ) : (
            <Box
              sx={{
                height: 220,
                borderRadius: "12px",
                border: "2px dashed rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.muted,
                fontSize: 14,
              }}
            >
              Video introduction will appear here once added for this offer.
            </Box>
          )}
        </Paper>
      </Box>

      {/* Compare packages */}
      {pricingTiers.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 2, color: COLORS.navyDark }}
          >
            Compare packages
          </Typography>

          <Paper
            elevation={0}
            sx={{
              borderRadius: "16px",
              border: "1px solid rgba(0,0,0,0.08)",
              p: 2,
            }}
          >
            <Stack spacing={2}>
              {pricingTiers.map((tier) => (
                <Box
                  key={tier.id}
                  sx={{
                    borderRadius: "12px",
                    px: 2,
                    py: 1.5,
                    bgcolor: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, mb: 0.5 }}
                  >
                    {(tier.name || tier.id).replace(/\b\w/g, (m) =>
                      m.toUpperCase()
                    )}{" "}
                    ·{" "}
                    <Box
                      component="span"
                      sx={{ color: COLORS.accent, fontWeight: 700 }}
                    >
                      {formatPrice(tier.price)}
                    </Box>
                  </Typography>

                  {tier.description && (
                    <Typography variant="body2" sx={{ color: COLORS.muted }}>
                      {tier.description}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>

            <Box sx={{ mt: 3, textAlign: "right" }}>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: COLORS.accent,
                  color: COLORS.navyDark,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "999px",
                  px: 4,
                  "&:hover": { backgroundColor: "#f6a76a" },
                }}
                onClick={onContact}
              >
                Contact seller
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
