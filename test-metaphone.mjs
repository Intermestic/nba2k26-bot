import natural from 'natural';

console.log('natural exports:', Object.keys(natural));
console.log('DoubleMetaphone:', natural.DoubleMetaphone);
console.log('typeof DoubleMetaphone:', typeof natural.DoubleMetaphone);

// Try different ways to use it
try {
  const result1 = natural.DoubleMetaphone.process('test');
  console.log('DoubleMetaphone.process("test"):', result1);
} catch (e) {
  console.log('DoubleMetaphone.process failed:', e.message);
}

try {
  const dm = new natural.DoubleMetaphone();
  console.log('new DoubleMetaphone():', dm);
  const result2 = dm.process('test');
  console.log('instance.process("test"):', result2);
} catch (e) {
  console.log('new DoubleMetaphone() failed:', e.message);
}
