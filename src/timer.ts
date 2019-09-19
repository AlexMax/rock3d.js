/**
 * rock3d.js: A 3D rendering engine with a retro heart.
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
    msTimeFn: MSTime; // Function to use to tell time.
    tickFn: Ticker; // Function to call on a timer.
    tps: number; // Ticks per second.
    period: number; // Period of tick in milliseconds.
    cursor: number; // What time it _should_ be in milliseconds.
    lastTickID: number; // Last Tick ID, increments by 1 for every tick.
    timer: ReturnType<typeof setTimeout>; // Current JS timer ID.

    constructor(tickFn: Ticker, msTimeFn: MSTime, tps: number) {
        this.msTimeFn = msTimeFn;
        this.tickFn = tickFn;
        this.tps = tps;
        this.period = 1000 / tps;
        this.cursor = msTimeFn();
        this.lastTickID = 0;
        this.tick = this.tick.bind(this);

        // Run our callback immediately.
        this.timer = setTimeout(this.tick, 0);
    }

    tick() {
        // Figure out our target time.
        let target = this.cursor + this.period;

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

        console.log(wait);
        this.timer = setTimeout(this.tick, wait);
    }
}
