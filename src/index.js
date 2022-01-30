const {RawIntra} = require("epitech.js");
const yargs = require("yargs/yargs");
const {hideBin} = require("yargs/helpers");
const fs = require("fs");
const { zonedTimeToUtc, utcToZonedTime, format } = require("date-fns-tz")

let intra = null;
let autologin = "";
let user = null;
let timezone = "Indian/Reunion"
let instance_location = "FR/RUN";
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
    timezone = argv.timezone;
    modules = argv.module;
    projects = argv.project;
    kickoffs = argv.kickoff;
    followups = argv.followup;
    bootstraps = argv.bootstrap;
    console.log("Autologin Link:", autologin);
    console.log("All projects and modules:", all);
    console.log("Only Registered:", registered);
    console.log("TimeZone:", timezone);
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
    instance_location = user.location;
    let a = {};
    a = intra;
    a = a.request;
    a = a.client;
    a.defaults.headers.Cookie = `tz=${timezone}`;
    let module = await intra.filterCourses({
        scolaryears: [parseInt(user.scolaryear)]
    });
    return module.items;
}

/**
 * Return the date for ics
 * @param dateStr the date
 * @param removeOneDay only for registration
 * @param replace for the json
 * @returns {string}
 */
const convertDate = (dateStr, removeOneDay = false, replace = false) => {
    let date = zonedTimeToUtc(dateStr, "UTC");
    if (removeOneDay)
        date.setUTCDate(date.getUTCDate() - 1);
    let year = date.getUTCFullYear();
    let month = (date.getUTCMonth() + 1) < 10 ? `0${date.getUTCMonth() + 1}` : date.getUTCMonth() + 1;
    let day = date.getUTCDate() < 10 ? `0${date.getUTCDate()}` : date.getUTCDate();
    let hours = date.getUTCHours() < 10 ? `0${date.getUTCHours()}` : date.getUTCHours();
    let minutes = date.getUTCMinutes() < 10 ? `0${date.getUTCMinutes()}` : date.getUTCMinutes();
    let seconds = date.getUTCSeconds() < 10 ? `0${date.getUTCSeconds()}` : date.getUTCSeconds();
    if (replace)
        date = `${year}${month}${day}T${hours}${minutes}${seconds}`;
    else
        date = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    return date;
}

/**
 * Create a json of modules/projects
 * @param modules the modules
 * @returns {Promise<*[]>}
 */
const createAllJson = async (modules) => {
    let all = [];
    for (let module of modules) {
        if (module.instance_location === instance_location) {
            all.push({
                dtstart: convertDate(module.begin),
                dtend: convertDate(module.end),
                summary: module.title + (module.num !== "1" ? ` ${module.num}` : ""),
                location: module.location_title,
                categories: "Module",
                description: `${module.title} | ${module.code} | Timeline`
            }, {
                dtstart: convertDate(module.end_register, true),
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
            for (let activity of activities) {
                if (activity.end_register && !activity.title.includes("#EXPERIMENTATION") && activity.type_title !== "Bootstrap" && activity.codeacti === "acti-499675") {
                    all.push(
                        {
                            dtstart: convertDate(activity.begin, false, false),
                            dtend: convertDate(activity.end, false, false),
                            summary: activity.title,
                            location: module.location_title,
                            categories: activity.type_title,
                            description: `${activity.title} | Timeline`
                        },
                        {
                            dtstart: convertDate(activity.end_register, true, false),
                            dtend: convertDate(activity.end_register, false, false),
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
        object.dtstart = convertDate(object.dtstart, false, true);
        object.dtend = convertDate(object.dtend, false, true);
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