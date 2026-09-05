import { seedDemo } from "../src/lib/demo/seed";

/** 用法：DATABASE_URL='...' npx tsx scripts/seed-demo.ts demo@archivum.test */
seedDemo(process.argv[2] ?? "demo@archivum.test")
  .then((summary) => {
    console.log(summary);
    process.exit(0);
  })
  .catch((err) => {
    console.error("失敗:", err.message);
    process.exit(1);
  });
