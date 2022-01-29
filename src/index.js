const {RawIntra} = require("epitech.js");
const yargs = require("yargs/yargs");
const {hideBin} = require("yargs/helpers");
let intra = null;
let autologin = "";
let user = null;
let all, registered, modules, projects, kickoffs, followups, bootstraps;

const parseArgs = () => {
    const argv = yargs(hideBin(process.argv))
        .option("autologin", {
            alias: "auto",
            type: "string",
            description: "Epitech intranet autologin link (https://intra.epitech.eu/admin/autolog)",
            default: undefined
        }).option("all", {
            alias: "a",
            type: "boolean",
            description: "Create ics file for all modules and projects",
            default: true
        }).option("registered", {
            alias: "r",
            type: "boolean",
            description: "Create ics file for registered modules and projects (works only if module/project option is set)",
            default: false
        }).option("module", {
            alias: "m",
            type: "boolean",
            description: "Create ics file for all module",
            default: false
        }).option("project", {
            alias: "p",
            type: "boolean",
            description: "Create ics file for all projects",
            default: false
        }).option("kickoff", {
            alias: "k",
            type: "boolean",
            description: "Create ics file for all kick off",
            default: false
        }).option("followup", {
            alias: "f",
            type: "boolean",
            description: "Create ics file for all follow up",
            default: false
        }).option("bootstrap", {
            alias: "b",
            type: "boolean",
            description: "Create ics file for all bootstrap",
            default: false
        }).parse()
    autologin = argv.autologin;
    all = argv.all;
    registered = argv.registered;
    modules = argv.module;
    projects = argv.project;
    kickoffs = argv.kickoff;
    followups = argv.followup;
    bootstraps = argv.bootstrap;
    console.log("Autologin Link:", autologin);
    console.log("All projects and modules:", all);
    console.log("Only Registered:", registered);
    console.log("Only Module:", modules);
    console.log("Only Project:", projects);
    console.log("Only Kick-Off:", kickoffs);
    console.log("Only Follow Up:", followups);
    console.log("Only Bootstrap:", bootstraps);
}

const setupEpitechJs = async () => {
    intra = new RawIntra({
        autologin: autologin
    });
    let dashboard = await intra.getDashboard();
    if (!dashboard || dashboard.message) {
        console.error("Error:", dashboard.message);
        process.exit(1);
    }
}

const getModules = async () => {
    user = await intra.getUser();
    return intra.filterCourses({
        scolaryears: [parseInt(user.scolaryear)]
    });
}

const main = async () => {
    console.log("Starting...");
    parseArgs();
    console.log("[+] Parsing arguments");
    await setupEpitechJs();
    let modules = await getModules();
}

main().catch(err => {
    console.error("Error happened:", err);
    process.exit(1);
});