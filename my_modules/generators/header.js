// require() of a .json works in Node and is inlined by bundlers (the Cloudflare Worker has no fs)
const systemConfig = require('../../SystemConfig.json')

// `now` is injectable for tests. The stamp is always Asia/Bangkok time (UTC+7, no DST), computed
// from UTC so it is the same on a Bangkok laptop and on a Cloudflare Worker (which runs in UTC).
function header(now = new Date()) {
    let dt = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dformat = `${dt.getUTCDate()}-${month[dt.getUTCMonth()]}-${dt.getUTCFullYear()} ${dt.getUTCHours()}:${dt.getUTCMinutes()}:${dt.getUTCSeconds()}`

    // let genDateStr = `Generate Date : ${dformat}`
    // let headerStr = `Generate By Genarate MVC : Ver ${systemConfig.description.version} (Developed by ${systemConfig.description.developer}) | ${genDateStr}`

    // let frame = ``
    // for (let i = 1; i <= 5; i++) {
    //     if (i === 1 || i === 5) {
    //         frame += '##########'
    //         headerStr.split('').map(() => {
    //             frame += '#'
    //         })
    //     }
    //     else if (i === 2 || i === 4) {
    //         frame += '#    '
    //         headerStr.split('').map(() => {
    //             frame += ' '
    //         })
    //         frame += '    #'
    //     }
    //     else if (i === 3) {
    //         frame += '#    ' + headerStr + '    #'
    //     }

    //     frame += '\n'
    // }

    // return frame

    const lines = [
        "===============================================================================",
        "",
        `Generator : ${systemConfig.description.titleHeader} v${systemConfig.description.version}`,
        `Author    : ${systemConfig.description.developer}`,
        `Generated : ${dformat} (Asia/Bangkok)`,
        '',
        "==============================================================================="
    ];
    let h = lines.map(line => `# ${line}`).join("\n");
    return h + '\n';
}

module.exports.header = header
