import './datadog/tracer';
import { MongoClient } from 'mongodb';
import { setDatabaseConnection } from '../lib/mongoCollection';
import { createSqlConnection } from './sqlConnection';
import { setSqlClient } from '../lib/sql/sqlClient';
import PgCollection from '../lib/sql/PgCollection';
import SwitchingCollection from '../lib/SwitchingCollection';
import { Collections } from '../lib/vulcan-lib/getCollection';
import { runStartupFunctions, isAnyTest } from '../lib/executionEnvironment';
import { forumTypeSetting } from "../lib/instanceSettings";
import { refreshSettingsCaches } from './loadDatabaseSettings';
import { getCommandLineArguments } from './commandLine';
import { startWebserver } from './apolloServer';
import { initGraphQL } from './vulcan-lib/apollo-server/initGraphQL';
import { createVoteableUnionType } from './votingGraphQL';
import { setServerShellCommandScope } from './serverShellCommand';
import { Globals, Vulcan } from '../lib/vulcan-lib/config';
import { getBranchDbName } from "./branchDb";
import { replaceDbNameInPgConnectionString } from "../lib/sql/tests/testingSqlClient";
import process from 'process';

async function serverStartup() {
  // eslint-disable-next-line no-console
  console.log("Starting server");

  setServerShellCommandScope({Vulcan, Globals});

  const isTTY = process.stdout.isTTY;
  const CSI = "\x1b[";
  const blue = isTTY ? `${CSI}34m` : "";
  const endBlue = isTTY ? `${CSI}39m` : "";
  
  wrapConsoleLogFunctions((log, ...message) => {
    process.stdout.write(`${blue}${new Date().toISOString()}:${endBlue} `);
    log(...message);
    
    // Uncomment to add stacktraces to every console.log, for debugging where
    // mysterious output came from.
    //var stack = new Error().stack
    //log(stack)
  });
  
  const commandLineArguments = getCommandLineArguments();
  
  try {
    // eslint-disable-next-line no-console
    console.log("Connecting to mongodb");
    const client = new MongoClient(commandLineArguments.mongoUrl, {
      // See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html
      // for various options that could be tuned here
      
      // A deprecation warning says to use this option 
      useUnifiedTopology: true,
    });
    await client.connect();
    const db = client.db();
    setDatabaseConnection(client, db);
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error("Failed to connect to mongodb: ", err);
    process.exit(1);
  }

  try {
    let connectionString = commandLineArguments.postgresUrl;
    if (!connectionString) {
      throw new Error("No postgres connection string provided");
    }
    const branchDb = await getBranchDbName();
    if (branchDb) {
      connectionString = replaceDbNameInPgConnectionString(connectionString, branchDb);
    }
    const dbName = /.*\/(.*)/.exec(connectionString)?.[1];
    // eslint-disable-next-line no-console
    console.log(`Connecting to postgres (${dbName})`);
    const sql = await createSqlConnection(connectionString);
    setSqlClient(sql);
  } catch(err) {
    // eslint-disable-next-line no-console
    console.error("Failed to connect to postgres: ", err.message);
    // TODO: Remove forum gating here when we expand Postgres usage
    if (forumTypeSetting.get() === "EAForum") {
      process.exit(1);
    }
  }

  // eslint-disable-next-line no-console
  console.log("Loading settings");
  await refreshSettingsCaches();
  
  require('../server.ts');
  
  // eslint-disable-next-line no-console
  console.log("Running onStartup functions");
  await runStartupFunctions();

  // eslint-disable-next-line no-console
  console.log("Building postgres tables");
  for (const collection of Collections) {
    if (collection instanceof PgCollection || collection instanceof SwitchingCollection) {
      collection.buildPostgresTable();
    }
  }

  // eslint-disable-next-line no-console
  console.log("Initializing switching collections from lock table");
  for (const collection of Collections) {
    if (collection instanceof SwitchingCollection) {
      collection.startPolling();
    }
  }

  // define executableSchema
  createVoteableUnionType();
  initGraphQL();
  
  if (commandLineArguments.shellMode) {
    initShell();
  } else {
    if (!isAnyTest) {
      // eslint-disable-next-line no-console
      console.log("Starting webserver");
      startWebserver();
    }
  }
  
  /*if (process.stdout.isTTY) {
    console.log("Output is a TTY");
    initShell();
    
    const origConsoleLog = console.log;
    console.log = (message) => wrappedConsoleLog(origConsoleLog, message);
  }*/
}

function wrapConsoleLogFunctions(wrapper: (originalFn: any, ...message: any[])=>void) {
  for (let functionName of ["log", "info", "warn", "error", "trace"]) {
    // eslint-disable-next-line no-console
    const originalFn = console[functionName];
    // eslint-disable-next-line no-console
    console[functionName] = (...message: any[]) => {
      wrapper(originalFn, ...message);
    }
  }
}

function wrappedConsoleLog(unwrappedConsoleLog: (...messages: string[])=>void, message: string)
{
  const screenHeight = process.stdout.rows;
  const ESC = '\x1b';
  const CSI = ESC+'[';
  
  process.stdout.write(`${CSI}s`); // Save cursor
  process.stdout.write(`${CSI}1;${screenHeight-2}r`); // Set scroll region
  process.stdout.write(`${CSI}${screenHeight-2};1H`); // Move cursor to insertion point
  process.stdout.write(message+"\n"); // Write the output
  process.stdout.write(`${CSI}r`); // Clear scroll region
  process.stdout.write(`${CSI}u`); // Restore cursor
}

function initShell()
{
  const repl = require('repl');
  /*const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });
  rl.on('line', line => {
    console.log(`Got input: ${line}`);
    rl.prompt();
  });
  rl.prompt();*/
  
  const r = repl.start({
    prompt: "> ",
    terminal: true,
    preview: true,
    breakEvalOnSigint: true,
    useGlobal: true,
  });
  r.context.Globals = Globals;
  r.context.Vulcan = Globals;
}

void serverStartup();
