"use client";

import {useEffect, useRef} from "react";
import {DEFAULT_HEIGHT} from "@/lib/constants";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height = DEFAULT_HEIGHT) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if(!containerRef.current) return;
        if(containerRef.current.dataset.loaded) return;
        containerRef.current.innerHTML = `<div class = "tradingview-widget-container__widget style="width: 100%; height: ${height}px;"></div>`;

            const script = document.createElement("script");
            script.src = scriptUrl;
            script.async = true;
            script.innerHTML = JSON.stringify(config);

            containerRef.current.append(script);
            containerRef.current.dataset.loaded = 'true';

            const currentContainer = containerRef.current;
            return () => {
                if(currentContainer){
                    currentContainer.innerHTML = ``;
                    delete currentContainer.dataset.loaded;
                }
            }
        },
        [scriptUrl, config, height]
    );

    return containerRef;
}
export default useTradingViewWidget
