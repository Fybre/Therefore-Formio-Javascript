# Therefore Formio JavaScript Library — Reference

Browser-side JavaScript library for integrating the Therefore REST API into Formio eforms.
Registers all classes and utilities under `window.Therefore`.

## Loading the Library

Include `formio.js` in the Therefore eform portal — the library is injected via `formio-inject.js`.
Once loaded, everything is available as:

```javascript
const { ThereforeClient, IndexData, QueryDefinition, Condition,
        getConfigurationFromLocalStorage, fileToBase64, redrawComponent } = window.Therefore;
```

---

## Authentication

### From the Therefore Portal (recommended)

When the eform runs inside the Therefore web portal, auth tokens are already stored in
`localStorage` by the portal. Read them with:

```javascript
const config = getConfigurationFromLocalStorage();
// config: { token, apiUrl, tenant, username, isAnonymous }

if (!config || !config.apiUrl) throw new Error('Therefore config not found in localStorage');

const client = new ThereforeClient({
    baseUrl: config.apiUrl,
    token:   config.token,
    tenant:  config.tenant,
});
```

### Basic Auth (testing / non-portal contexts)

```javascript
const client = new ThereforeClient({
    baseUrl:  'https://yourtenant.thereforeonline.com/theservice/v0001/restun',
    username: 'your.username',
    password: 'your-password',
    tenant:   'yourtenant',
});
```

Auth method is selected automatically: if `token` is set it uses Bearer; if `username`+`password`
are set it uses Basic Auth.

---

## ThereforeClient — Method Reference

### Low-level

```javascript
await client.execute(operation, data, method = 'POST')  // raw API call
await client.executeGet(operation, params)               // GET with query params
```

### Documents

```javascript
await client.createDocument(new CreateDocumentParams(categoryNo, indexData, streams))
await client.getDocument(new GetDocumentParams({ DocNo, IsIndexDataValuesNeeded, ... }))
await client.getDocumentIndexData(docNo)   // returns GetDocumentIndexDataResponse
await client.updateDocument2(docNo, indexDataItems, { lastChangeTime, lastChangeTimeISO8601, checkInComments })
await client.addStreamsToDocument(docNo, streams)
await client.getDocumentStream(docNo, streamNo)
await client.checkOutDocument(docNo)
await client.checkInDocument(docNo, comment)
await client.deleteDocument(docNo)
```

**`updateDocument2`** auto-fetches `LastChangeTime` with an extra API call if not provided:

```javascript
// Auto-fetch (one extra round-trip):
await client.updateDocument2(docNo, new IndexData().addString('Notes', 'text').IndexDataItems);

// Pass explicitly (avoid the extra call when you already have it):
const current = await client.getDocumentIndexData(docNo);
await client.updateDocument2(docNo, indexDataItems, {
    lastChangeTime:      current.IndexData.LastChangeTime,
    lastChangeTimeISO8601: current.IndexData.LastChangeTimeISO8601,
});
```

### Querying

```javascript
// Synchronous (small result sets)
await client.executeSingleQuery({ Query: queryDefinition })

// Async — fetches ALL pages, releases session automatically
await client.executeAsyncSingleQuery({ Query: queryDefinition }, maxRows = 0)
// maxRows=0 → all rows; maxRows=N → stop after N rows
```

**Result structure:**
```javascript
const result = await client.executeAsyncSingleQuery({ Query: query });
// result.QueryResult.Columns  — parallel to IndexValues
// result.QueryResult.ResultRows[i].IndexValues[j]
// result.TotalRows

const columns = result.QueryResult.Columns;
for (const row of result.QueryResult.ResultRows) {
    const fields = {};
    columns.forEach((col, i) => { fields[col.ColName || col.Caption] = row.IndexValues[i]; });
    console.log(row.DocNo, fields);
}
```

### Referenced Tables

```javascript
const result = await client.queryReferencedTable(
    'Your_Table_Name',
    [{ FieldNoOrName: 'Entity', Condition: '*' }],
    { maxRows: 5000, blockSize: 1000 }
);
// result: { dataTypeNo, categoryNo, name, columns, rowCount, rows }
// rows[i].IndexValues maps positionally to columns[i]
```

### Categories & Keywords

```javascript
await client.getCategoryNoFromName('Invoice Processing')  // → number | null
await client.getCategoryInfo(categoryNo)
await client.getKeywordsByFieldNo(fieldNo, categoryNo)    // → GetKeywordsByFieldNoResponse
// response.findKeywordNo('Approved')   → KeywordNo (case-insensitive) or null
// response.Keywords                    → [{ KeywordNo, KeywordName }]
```

### Reference Number

```javascript
const refNo = await client.getReferenceNumber('Invoice Reference Numbers')
// Queries a dedicated auto-numbering category; returns the generated reference string
```

### Cases

```javascript
await client.createCase(new CreateCaseParams(caseDef, indexData))
await client.getCase(caseNo)
await client.deleteCase(caseNo)
```

### Workflow

```javascript
await client.startWorkflowInstance(docNo, processNo)
await client.claimWorkflowInstance(instanceNo, tokenNo)
await client.finishCurrentWorkflowTask(instanceNo, tokenNo, nextTaskNo, options)
```

### Users & System

```javascript
await client.getConnectedUser()
await client.addComment(docNo, text)
await client.getComments(objNo, maxCount, objType)
```

---

## IndexData Builder

Fluent builder for constructing index data items for create/update operations.

```javascript
const { IndexData } = window.Therefore;

const indexData = new IndexData()
    .addString('Invoice_No', 'INV-2024-001')
    .addString(101, 'value')           // by FieldNo
    .addInt('Page_Count', 12)
    .addMoney('Amount', 1500.00)
    .addDate('Invoice_Date', '2024-03-15')
    .addDate('Due_Date', new Date())
    .addDateTime('Processed_At', new Date())
    .addLogical('Is_Approved', true)
    .addKeyword('Status', 'Approved')       // by display name → FieldName gets '_Text' suffix
    .addKeywordByNo('Status', 42)           // by KeywordNo → no suffix
    .addMultiKeyword('Tags', ['Urgent', 'Finance'])
    .addMultiKeyword('Tags', [10, 11])
    .addMultiKeyword('Tags', ['Urgent', 10]);  // mix names and numbers

// Pass to API calls:
indexData.IndexDataItems   // the raw array
```

**Keyword field rules:**
- `addKeyword(name, displayString)` → FieldName becomes `name + '_Text'` (Therefore convention for name-based lookup)
- `addKeywordByNo(name, keywordNo)` → FieldName stays as `name` (use when you have the numeric ID)
- For `updateDocument2`, resolve display names to `KeywordNo` first via `getKeywordsByFieldNo`

---

## QueryDefinition & Condition

```javascript
const { QueryDefinition, Condition } = window.Therefore;

const query = new QueryDefinition({
    categoryNo:      8,
    conditions:      [
        new Condition('Invoice_No', '67307PAOP'),          // exact match
        new Condition('Amount', '>= 1000'),                 // comparison
        new Condition('Status', 'LIKE Approved*'),          // wildcard — use * not %
        new Condition('Notes', 'IS NULL'),                  // null check
        new Condition('Invoice_Date', '>= 2024-01-01', 'UTC'),  // with timezone
    ],
    selectedFields:  ['Invoice_No', 'Amount', 'Status'],   // omit = all fields
    orderByFields:   ['Invoice_Date'],
    maxRows:         100,
});
```

**Condition syntax:**
| Pattern | Example |
|---------|---------|
| Exact match | `new Condition('Field', 'value')` |
| Comparison | `new Condition('Field', '>= 1000')` |
| Wildcard | `new Condition('Field', 'LIKE Acme*')` — `*` not `%` |
| Match all | `new Condition('Field', '*')` |
| IS NULL | `new Condition('Field', 'IS NULL')` |
| IS NOT NULL | `new Condition('Field', 'IS NOT NULL')` |

---

## Utilities

### fileToBase64

Convert a browser `File` or `Blob` to base64 for stream uploads:

```javascript
const { fileToBase64 } = window.Therefore;

const file = fileInput.files[0];
const base64 = await fileToBase64(file);

await client.addStreamsToDocument(docNo, [{
    StreamNo: 1,
    FileName: file.name,
    FileDataBase64JSON: base64,
    NewStreamInsertMode: 0,
}]);
```

### redrawComponent

Force a Formio component to re-render after data changes:

```javascript
const { redrawComponent } = window.Therefore;
redrawComponent('mySelectField');     // triggers triggerChange + triggerRedraw
redrawComponent('myDataGrid');
```

---

## Formio Integration Patterns

### Custom Action on form load (populate a Select)

```javascript
// In a Formio "Custom Action" triggered on form load event:
(async () => {
    try {
        const { ThereforeClient, getConfigurationFromLocalStorage } = window.Therefore;
        const config = getConfigurationFromLocalStorage();
        const client = new ThereforeClient({ baseUrl: config.apiUrl, token: config.token, tenant: config.tenant });

        const result = await client.queryReferencedTable(
            'Sumitomo_Approver_Entity',
            [{ FieldNoOrName: 'Entity', Condition: '*' }]
        );

        const items = result.rows.map(row => ({
            label: `${row.IndexValues[2]} (${row.IndexValues[0]})`,
            value: row.IndexValues[1],
        }));

        const sel = utils.getComponent(form.components, 'approverSelect');
        if (sel) sel.setItems(items);

    } catch (err) {
        console.error('Therefore load failed:', err);
        instance.setAlert('danger', 'Failed to load approvers: ' + err.message);
    }
})();
```

### Save index data on form submit

```javascript
(async () => {
    try {
        const { ThereforeClient, IndexData, SaveDocumentIndexDataQuickParams,
                getConfigurationFromLocalStorage } = window.Therefore;

        const config = getConfigurationFromLocalStorage();
        const client = new ThereforeClient({ baseUrl: config.apiUrl, token: config.token, tenant: config.tenant });

        const docNo = data.thereforeDocNo;
        const indexData = new IndexData()
            .addString('Submitter_Name', data.fullName)
            .addString('Email', data.email)
            .addDate('Submission_Date', new Date())
            .addLogical('Terms_Accepted', data.termsAccepted)
            .addKeyword('Status', data.statusDropdown);

        await client.execute('SaveDocumentIndexDataQuick',
            new SaveDocumentIndexDataQuickParams(docNo, indexData));

    } catch (err) {
        console.error('Therefore save failed:', err);
        instance.setAlert('danger', 'Save failed: ' + err.message);
    }
})();
```

### Attach uploaded files to a document

```javascript
const { fileToBase64, AddStreamsToDocumentParams } = window.Therefore;

const streams = await Promise.all(
    Array.from(fileInput.files).map(async (file, i) => ({
        StreamNo: i + 1,
        FileName: file.name,
        FileDataBase64JSON: await fileToBase64(file),
        NewStreamInsertMode: 0,
    }))
);
await client.addStreamsToDocument(docNo, streams);
```

---

## window.Therefore — Full Export

```javascript
window.Therefore = {
    // Core
    ThereforeClient, getConfigurationFromLocalStorage, fileToBase64, redrawComponent,

    // Index data
    IndexData, SaveDocumentIndexDataParams, SaveDocumentIndexDataQuickParams,
    UpdateDocumentParams, UpdateDocument2Params, AddStreamsToDocumentParams,

    // Documents
    CreateDocumentParams, GetDocumentParams, CheckOutDocumentParams,
    CheckInDocumentParams, DeleteDocumentParams, GetDocumentStreamParams,
    CreateDocumentResponse, GetDocumentResponse, GetDocumentStreamResponse,
    GetDocumentIndexDataResponse,

    // Queries
    Condition, QueryDefinition, ResultRow, QueryResult,
    ExecuteSingleQueryParams, ExecuteMultiQueryParams, ExecuteMultiQueryResponse,

    // Keywords
    GetKeywordsByFieldNoParams, GetKeywordsByFieldNoResponse,

    // Cases
    CreateCaseParams, GetCaseParams,

    // Workflow
    GetWorkflowHistoryParams, GetWorkflowHistoryResponse,
    GetWorkflowInstanceParams, GetWorkflowInstanceResponse,
    StartWorkflowInstanceParams, ClaimWorkflowInstanceParams,
    FinishCurrentWorkflowTaskParams,

    // Users
    CreateUserParams, ExecuteUsersQueryParams, ExecuteUsersQueryResponse,
    GetUserDetailsParams, GetUserDetailsResponse,

    // Categories
    GetCategoriesTreeParams, GetCategoriesTreeResponse,
    GetCategoryInfoParams, GetCategoryInfoResponse,

    // Auth
    GetJWTTokenParams,

    // Comments
    AddCommentParams,
}
```

---

## Key API Quirks (JavaScript context)

- **Wildcard is `*` not `%`** — `LIKE Acme%` returns 0 results silently
- **Exact match condition** — bare value, no `=` prefix: `new Condition('Field', 'value')` not `'= value'`
- **Keywords need numeric IDs for `updateDocument2`** — use `getKeywordsByFieldNo` + `findKeywordNo` to resolve display names; `addKeyword()` on `IndexData` handles this automatically for `SaveDocumentIndexDataQuick`
- **`executeAsyncSingleQuery` returns first page in initial response** — the library handles this internally; you just get a merged result
- **`TenantName` header** — set via `tenant` in constructor options; required for Therefore Online
- **`getConfigurationFromLocalStorage`** reads `infrastructureInfo` and `loginInfo` keys from `localStorage` — these are set by the Therefore web portal on login
