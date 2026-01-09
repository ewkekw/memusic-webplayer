



const avatarStyles = [
    'adventurer'
];

const commonSeeds = [
    'Max', 'Mia', 'Leo', 'Zoe', 'Sam', 'Ava', 'Ben', 'Lily', 'Tom', 'Eva', 'Alex', 'Ruby',
    'Jack', 'Chloe', 'Oscar', 'Ivy', 'Finn', 'Nora', 'Kai', 'Isla', 'Owen', 'Luna', 'Milo', 'Aria',
    'Caleb', 'Ella', 'Theo', 'Grace', 'Liam', 'Sofia', 'Noah', 'Emma', 'Oliver', 'Amelia',
    'Abby', 'Bear', 'Coco', 'Duke', 'Felix', 'Gizmo', 'Hazel', 'Jasper', 'Kiki', 'Loki',
    'Mochi', 'Nico', 'Ollie', 'Penny', 'Quinn', 'Remy', 'Sadie', 'Toby', 'Uma', 'Vince',
    'Willow', 'Xena', 'Yara', 'Zeke', 'Angel', 'Buddy', 'Charlie', 'Daisy', 'Eddie', 'Fiona',
    'George', 'Holly', 'Iggy', 'Josie', 'Kevin', 'Lola', 'Monty', 'Nina', 'Otis', 'Piper',
    'Riley', 'Simba', 'Tessa', 'Usher', 'Violet', 'Winston', 'Xylo', 'Yuki', 'Zelda',
    'Apollo', 'Bella', 'Cooper', 'Dexter', 'Frankie', 'Gigi', 'Hank', 'Indie', 'Juno', 'Kobe',
    'Lucy', 'Murphy', 'Nala', 'Paco', 'Rocco', 'Stella', 'Thor', 'Vader', 'Walter', 'Zola',
    'Archie', 'Bailey', 'Chester', 'Dobby', 'Elsa', 'Fred', 'Gus', 'Harper', 'Izzy', 'Jackson',
    'King', 'Levi', 'Mabel', 'Nelson', 'Orion', 'Peanut', 'Queenie', 'Rosie', 'Scout', 'Teddy',
    'Ulysses', 'Vinny', 'Wally', 'Yoshi', 'Ziggy', 'Bandit', 'Casey', 'Draco', 'Echo',
    'Frida', 'Ghost', 'Houdini', 'Jinx', 'Klaus', 'Lenny', 'Marvin', 'Nacho', 'Ozzy',
    'Pickles', 'Ranger', 'Shadow', 'Tito', 'Vito', 'Woody', 'Zeus', 'Axel', 'Blue', 'Clyde',
    'Anubis', 'Bacchus', 'Chaos', 'Dionysus', 'Eros', 'Freya', 'Hades', 'Iris', 'Janus', 'Kronos',
    'Leto', 'Morpheus', 'Nike', 'Orpheus', 'Pan', 'Rhea', 'Selene', 'Triton', 'Uranus', 'Zephyr'
];

const generateAvatarUrl = (style: string, seed: string) => `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

const generatedAvatars = avatarStyles.flatMap(style => 
    commonSeeds.map(seed => generateAvatarUrl(style, seed))
);

const shuffleArray = <T,>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export const defaultAvatars = shuffleArray(Array.from(new Set(generatedAvatars)));


const adjectives = ['Cosmic', 'Groovy', 'Funky', 'Retro', 'Electric', 'Sonic', 'Vivid', 'Lazy', 'Happy', 'Stellar', 'Digital', 'Golden', 'Crimson', 'Silent', 'Midnight'];
const nouns = ['Panda', 'Llama', 'Wave', 'Rhythm', 'Beat', 'Turtle', 'Robot', 'Cat', 'Dolphin', 'Voyager', 'Jukebox', 'Echo', 'Ghost', 'Dreamer', 'Traveler'];

export const generateRandomName = (): string => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
};