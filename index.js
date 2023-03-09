const yargs = require("yargs");
const getAuth = require("./utils/auth");
const BitbucketClient = require("./lib/updateDeps");

const options = yargs
  .usage("Usage: -p <package>")
  .option("p", {
    alias: "packages",
    describe: "Package name",
    type: "array",
    demandOption: true,
  })
  .locale("en").argv;

(async () => {
  const packages = options.p;
  const auth = await getAuth();

  const client = new BitbucketClient(auth, packages);
  await client.init();
  await client.updateAndPull("package.json");
})();
