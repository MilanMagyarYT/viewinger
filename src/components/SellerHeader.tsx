import * as React from "react";
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Button,
  IconButton,
  Badge,
  Avatar,
  Typography,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

export default function HeaderBar() {
  return (
    <>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{ justifyContent: "space-between", gap: 2 }}
          >
            {/* LEFT SIDE: logo + nav */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                fiverr
              </Typography>

              {/* hide long nav on small screens */}
              <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
                <Button>Dashboard</Button>
                <Button endIcon={"▾"}>My Business</Button>
                <Button endIcon={"▾"}>Growth & Marketing</Button>
                <Button>Analytics</Button>
              </Box>
            </Box>

            {/* RIGHT SIDE: icons/profile */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton>
                <Badge variant="dot" overlap="circular">
                  <NotificationsNoneIcon />
                </Badge>
              </IconButton>
              <IconButton>
                <MailOutlineIcon />
              </IconButton>
              <IconButton>
                <HelpOutlineIcon />
              </IconButton>
              <Avatar sx={{ width: 32, height: 32 }}>P</Avatar>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* pushes page content below the AppBar when position="fixed" */}
      {/* <Toolbar /> */}
    </>
  );
}
