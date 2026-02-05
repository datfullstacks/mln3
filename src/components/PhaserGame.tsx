"use client";

import { useEffect, useRef } from "react";
import type { Game } from "phaser";

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let game: Game | null = null;
    let active = true;

    const init = async () => {
      const [{ default: Phaser }, { QuizScene }] = await Promise.all([
        import("phaser"),
        import("@/game/QuizScene"),
      ]);

      if (!active || !containerRef.current) return;

      const width = containerRef.current.clientWidth || window.innerWidth;
      const height = containerRef.current.clientHeight || window.innerHeight;

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        width,
        height,
        backgroundColor: "#0f172a",
        scene: [QuizScene],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      });

      const handleResize = () => {
        if (!containerRef.current || !game) return;
        const newWidth = containerRef.current.clientWidth || window.innerWidth;
        const newHeight = containerRef.current.clientHeight || window.innerHeight;
        game.scale.resize(newWidth, newHeight);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    };

    const cleanupPromise = init();

    return () => {
      active = false;
      cleanupPromise
        ?.then((cleanup) => {
          if (typeof cleanup === "function") cleanup();
        })
        .catch(() => {});
      game?.destroy(true);
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full" />
  );
}
