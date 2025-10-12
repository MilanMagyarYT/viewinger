import * as React from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ModeEditOutlineIcon from "@mui/icons-material/ModeEditOutline";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";

export default function ProfileOverview() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user)
      if (user.displayName && user.email) {
        setDisplayName(user.displayName);
        setEmail(user.email);
      }
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ width: 72, height: 72 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {displayName}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 0.5, flexWrap: "wrap" }}
            >
              <Typography variant="body2" color="text.secondary">
                @trackkkkkkk
              </Typography>

              <Typography variant="body2" color="text.secondary">
                •
              </Typography>

              <Stack direction="row" spacing={0.5} alignItems="center">
                <PlaceOutlinedIcon
                  fontSize="small"
                  sx={{ color: "text.secondary" }}
                />
                <Typography variant="body2" color="text.secondary">
                  Netherlands
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                •
              </Typography>

              <Stack direction="row" spacing={0.5} alignItems="center">
                <ModeEditOutlineIcon
                  fontSize="small"
                  sx={{ color: "text.secondary" }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textDecoration: "underline", cursor: "pointer" }}
                >
                  Add languages
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ShareOutlinedIcon />}>
            Share
          </Button>
          <Button variant="outlined" startIcon={<VisibilityOutlinedIcon />}>
            Preview
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Content */}
      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} md={8}>
          <SectionCard
            title="About"
            body="Share some details about yourself, your expertise, and what you offer."
            cta="+ Add details"
            showIllustration
          />

          <SectionCard
            title="Education"
            body="Back up your skills by adding any educational degrees or programs."
            cta="+ Add education"
          />

          <SectionCard
            title="Certifications"
            body="Showcase your mastery with certifications earned in your field."
            cta="+ Add certifications"
          />

          <SectionCard
            title="Skills and expertise"
            body={
              <>
                Let your buyers know your skills.
                <br />
                Skills gained through your previous jobs, hobbies or even
                everyday life.
              </>
            }
            cta="+ Add skills and expertise"
          />
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Quick Links
            </Typography>
            <List disablePadding>
              <ListItem disablePadding>
                <ListItemButton sx={{ borderRadius: 2 }}>
                  <ListItemText
                    primary="Gigs"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

/** Reusable section card */
function SectionCard({ title, body, cta, showIllustration = false }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
      >
        <Box sx={{ pr: 2, flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {body}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            // Intentional: no onClick handler yet
          >
            {cta.replace(/^\+\s*/, "")}
          </Button>
        </Box>

        {showIllustration && (
          <Box
            aria-hidden
            sx={{
              width: 112,
              height: 112,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {/* Simple placeholder to mimic the screenshot’s card art */}
            <Stack spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 28,
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              />
              <Chip size="small" label="A" variant="outlined" />
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
