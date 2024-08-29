let downloadFilesList = []
function downloadFile(fileName, content) {
    return new Promise((resolve, reject) => {
        try {
            const link = document.createElement("a");
            const file = new Blob([content], { type: 'text/plain' });
            link.href = URL.createObjectURL(file);
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(link.href);
            resolve(`download ${fileName} successfuly`)
        } catch (error) {
            reject(error)
        }

    })
};


document.getElementById('btnExportBaseClass').onclick = function () {
    reqAndRes('/contentBase', 'GET', {
        programming: document.getElementById('selProgramming').value,
        provider: objConnectDesciption.connectionDB.provider
    },
        async (dataRes) => {
            if(Array.isArray(dataRes.content)){
                for (let i = 0; i < dataRes.content.length; i++) {
                    await downloadFile(dataRes.fileName[i], dataRes.content[i])   
                }
            }else{
                await downloadFile(dataRes.fileName, dataRes.content)  
            }
        }
    )
}

document.getElementById('btnExportVO_EXE').onclick = async function () {

    document.querySelectorAll('#tbTableList * td input[type=checkbox]:checked').forEach(elChk => {
        let tbName = elChk.value
        let databaseName = document.querySelector('#tbDatabaseList tbody tr.selected td').innerHTML
        let connDetail = JSON.parse(JSON.stringify(objConnectDesciption.connectionDB))
        connDetail.databaseName = databaseName
        connDetail.tbName = tbName
        connDetail.programming = document.getElementById('selProgramming').value
        exportVO_EXE(connDetail)
            .then((data) => {
                // console.log(data)
            })
            .catch((err) => {
                console.log(err)
            })
        // console.log(elChk.value)
    });
}

document.getElementById('btnExportControl').onclick = async function () {

    document.querySelectorAll('#tbTableList * td input[type=checkbox]:checked').forEach(elChk => {
        let tbName = elChk.value
        let databaseName = document.querySelector('#tbDatabaseList tbody tr.selected td').innerHTML
        let connDetail = JSON.parse(JSON.stringify(objConnectDesciption.connectionDB))
        connDetail.databaseName = databaseName
        connDetail.tbName = tbName
        connDetail.programming = document.getElementById('selProgramming').value
        exportController(connDetail)
            .then((data) => {
                // console.log(data)
            })
            .catch((err) => {
                console.log(err)
            })
        // console.log(elChk.value)
    });
}

document.getElementById('btnExportStoreProce').onclick = async function () {

    document.querySelectorAll('#tbTableList * td input[type=checkbox]:checked').forEach(elChk => {
        let tbName = elChk.value
        let databaseName = document.querySelector('#tbDatabaseList tbody tr.selected td').innerHTML
        let connDetail = JSON.parse(JSON.stringify(objConnectDesciption.connectionDB))
        connDetail.databaseName = databaseName
        connDetail.tbName = tbName
        connDetail.programming = document.getElementById('selProgramming').value
        exportStoreProcedure(connDetail)
            .then((data) => {
                // console.log(data)
            })
            .catch((err) => {
                console.log(err)
            })
        // console.log(elChk.value)
    });
}


async function exportVO_EXE(connDetail) {
    return new Promise(async (resolve, reject) => {
        try {

            await reqAndRes('/contentVO_EXE', 'GET', connDetail, async (dataRes) => {
                if(dataRes.export){
                    if(Array.isArray(dataRes.content)){
                        for (let i = 0; i < dataRes.content.length; i++) {
                        
                            // downloadFilesList.push(dataRes)
                        
                            await downloadFile(dataRes.fileName[i], dataRes.content[i])
                        
                        }
                        resolve(`export ${dataRes.fileName[0]} succesfuly!`)
                    }else{

                        
                        downloadFilesList.push(dataRes)
                        
                        await downloadFile(dataRes.fileName, dataRes.content)
                        
                        resolve(`export ${dataRes.fileName} succesfuly!`)
                    }
                }
                else{
                    resolve(`not export!`)
                }
            })
        } catch (error) {
            reject(error)
        }
    })
}

async function exportController(connDetail) {
    return new Promise(async (resolve, reject) => {
        try {

            await reqAndRes('/contentController', 'GET', connDetail, async (dataRes) => {
                if(dataRes.export){
                    if(Array.isArray(dataRes.content)){
                        for (let i = 0; i < dataRes.content.length; i++) {
                        
                            // downloadFilesList.push(dataRes)
                        
                            await downloadFile(dataRes.fileName[i], dataRes.content[i])
                        
                        }
                        resolve(`export ${dataRes.fileName[0]} succesfuly!`)
                    }else{

                        
                        downloadFilesList.push(dataRes)
                        
                        await downloadFile(dataRes.fileName, dataRes.content)
                        
                        resolve(`export ${dataRes.fileName} succesfuly!`)
                    }
                }
                else{
                    resolve(`not export!`)
                }
            })
        } catch (error) {
            reject(error)
        }
    })
}

async function exportStoreProcedure(connDetail) {
    return new Promise(async (resolve, reject) => {
        try {

            await reqAndRes('/contentStoreProcedure', 'GET', connDetail, async (dataRes) => {
                if(dataRes.export){
                    if(Array.isArray(dataRes.content)){
                        for (let i = 0; i < dataRes.content.length; i++) {
                        
                            // downloadFilesList.push(dataRes)
                        
                            await downloadFile(dataRes.fileName[i], dataRes.content[i])
                        
                        }
                        resolve(`export ${dataRes.fileName[0]} succesfuly!`)
                    }else{

                        
                        downloadFilesList.push(dataRes)
                        
                        await downloadFile(dataRes.fileName, dataRes.content)
                        
                        resolve(`export ${dataRes.fileName} succesfuly!`)
                    }
                }
                else{
                    resolve(`not export!`)
                }
            })
        } catch (error) {
            reject(error)
        }
    })
}

document.getElementById('chkSelectAll').onchange = function () {
    if (document.getElementById('chkSelectAll').checked) {
        document.querySelectorAll('#tbTableList * input[type=checkbox]').forEach(element => {
            element.checked = true
        });
    }
    else {
        document.querySelectorAll('#tbTableList * input[type=checkbox]').forEach(element => {
            element.checked = false
        });
    }
}
