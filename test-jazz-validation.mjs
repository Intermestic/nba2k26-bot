import { validateTeamName } from './server/team-validator.ts';

console.log('Testing team validation:');
console.log('validateTeamName("Jazz"):', validateTeamName("Jazz"));
console.log('validateTeamName("jazz"):', validateTeamName("jazz"));
console.log('validateTeamName("Utah Jazz"):', validateTeamName("Utah Jazz"));
console.log('validateTeamName("utah"):', validateTeamName("utah"));
