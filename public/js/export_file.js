function downloadFile(fileName, content) {
    const link = document.createElement("a");

    const file = new Blob([content], { type: 'text/plain' });
    link.href = URL.createObjectURL(file);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
};


document.getElementById('btnExportBaseClass').onclick = function () {
    reqAndRes('/contentBase', 'GET', {
        programming: document.getElementById('selProgramming').value,
        provider: objConnectDesciption.connectionDB.provider
    },
        (dataRes) => {
            downloadFile(dataRes.fileName, dataRes.content)
        }
    )
}

document.getElementById('btnExportVO_EXE').onclick = async function () {
    
    document.querySelectorAll('#tbTableList * input:checked').forEach(elChk => {
        let tbName = elChk.value
        let databaseName = document.querySelector('#tbDatabaseList tbody tr.selected td').innerHTML
        let connDetail = JSON.parse(JSON.stringify(objConnectDesciption.connectionDB))
        connDetail.databaseName = databaseName
        connDetail.tbName = tbName
        exportVO_EXE(connDetail)
        // console.log(elChk.value)
    });
}
async function exportVO_EXE(connDetail) {
    return new Promise((resolve, reject) => {
        try {
            
            reqAndRes('/contentVO_EXE', 'GET', connDetail, (dataRes) => {
                downloadFile(dataRes.fileName, dataRes.content)
                resolve(`export ${dataRes.fileName} succesfuly!`)
            })
        } catch (error) {
            reject(error)
        }
    })
}
