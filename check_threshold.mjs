const MIN_TRADE_MESSAGE_ID = '1440180026187321444';
const tradeId = '1448866682893500436';

console.log('MIN_TRADE_MESSAGE_ID:', MIN_TRADE_MESSAGE_ID);
console.log('Trade ID:', tradeId);
console.log('Trade ID as BigInt:', BigInt(tradeId));
console.log('MIN as BigInt:', BigInt(MIN_TRADE_MESSAGE_ID));
console.log('Is trade ID >= MIN?', BigInt(tradeId) >= BigInt(MIN_TRADE_MESSAGE_ID));

process.exit(0);
