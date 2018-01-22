"use strict";

module.exports = {
    amqpLinkStolen: 'This issue can occur if you have two services listening in the same consumer group. Specify a different consumer group with the `-c` flag.\nEx. `iothub-explorer monitor-events --login "<connstr>" -c testGroup`\nMore info on consumer groups: https://aka.ms/Mf8kgi'
};