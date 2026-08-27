import { useState } from "react";
import { IconButton } from "@mui/material";

export default function InfoButton({ text }: { text: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="infoButtonWrapper">
      <IconButton
        className="infoButton"
        style={{ padding: 0, height: "1.4em", width: "1.4em", color: "inherit" }}
        onClick={() => setOpen((prev) => !prev)}
        title="Show description"
      >
        <svg
          width="1em"
          height="1em"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="8" cy="8" r="6.5" strokeWidth="1.4" />
          <circle cx="8" cy="4.9" r="0.9" fill="currentColor" stroke="none" />
          <path d="M8 7.2v4.4" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </IconButton>
      {open && (
        <div className="infoBox" onClick={() => setOpen(false)}>
          {text ?? "No preset selected yet."}
        </div>
      )}
    </span>
  );
}
