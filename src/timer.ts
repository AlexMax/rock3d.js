/**
 * rock3d.js: A 3D game engine with a retro heart.
 * Copyright (C) 2018-2019  Alex Mayfield <alexmax2742@gmail.com>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
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
    start() {
        this.cursor = this.msTimeFn();
        this.timer = setTimeout(this.tick, 0);
    }

    /**
     * Stop the timer.
     */
    stop() {
        if (this.timer !== undefined) {
            clearTimeout(this.timer);
        }
    }

    /**
     * Set scale on period.
     */
    setScale(scale: number) {
        this.scale = scale;
    }

    private tick() {
        if (this.cursor === undefined) {
            throw new Error('Timer was not started');
        }

        // Figure out our target time.
        let target = this.cursor + (this.period * this.scale);

        // Run tick function.
        this.tickFn(this.lastTickID);
        this.lastTickID += 1;

        // Move the cursor forward.
        this.cursor = target;

        // Wait for our next tick.
        const now = this.msTimeFn();
        if (now < target) {
            // Wait the normal amount of time.
            var wait = target - now;
        } else {
            // We overshot our target, try and catch up.
            var wait = 0;
        }

        this.timer = setTimeout(this.tick, wait);
    }
}
