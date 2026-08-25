import type { ReactNode } from "react";
import { IconButton } from "@mui/material";

export default function TreeCategory({
  title,
  count,
  expanded,
  onToggleExpand,
  hasSettings,
  isSettingsActive,
  onToggleSettings,
  children,
}: {
  title: string;
  count: number;
  expanded: boolean;
  onToggleExpand: () => void;
  hasSettings?: boolean;
  isSettingsActive?: boolean;
  onToggleSettings?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="treeCategory">
      <div className="treeCategoryHeader" onClick={onToggleExpand}>
        <span className={`treeChevron${expanded ? " expanded" : ""}`}>▶</span>
        <span className="treeCategoryTitle">{title}</span>
        <span className="treeCategoryCount">{count}</span>
        {hasSettings && (
          <IconButton
            className={`treeCategorySettingsButton${isSettingsActive ? " active" : ""}`}
            style={{ padding: 0, height: "1em", width: "1em" }}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSettings?.();
            }}
            title="Coverage calculation settings"
          >
            <svg
              width="0.75em"
              height="0.75em"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M9.3 1c.4 0 .8.3.9.7l.3 1.3c.4.1.8.3 1.1.5l1.3-.5c.4-.2.8 0 1 .3l.9 1.6c.2.3.1.8-.2 1l-1 .9c0 .2.1.4.1.6s0 .4-.1.6l1 .9c.3.2.4.7.2 1l-.9 1.6c-.2.3-.6.5-1 .3l-1.3-.5c-.3.2-.7.4-1.1.5l-.3 1.3c-.1.4-.5.7-.9.7H6.7c-.4 0-.8-.3-.9-.7l-.3-1.3c-.4-.1-.8-.3-1.1-.5l-1.3.5c-.4.2-.8 0-1-.3l-.9-1.6c-.2-.3-.1-.8.2-1l1-.9c0-.2-.1-.4-.1-.6s0-.4.1-.6l-1-.9c-.3-.2-.4-.7-.2-1l.9-1.6c.2-.3.6-.5 1-.3l1.3.5c.3-.2.7-.4 1.1-.5l.3-1.3c.1-.4.5-.7.9-.7h2.6zM8 10.5A2.5 2.5 0 1 0 8 5.5a2.5 2.5 0 0 0 0 5z" />
            </svg>
          </IconButton>
        )}
      </div>
      {expanded && <div className="treeCategoryBody">{children}</div>}
    </div>
  );
}
