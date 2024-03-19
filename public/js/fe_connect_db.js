let objConnectDesciption = {
    connectionDB : {
        provider: '',
        host: '',
        port: 0,
        user: '',
        password: ''
    },
    desciption : {
        databaseName:'',
        tbName:{
            selectedCurrent : '',
            selectedList :[]
        }
    }
}



async function connectDB() {

    objConnectDesciption.connectionDB.provider =  document.getElementById('selDatabaseProvider').value
    objConnectDesciption.connectionDB.host =  document.getElementById('edtHost').value
    objConnectDesciption.connectionDB.port =  document.getElementById('edtPort').value
    objConnectDesciption.connectionDB.user =  document.getElementById('edtUser').value
    objConnectDesciption.connectionDB.password =  document.getElementById('edtPassword').value
    reqAndRes('/databaseList', 'GET', objConnectDesciption.connectionDB, (dataRes) => {
        let tbody = document.querySelector('#tbDatabaseList tbody')
        tbody.innerHTML = ''
        
        let innerHTML = ''
        dataRes.forEach(dbName => {
            innerHTML += `<tr onclick = "getTableList(this)"> 
                <td>${dbName.Database}</td>
            </tr>`
        });
        tbody.innerHTML = innerHTML
        tbody.querySelector('tr').click()
    })
}

async function getTableList(el) {
    document.querySelectorAll('#tbDatabaseList tbody tr').forEach(tr => {
        tr.classList.remove('selected')

    });
    el.classList.add('selected')
    let databaseName = el.querySelector('td').innerHTML
    let dataReq = JSON.parse(JSON.stringify(objConnectDesciption.connectionDB))
    dataReq.databaseName = databaseName
    reqAndRes('/tableList', 'GET', dataReq, (dataRes) => {

        let tbody = document.querySelector('#tbTableList tbody')
        tbody.innerHTML = ''
        document.getElementById('chkSelectAll').checked = false
        let innerHTML = ''
        dataRes.forEach(tbName => {
            innerHTML += `
            <tr onclick = "getTableDescription(this)"> 
                <td>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${tbName.TableName}" id="chkSelect${tbName.TableName}">
                    </div>
                </td>
                <td>${tbName.TableName}</td>
            </tr>`
        });
        tbody.innerHTML = innerHTML
        tbody.querySelector('tr').click()
    })
}

async function getTableDescription(el) {
    document.querySelectorAll('#tbTableList tbody tr').forEach(tr => {
        tr.classList.remove('selected')

    });
    el.classList.add('selected')
    let tbName = el.querySelector('td:nth-child(2)').innerHTML
    let databaseName = document.querySelector('#tbDatabaseList tbody tr.selected td').innerHTML
    let dataReq = JSON.parse(JSON.stringify(objConnectDesciption.connectionDB))
    dataReq.databaseName = databaseName
    dataReq.tbName = tbName
    
    reqAndRes('/tableDescription', 'GET', dataReq, (dataRes) => {
        let tbody = document.querySelector('#tbTableDesciption tbody')
        tbody.innerHTML = ''
        let innerHTML = ''
        dataRes[1].forEach(desciption => {
            innerHTML += `
            <tr> 
               
                <td>${desciption.FieldName}</td>
                <td>${desciption.FieldType}</td>
                <td>${desciption.FieldTypeDefine}</td>
                <td>${desciption.FieldSize}</td>
            </tr>`
        });
        tbody.innerHTML = innerHTML

    })
}

