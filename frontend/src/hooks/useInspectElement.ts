import { useEffect, useState } from 'react';

export function useInspectElement() {
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (!e.shiftKey) return;
      
      const target = e.target as HTMLElement;
      if (!target || !(target instanceof HTMLElement)) return;

      e.preventDefault();

      console.log('Element to inspect:', {
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        textContent: target.textContent?.substring(0, 100),
      });

      console.log('Tip: Press F12 or Ctrl/Cmd+Shift+I to open DevTools and inspect this element');
    };

    const checkDevToolsStatus = () => {
      const hasDevTools = 
        window.outerWidth - window.innerWidth > 160 ||
        window.outerHeight - window.innerHeight > 160;
      setDevToolsOpen(hasDevTools);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('resize', checkDevToolsStatus);

    checkDevToolsStatus();
    const resizeInterval = setInterval(checkDevToolsStatus, 1000);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('resize', checkDevToolsStatus);
      clearInterval(resizeInterval);
    };
  }, []);

  return { devToolsOpen };
}
