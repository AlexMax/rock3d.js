/*
 * rock3d.js: A 3D game engine for making retro FPS games
 * Copyright (C) 2018 Alex Mayfield <alexmax2742@gmail.com>
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */

/**
 * A function that is called on a steady timer.
 */
type Ticker = (tick: number) => void;

/**
 * A function that returns a monotonic time in milliseconds.
 *
 * Usually an implementation of performance.now().
 */
type MSTime = () => number;

/**
 * A class that calls the passed callback in a loop on a given interval.
 * If the interval is missed, it attempts to catch up.
 */
export class Timer {

    /**
     * Function to use to tell time.
     */
    msTimeFn: MSTime;

    /**
     * Function to call on a timer.
     */
    tickFn: Ticker;

    /**
     * Ticks per second.
     */
    tickrate: number; 

    /**
     * Period of tick in milliseconds.
     */
    period: number;

    /**
     * Amount to scale our timer by.
     */
    scale: number;

    /**
     * Last Tick ID, increments by 1 for every tick.
     */
    lastTickID: number;

    /**
     * What time it _should_ be in milliseconds.
     */
    cursor?: number;

    /**
     * Current JS timer ID.
     */
    timer?: ReturnType<typeof setTimeout>;

    constructor(tickFn: Ticker, msTimeFn: MSTime, tickrate: number) {
        this.msTimeFn = msTimeFn;
        this.tickFn = tickFn;
        this.tickrate = tickrate;
        this.period = 1000 / tickrate;
        this.scale = 1;
        this.lastTickID = 0;
        this.tick = this.tick.bind(this);
    }

    /**
     * Start the timer.
     */
    start(): void {
        this.cursor = this.msTimeFn();
        this.timer = setTimeout(this.tick, 0);
    }

    /**
     * Stop the timer.
     */
    stop(): void {
        if (this.timer !== undefined) {
            clearTimeout(this.timer);
        }
    }

    /**
     * Set scale on period.
     */
    setScale(scale: number): void {
        this.scale = scale;
    }

    private tick(): void {
        if (this.cursor === undefined) {
            throw new Error('Timer was not started');
        }

        // Figure out our target time.
        const target = this.cursor + (this.period * this.scale);

        // Run tick function.
        this.tickFn(this.lastTickID);
        this.lastTickID += 1;

        // Move the cursor forward.
        this.cursor = target;

        // Wait for our next tick.
        const now = this.msTimeFn();
        let wait = 0;
        if (now < target) {
            // Wait the normal amount of time.
            wait = target - now;
        }

        this.timer = setTimeout(this.tick, wait);
    }
}
