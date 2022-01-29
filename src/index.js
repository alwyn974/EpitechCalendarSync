const {RawIntra} = require("epitech.js");
const yargs = require("yargs/yargs");
const {hideBin} = require("yargs/helpers");
const fs = require("fs");
let intra = null;
let autologin = "";
let user = null;
let timezone = "Indian/Reunion"
let all, registered, modules, projects, kickoffs, followups, bootstraps;

/**
 * Parse arguments
 */
const parseArgs = () => {
    const argv = yargs(hideBin(process.argv))
        .option("autologin", {
            alias: "auto",
            type: "string",
            description: "Epitech intranet autologin link (https://intra.epitech.eu/admin/autolog)",
            default: undefined
        }).option("all", {
            alias: "a", type: "boolean", description: "Create ics file for all modules and projects", default: true
        }).option("registered", {
            alias: "r",
            type: "boolean",
            description: "Create ics file for registered modules and projects (works only if module/project option is set)",
            default: false
        }).option("timezone", {
            alias: "tz", type: "string", description: "Your timezone like Indian/Reunion", default: "Indian/Reunion"
        }).option("module", {
            alias: "m", type: "boolean", description: "Create ics file for all module", default: false
        }).option("project", {
            alias: "p", type: "boolean", description: "Create ics file for all projects", default: false
        }).option("kickoff", {
            alias: "k", type: "boolean", description: "Create ics file for all kick off", default: false
        }).option("followup", {
            alias: "f", type: "boolean", description: "Create ics file for all follow up", default: false
        }).option("bootstrap", {
            alias: "b", type: "boolean", description: "Create ics file for all bootstrap", default: false
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
    console.log("TimeZone: ", timezone);
    console.log("Only Module:", modules);
    console.log("Only Project:", projects);
    console.log("Only Kick-Off:", kickoffs);
    console.log("Only Follow Up:", followups);
    console.log("Only Bootstrap:", bootstraps);
}

/**
 * Instanciate and check epitech.js
 * @returns {Promise<void>}
 */
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

/**
 * Retrieve all modules
 * @returns {Promise<RawModuleSummay[]>}
 */
const getModules = async () => {
    user = await intra.getUser();
    let module = await intra.filterCourses({
        scolaryears: [parseInt(user.scolaryear)]
    });
    return module.items;
}

const convertDate = (dateStr) => {
    let date = new Date(dateStr).toISOString();
    //date = date.toISOString().replace(/[-:]/g, "");
    date = date.substring(0, date.length - 5);
    return date;
}

const createAllJson = async (modules) => {
    let all = [];
    for (let module of modules) {
        if (module.location_title === "La Réunion") {
            all.push({
                dtstart: convertDate(module.begin),
                dtend: convertDate(module.end),
                summary: module.title + (module.num !== "1" ? ` ${module.num}` : ""),
                location: module.location_title,
                categories: "Module",
                description: `${module.title} | ${module.code} | Timeline`
            }, {
                dtstart: convertDate(module.begin),
                dtend: convertDate(module.end_register),
                summary: module.title + (module.num !== "1" ? ` ${module.num}` : "") + " Registration",
                location: module.location_title,
                categories: "Registration End",
                description: `${module.title} | ${module.code} | Registration end`
            })
            let activities = (await intra.getModule({
                scolaryear: parseInt(user.scolaryear),
                module: module.code,
                instance: module.codeinstance
            })).activites;
            for (let activity of activities) { //TODO: remove boostrap, follow up and kick off (date need to be acquired from planning)
                if (activity.end_register && !activity.title.includes("#EXPERIMENTATION") && activity.type_title !== "Bootstrap") {
                    all.push(
                        {
                            dtstart: convertDate(activity.begin),
                            dtend: convertDate(activity.end),
                            summary: activity.title,
                            location: module.location_title,
                            categories: activity.type_title,
                            description: `${activity.title} | Timeline`
                        },
                        {
                            dtstart: convertDate(activity.begin),
                            dtend: convertDate(activity.end_register),
                            summary: activity.title + " Registration",
                            location: module.location_title,
                            categories: "Registration End",
                            description: `${activity.title} | Registration end`
                        });
                }
            }
        }
    }
    return all;
}

const createModulesJson = (modules) => {

}

/**
 * Create json array
 * @returns {Promise<*[]|*>}
 */
const createFinalData = async () => {
    let modules = await getModules();
    if (all) return await createAllJson(modules);
    if (modules) return await createModulesJson(modules);
    return [];
}

const jsonToIcs = (json) => {
    let date = new Date();
    json = json.filter(object => {
        let endDate = new Date(object.dtend);
        return date <= endDate;
    });
    json.forEach(object => {
        object.dtstart = object.dtstart.replace(/[-:]/g, "");
        object.dtend = object.dtend.replace(/[-:]/g, "");
    });
    fs.writeFileSync("calendar.json", JSON.stringify(json, null, 2));
    let icsContent = "BEGIN:VCALENDAR\n";
    json.forEach(event => {
        icsContent += "BEGIN:VEVENT\n";
        icsContent += `DTSTART;TZID=${timezone}:${event.dtstart}\n`;
        icsContent += `DTEND;TZID=${timezone}:${event.dtend}\n`;
        icsContent += `SUMMARY:${event.summary}\n`;
        icsContent += `LOCATION:${event.location}\n`;
        icsContent += `CATEGORIES:${event.categories}\n`;
        icsContent += `DESCRIPTION:${event.description}\n`;
        icsContent += "END:VEVENT\n";
    });
    icsContent += "END:VCALENDAR\n";
    fs.writeFileSync("calendar.ics", icsContent);
}

/**
 * Just a main
 * @returns {Promise<void>}
 */
const main = async () => {
    console.log("Starting...");
    parseArgs();
    console.log("[+] Parsing arguments");
    await setupEpitechJs();
    let json = await createFinalData();
    jsonToIcs(json);
}

main().catch(err => {
    console.error("Error happened:", err);
    process.exit(1);
});