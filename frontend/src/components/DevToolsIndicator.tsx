import { useInspectElement } from '../hooks/useInspectElement';

export function DevToolsIndicator() {
  const { devToolsOpen } = useInspectElement();

  if (!devToolsOpen) return null;

  return (
    <div className="devtools-indicator">
      <div className="devtools-badge">DevTools Open</div>
      <div className="devtools-tip">
        Shift + Right-click any element to inspect it
        <br />
        Press F12 or Ctrl/Cmd + Shift + I to open DevTools
      </div>
    </div>
  );
}
