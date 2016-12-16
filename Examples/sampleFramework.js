var fs = require('fs');
var tjs = require('../TeslaJS');

exports.SampleFramework = function SampleFramework(program, main) {
    this.program = program;
    this.tokenFound = false;
    this.main = main;

    this.login_cb = function (result) {
        if (result.error) {
            console.error("Login failed!".red);
            console.warn(JSON.stringify(result.error));
            return;
        }

        var options = { authToken: result.authToken, carIndex: program.index || 0 };
        tjs.vehicles(options, function (err, vehicle) {
            console.log("\nVehicle " + vehicle.vin + " ( '" + vehicle.display_name + "' ) is: " + vehicle.state.toUpperCase().bold.green);

            if (vehicle.state.toUpperCase() == "OFFLINE") {
                console.log("\nResult: " + "Unable to contact vehicle, exiting!".bold.red);
                return;
            }

            var carType = "Unknown";
            if (vehicle.option_codes.indexOf("MDLX") != -1) {
                carType = "Model X";
            } else {
                carType = "Model S";
            }

            console.log("\nVehicle type: " + carType.green);
            options.vehicleID = vehicle.id_s;
            if (this.main) {
                main(tjs, options);
            }
        });
    }

    this.run = function () {
        try {
            this.tokenFound = fs.statSync('.token').isFile();
        } catch (e) {
        }

        if (program.uri) {
            console.log("Setting portal URI to: " + program.uri);
            tjs.setPortalBaseURI(program.uri);
        }

        if (this.tokenFound) {
            var token = JSON.parse(fs.readFileSync('.token', 'utf8'));

            if (!token) {
                program.help();
            }

            this.login_cb({ error: false, authToken: token });
        } else {
            var username = program.username || process.env.TESLAJS_USER;
            var password = program.password || process.env.TESLAJS_PASS;

            if (!username || !password) {
                program.help();
            }

            tjs.login(username, password, this.login_cb);
        }
    }
}
