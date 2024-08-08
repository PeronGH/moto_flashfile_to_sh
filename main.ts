import { parseArgs } from "@std/cli";
import { parse, xml_node } from "@libs/xml";

const args = parseArgs(Deno.args);

const xmlPath = args._[0];
if (typeof xmlPath !== "string") {
    console.error("Error:", "Please provide a path to flashfile.xml.");
    Deno.exit(1);
}

const xmlFile = Deno.readTextFileSync(xmlPath);
const xml = parse(xmlFile);

// @ts-ignore - As the structure is defined, we can safely assume the types.
const steps: xml_node[] = xml["~children"][0]["~children"][1]["~children"];

console.log(`#!/bin/bash

verify_md5() {
    local file="$1"
    local expected_md5="$2"

    actual_md5=$(md5sum "$file" | awk '{print $1}')

    if [ "$actual_md5" == "$expected_md5" ]; then
        echo "MD5 checksum of '$file' matches!"
    else
        echo "MD5 checksum of '$file' does not match! Exiting."
        exit 1
    fi
}
`);

for (const step of steps) {
    const operation = step["@operation"];
    switch (operation) {
        case "getvar":
        case "oem":
            console.log("fastboot", operation, step["@var"]);
            break;
        case "flash":
            console.log("verify_md5", step["@filename"], step["@MD5"]);
            console.log(
                "fastboot",
                operation,
                step["@partition"],
                step["@filename"],
            );
            break;
        case "erase":
            console.log("fastboot", operation, step["@partition"]);
            break;
        default:
            console.error(
                "Error:",
                "Unknown operation:",
                JSON.stringify(operation),
            );
            Deno.exit(2);
    }
}
