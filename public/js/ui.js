// UI layer for the Liquid Glass theme.
// Works on top of fe_connect_db.js / fe_export_file.js without changing their logic:
// it watches the tables they fill and drives the screens, counters, and export sheet.
(function () {
    const $id = (id) => document.getElementById(id)
    const body = document.body

    // ---------- toast (also replaces the missing SweetAlert used by helper.js) ----------
    let toastTimer = null
    function toast(message, isError = false) {
        const el = $id('pnlToast')
        el.textContent = message
        el.classList.toggle('error', isError)
        el.hidden = false
        clearTimeout(toastTimer)
        toastTimer = setTimeout(() => { el.hidden = true }, 4000)
    }
    if (typeof window.Swal === 'undefined') {
        window.Swal = {
            fire(title, text, icon) {
                setConnecting(false)
                if (String(text).includes('databaseList')) {
                    toast("Couldn't connect — check host, port, user and password.", true)
                    return
                }
                const msg = [title, text].filter(Boolean).join(' — ') || 'Something went wrong'
                toast(icon === 'error' ? 'Request failed: ' + msg : msg, icon === 'error')
            }
        }
    }

    // ---------- remembered connection (never the password) ----------
    const PREF_KEY = 'heartcode.connection'
    function loadPrefs() {
        try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {} } catch (e) { return {} }
    }
    function savePrefs(p) {
        try { localStorage.setItem(PREF_KEY, JSON.stringify(p)) } catch (e) { }
    }

    // ---------- provider segmented control ----------
    const providerInput = $id('selDatabaseProvider')
    const segButtons = Array.from(document.querySelectorAll('#segProvider button'))
    const defaultPorts = segButtons.map((b) => b.dataset.port)
    function setProvider(value) {
        const portEl = $id('edtPort')
        segButtons.forEach((b) => {
            const on = b.dataset.value === value
            b.setAttribute('aria-checked', on ? 'true' : 'false')
            if (on && (portEl.value === '' || defaultPorts.includes(portEl.value))) portEl.value = b.dataset.port
        })
        providerInput.value = value
    }
    segButtons.forEach((b) => b.addEventListener('click', () => setProvider(b.dataset.value)))

    const prefs = loadPrefs()
    if (prefs.provider) setProvider(prefs.provider)
    if (prefs.host) $id('edtHost').value = prefs.host
    if (prefs.port) $id('edtPort').value = prefs.port
    if (prefs.user) $id('edtUser').value = prefs.user
    if (prefs.programming) $id('selProgramming').value = prefs.programming
    $id('selProgramming').addEventListener('change', () => {
        savePrefs(Object.assign(loadPrefs(), { programming: $id('selProgramming').value }))
    })

    // ---------- connect ----------
    function setConnecting(on) {
        const btn = $id('btnConnect')
        btn.classList.toggle('loading', on)
        btn.querySelector('span').textContent = on ? 'Connecting…' : 'Connect'
    }
    $id('frmConnect').addEventListener('submit', (e) => {
        e.preventDefault()
        savePrefs(Object.assign(loadPrefs(), {
            provider: providerInput.value,
            host: $id('edtHost').value,
            port: $id('edtPort').value,
            user: $id('edtUser').value
        }))
        setConnecting(true)
        connectDB()
    })

    $id('btnDisconnect').addEventListener('click', () => {
        body.classList.remove('connected')
        ;['tbDatabaseList', 'tbTableList', 'tbTableDesciption'].forEach((id) => {
            document.querySelector('#' + id + ' tbody').innerHTML = ''
        })
        $id('edtPassword').value = ''
        $id('txtFocusedTable').textContent = '—'
        setTimeout(() => $id('edtPassword').focus(), 50)
    })

    // ---------- watch the tables filled by fe_connect_db.js ----------
    const dbBody = document.querySelector('#tbDatabaseList tbody')
    const tableBody = document.querySelector('#tbTableList tbody')
    const fieldBody = document.querySelector('#tbTableDesciption tbody')

    new MutationObserver(() => {
        const n = dbBody.querySelectorAll('tr').length
        if (n > 0) {
            setConnecting(false)
            const seg = segButtons.find((b) => b.dataset.value === providerInput.value)
            $id('txtConnProvider').textContent = seg ? seg.textContent : providerInput.value
            $id('txtConnHost').textContent = $id('edtHost').value + ':' + $id('edtPort').value
            body.classList.add('connected')
        }
        $id('txtDbCount').textContent = n ? String(n) : ''
        applyFilter('#tbDatabaseList')
    }).observe(dbBody, { childList: true })

    new MutationObserver(() => {
        updateCounts()
        applyFilter('#tbTableList')
        if (!tableBody.querySelector('tr')) {
            $id('txtFocusedTable').textContent = '—'
        }
    }).observe(tableBody, { childList: true })

    new MutationObserver(() => {
        // pill-style the "Type" column
        fieldBody.querySelectorAll('tr td:nth-child(2)').forEach((td) => {
            if (!td.querySelector('span')) {
                const span = document.createElement('span')
                span.textContent = td.textContent.trim()
                td.textContent = ''
                td.appendChild(span)
            }
        })
        const sel = document.querySelector('#tbTableList tbody tr.selected td:nth-child(2)')
        $id('txtFocusedTable').textContent = sel ? sel.textContent.trim() : '—'
    }).observe(fieldBody, { childList: true })

    // ticking a checkbox should not also reload the field list
    $id('tbTableList').addEventListener('click', (e) => {
        if (e.target.matches('input[type=checkbox]')) e.stopPropagation()
    }, true)
    $id('tbTableList').addEventListener('change', updateCounts)
    $id('chkSelectAll').addEventListener('change', () => setTimeout(updateCounts, 0))

    function checkedTables() {
        return Array.from(tableBody.querySelectorAll('td input[type=checkbox]:checked')).map((c) => c.value)
    }
    function updateCounts() {
        const total = tableBody.querySelectorAll('tr').length
        const n = checkedTables().length
        $id('txtTableSummary').textContent = total ? `${total} tables · ${n} selected` : ''
        $id('txtSelectedCount').textContent = n === 0 ? 'No tables selected' : `${n} ${n === 1 ? 'table' : 'tables'}`
        const all = total > 0 && n === total
        $id('chkSelectAll').checked = all
        $id('txtSelectAll').textContent = all ? 'Deselect all' : 'Select all'
        ;['btnExportVO_EXE', 'btnExportControl', 'btnExportStoreProce', 'btnExportIndexTable'].forEach((id) => {
            $id(id).disabled = n === 0
        })
    }

    // ---------- search filters ----------
    function applyFilter(tableSel) {
        const input = document.querySelector(`[data-filter="${tableSel}"]`)
        const q = (input ? input.value : '').trim().toLowerCase()
        document.querySelectorAll(tableSel + ' tbody tr').forEach((tr) => {
            tr.hidden = q !== '' && !tr.textContent.toLowerCase().includes(q)
        })
    }
    document.querySelectorAll('[data-filter]').forEach((input) => {
        input.addEventListener('input', () => applyFilter(input.dataset.filter))
    })

    // ---------- export sheet ----------
    const sheet = $id('pnlExportSheet')
    const switches = Array.from(document.querySelectorAll('.switch-row'))
    let lastFocus = null

    function sheetFileCount() {
        const nTables = checkedTables().length
        return switches.reduce((sum, s) => {
            if (s.getAttribute('aria-checked') !== 'true' || s.disabled) return sum
            return sum + (s.dataset.scope === 'table' ? nTables : 1)
        }, 0)
    }
    function refreshSheet() {
        const n = sheetFileCount()
        $id('txtExportSummary').textContent = n === 0 ? 'Nothing selected' : `${n} ${n === 1 ? 'file' : 'files'}`
        $id('btnDoExport').disabled = n === 0
    }
    function openSheet() {
        const tables = checkedTables()
        const db = document.querySelector('#tbDatabaseList tbody tr.selected td')
        const prog = $id('selProgramming')
        $id('txtExportContext').textContent =
            [prog.options[prog.selectedIndex].text, db ? db.textContent.trim() : '', `${tables.length} ${tables.length === 1 ? 'table' : 'tables'}`]
                .filter(Boolean).join(' · ')
        const chips = $id('pnlExportTables')
        chips.innerHTML = ''
        if (tables.length === 0) {
            const s = document.createElement('span')
            s.className = 'warn'
            s.textContent = 'No tables selected — only project files can be exported'
            chips.appendChild(s)
        }
        tables.forEach((t) => {
            const s = document.createElement('span')
            s.textContent = t
            chips.appendChild(s)
        })
        switches.forEach((s) => { if (s.dataset.scope === 'table') s.disabled = tables.length === 0 })
        $id('pnlExportForm').hidden = false
        $id('pnlExportDone').hidden = true
        refreshSheet()
        lastFocus = document.activeElement
        sheet.hidden = false
        $id('btnCloseExport').focus()
    }
    function closeSheet() {
        sheet.hidden = true
        if (lastFocus) lastFocus.focus()
    }
    switches.forEach((s) => s.addEventListener('click', () => {
        s.setAttribute('aria-checked', s.getAttribute('aria-checked') === 'true' ? 'false' : 'true')
        refreshSheet()
    }))
    $id('btnOpenExport').addEventListener('click', openSheet)
    $id('btnCloseExport').addEventListener('click', closeSheet)
    $id('btnCancelExport').addEventListener('click', closeSheet)
    $id('btnExportDone').addEventListener('click', closeSheet)
    $id('btnExportMore').addEventListener('click', () => {
        $id('pnlExportForm').hidden = false
        $id('pnlExportDone').hidden = true
        refreshSheet()
    })
    sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet() })
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) closeSheet() })

    $id('btnDoExport').addEventListener('click', async () => {
        const n = sheetFileCount()
        const targets = switches.filter((s) => s.getAttribute('aria-checked') === 'true' && !s.disabled)
        for (const s of targets) {
            $id(s.dataset.target).click() // reuse the existing export handlers
            await new Promise((r) => setTimeout(r, 300))
        }
        $id('txtDoneTitle').textContent = `Exported ${n} ${n === 1 ? 'file' : 'files'}`
        $id('pnlExportForm').hidden = true
        $id('pnlExportDone').hidden = false
        $id('btnExportDone').focus()
    })

    updateCounts()
})()
