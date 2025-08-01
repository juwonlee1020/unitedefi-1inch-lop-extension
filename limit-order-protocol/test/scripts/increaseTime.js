const { time } = require('@1inch/solidity-utils');

async function main() {
  const now = await time.latest();
  console.log(`⏰ Current block timestamp: ${now} (${new Date(now * 1000).toISOString()})`);

  const start = now + 60;
  const end = now + 600;
  console.log(`📌 Start time (now + 60): ${start} (${new Date(start * 1000).toISOString()})`);
  console.log(`📌 End time (now + 600): ${end} (${new Date(end * 1000).toISOString()})`);

  const target = start + 180;
  console.log(`🚀 Advancing time to: ${target} (${new Date(target * 1000).toISOString()})`);

  await time.increaseTo(target);

  const after = await time.latest();
  console.log(`✅ New block timestamp: ${after} (${new Date(after * 1000).toISOString()})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
