"use client";

import * as React from "react";
import { Box, Container } from "@mui/material";
import MenuBar from "@/components/MenuBar";
import SearchBreadcrumb from "@/components/SearchBreadcrumb";
import { VIEWINGER_COLORS as COLORS } from "@/styles/colors";
import MessagesLayout from "./MessageLayout";
import ConversationsList from "./ConversationsList";

export default function MessagesPage() {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: COLORS.white,
        overflowX: "hidden",
      }}
    >
      <MenuBar />

      <Box sx={{ bgcolor: COLORS.navyDark, pt: 6, pb: 4, mt: "3rem" }}>
        <Container maxWidth="lg">
          <SearchBreadcrumb current="Messages" />
        </Container>
      </Box>

      <Container maxWidth="lg">
        <MessagesLayout
          left={<ConversationsList activeConversationId={null} />}
          right={
            <Box sx={{ p: 3 }}>Select a conversation to start messaging.</Box>
          }
        />
      </Container>
    </Box>
  );
}
