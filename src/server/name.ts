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

import { arrayRandom } from "../util";

const prefixes = [
    'Alpha',
    'Amethyst',
    'Astro',
    'Aqua',
    'Blood',
    'Blue',
    'Bright',
    'Chaos',
    'Chrono',
    'Cool',
    'Crimson',
    'Cyber',
    'Dark',
    'Data',
    'Dawn',
    'Death',
    'Devil',
    'Diamond',
    'Elder',
    'Emerald',
    'Eternal',
    'Fae',
    'Fantastic',
    'Fire',
    'Funky',
    'Future',
    'Garnet',
    'God',
    'Gold',
    'Green',
    'Hip',
    'Hyper',
    'Ice',
    'Iron',
    'Jet',
    'Kilo',
    'Mega',
    'Neo',
    "Neuro",
    'Night',
    'Noble',
    'Omega',
    'Pearl',
    'Power',
    'Pro',
    'Psycho',
    'Purple',
    'Radiant',
    'Red',
    'Rogue',
    'Ruby',
    'Sapphire',
    'Shadow',
    'Silver',
    'Solar',
    'Sonic',
    'Soul',
    'Stalwart',
    'Strong',
    'Super',
    'The',
    'Thunder',
    'True',
    'Uber',
    'Ultra',
    'Unknown',
    'War',
    'Water',
    'Wind',
    'X-',
];

const suffixes = [
    'Android',
    'Archer',
    'Bear',
    'Bird',
    'Bishop',
    'Breaker',
    'Bro',
    'Caboose',
    'Camper',
    'Carnival',
    'Cavalry',
    'Cipher',
    'Commander',
    'Company',
    'Consul',
    'Crusher',
    'Dagger',
    'Damager',
    'Demon',
    'Dog',
    'Domain',
    'Donut',
    'Dragon',
    'Druid',
    'Duke',
    'Eagle',
    'Emblem',
    'Flow',
    'Force',
    'Fox',
    'Galaxy',
    'Giant',
    'Gunner',
    'Hammer',
    'Hawk',
    'Hero',
    'Hornet',
    'Hunter',
    'Keeper',
    'Killer',
    'King',
    'Knight',
    'Looper',
    'Mantis',
    'Marine',
    'Master',
    'Monarch',
    'Monkey',
    'Monster',
    'Nature',
    'Oath',
    'Ocelot',
    'Octopus',
    'Phantom',
    'Praetor',
    'Prince',
    'Prophet',
    'Quasar',
    'Queen',
    'Quest',
    'Raven',
    'Ray',
    'Robot',
    'Rogue',
    'Rook',
    'Ruler',
    'Runner',
    'Scout',
    'Senator',
    'Shadow',
    'Shield',
    'Shine',
    'Shot',
    'Silence',
    'Slasher',
    'Slayer',
    'Snake',
    'Sniper',
    'Soldier',
    'Sonic',
    'Sorcerer',
    'Soul',
    'Space',
    'Spear',
    'Spy',
    'Star',
    'Striker',
    'Sun',
    'Sword',
    'Titan',
    'Tribune',
    'Trigger',
    'Violence',
    'Vulture',
    'Walker',
    'Wand',
    'Warlock',
    'Warrior',
    'Witch',
    'Wizard',
    'Wolf',
    'Wrecker',
];

export const randomName = (): string => {
    const pre = arrayRandom(prefixes);
    for (;;) {
        var suf = arrayRandom(suffixes);
        if (pre === suf) {
            continue;
        }
        if (pre === 'Devil' && suf === 'Demon') {
            continue;
        }
        if (pre === 'Solar' && suf === 'Sun') {
            continue;
        }
        if (pre === 'War' && suf === 'Warrior') {
            continue;
        }
        break;
    }
    return pre + suf;
}
