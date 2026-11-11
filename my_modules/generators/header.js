const fs = require("fs")
const path = require("path")

let systemConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'SystemConfig.json'), 'utf-8'))

function header() {
    let dt = new Date();
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    dformat = `${dt.getDate()}-${month[dt.getMonth()]}-${dt.getFullYear()} ${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}`

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

    const now = new Date();

    const pad = (n) => n.toString().padStart(2, '0');

    const formattedDate =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

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
