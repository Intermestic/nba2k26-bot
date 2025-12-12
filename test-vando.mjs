// Test if "vando" matches "vanderbilt"

const searchName = "vando";
const playerName = "Jarred Vanderbilt";

const parts = playerName.split(' ');
const lastName = parts[parts.length - 1].toLowerCase();

console.log('Search:', searchName);
console.log('Player:', playerName);
console.log('Last name:', lastName);
console.log('lastName === searchName:', lastName === searchName);
console.log('lastName.startsWith(searchName):', lastName.startsWith(searchName));
console.log('lastName.includes(searchName):', lastName.includes(searchName));
console.log('Match result:', lastName === searchName || lastName.startsWith(searchName) || lastName.includes(searchName));
