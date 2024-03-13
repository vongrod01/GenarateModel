async function connMysql() {
    reqAndRes('/structureDatabase', 'get', {
        provider: 'mysql',
        databaseName: '',
        user: 'root',
        password: 'rt9125',
        host: 'localhost',
        port: '3306',
    }, async (res) => {
        console.log(res)
    })
}


async function connectDB() {
    let dataReq = {
        provider: document.getElementById('selDatabaseProvider').value,
        host: document.getElementById('edtHost').value,
        port: document.getElementById('edtPort').value,
        user: document.getElementById('edtUser').value,
        password: document.getElementById('edtPassword').value
    }

    reqAndRes('/databaseList', 'GET', dataReq, (dataRes) => {
        let tbody = document.querySelector('#tbDatabaseList tbody')
        tbody.innerHTML = ''
        let innerHTML = ''
        dataRes.forEach(dbName => {
            innerHTML += `<tr onclick = "getTableList(this)"> 
                <td>${dbName.Database}</td>
            </tr>`
        });
        tbody.innerHTML = innerHTML
    })
}

async function getTableList(el) {
    document.querySelectorAll('#tbDatabaseName tbody tr').forEach(tr => {
        tr.classList.remove('selected')

    });
    el.classList.add('selected')
    let databaseName = el.querySelector('td').innerHTML
    let dataReq = {
        provider: document.getElementById('selDatabaseProvider').value,
        host: document.getElementById('edtHost').value,
        port: document.getElementById('edtPort').value,
        user: document.getElementById('edtUser').value,
        password: document.getElementById('edtPassword').value,
        databaseName: databaseName
    }
    reqAndRes('/tableList', 'GET', dataReq, (dataRes) => {
        console.log('tableList : ', dataRes)
        let tbody = document.querySelector('#tbTableList tbody')
        tbody.innerHTML = ''
        let innerHTML = ''
        dataRes.forEach(tbName => {
            innerHTML += `
            <tr onclick = "getTable(this)"> 
                <td>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="" id="chkSelect${tbName.TableName}">
                    </div>
                </td>
                <td>${tbName.TableName}</td>
            </tr>`
        });
        tbody.innerHTML = innerHTML
    })
}

